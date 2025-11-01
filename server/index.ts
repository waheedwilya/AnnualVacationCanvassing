import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./utils";
import { seedDatabase } from "./seed";

const app = express();

// Add health check endpoint for Azure
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("=== Starting application ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("PORT:", process.env.PORT || "5000 (default)");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "configured" : "not configured");
    
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Error handler:", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("Setting up Vite dev server...");
      // Use opaque import to prevent esbuild from bundling vite.ts
      // This works in development (tsx from source) but prevents bundling the dev-only 'vite' package
      const loadDevModule = (path: string) => new Function('p', 'return import(p)')(path);
      const { setupVite } = await loadDevModule("./vite.js");
      await setupVite(app, server);
    } else {
      console.log("Serving static files from dist...");
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`Attempting to bind to port ${port}...`);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      console.log(`✅ Server successfully listening on port ${port}`);
      log(`serving on port ${port}`);
      
      // Seed database AFTER server starts to prevent startup crashes
      try {
        // First ensure tables exist (especially important for Azure PostgreSQL)
        if (process.env.DATABASE_URL) {
          const { ensureTablesExist } = await import('./setup-tables.js');
          await ensureTablesExist(process.env.DATABASE_URL);
        }
        
        await seedDatabase();
      } catch (error) {
        log("Warning: Database seeding failed, but server is still running");
        console.error(error);
      }
    });
    
    // Handle server errors
    server.on('error', (err: any) => {
      console.error("❌ Server error:", err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error("❌ Fatal error during startup:", error);
    process.exit(1);
  }
})();
