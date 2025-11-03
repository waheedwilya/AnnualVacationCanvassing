import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkerSchema, insertVacationRequestSchema } from "@shared/schema";
import { calculateVacationWeeks } from "@shared/utils";

// Helper function to calculate weeks between dates
// For Monday-Sunday weeks: Mon to Sun = 7 days = 1 week
function calculateWeeks(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  // Add 1 to include both start and end dates
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  // Round up to handle partial weeks
  return Math.ceil(diffDays / 7);
}

// Helper function to validate date is in 2026
function isDateIn2026(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date.getFullYear() === 2026;
}

// Helper function to check if two week arrays have any overlap
function weeksOverlap(weeks1: string[], weeks2: string[]): boolean {
  // Convert to Set for efficient lookup
  const set1 = new Set(weeks1);
  return weeks2.some(week => set1.has(week));
}

// Type for conflict information
interface ConflictInfo {
  requestId: string;
  workerId: string;
  workerName: string;
  joiningDate: string;
  conflictingWith: Array<{
    requestId: string;
    conflictType: string; // e.g., "first-first", "first-second", etc.
  }>;
  choices: {
    first: string[];
    second: string[];
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      const worker = await storage.getWorkerByPhone(phoneNumber);
      
      if (!worker) {
        return res.status(404).json({ error: "Worker not found with this phone number" });
      }
      
      // Return worker data (in a real app, you'd create a session here)
      res.json({ worker });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Worker routes
  app.get("/api/workers", async (_req, res) => {
    const workers = await storage.getAllWorkers();
    res.json(workers);
  });

  app.get("/api/workers/:id", async (req, res) => {
    const worker = await storage.getWorker(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }
    res.json(worker);
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const validatedData = insertWorkerSchema.parse(req.body);
      const worker = await storage.createWorker(validatedData);
      res.status(201).json(worker);
    } catch (error) {
      res.status(400).json({ error: "Invalid worker data" });
    }
  });

  // Vacation request routes
  app.get("/api/vacation-requests", async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const workerId = req.query.workerId as string | undefined;
    
    let requests;
    if (year) {
      requests = await storage.getVacationRequestsByYear(year);
    } else if (workerId) {
      requests = await storage.getVacationRequestsByWorker(workerId);
    } else {
      requests = await storage.getAllVacationRequests();
    }
    
    res.json(requests);
  });

  app.get("/api/vacation-requests/pending", async (_req, res) => {
    const requests = await storage.getPendingVacationRequests();
    res.json(requests);
  });

  app.get("/api/vacation-requests/conflicts", async (_req, res) => {
    const pendingRequests = await storage.getPendingVacationRequests();
    const workers = await storage.getAllWorkers();
    
    // Create worker map for quick lookup
    const workerMap = new Map(workers.map(w => [w.id, w]));
    
    const conflicts: ConflictInfo[] = [];
    const conflictSet = new Set<string>();
    
    // Check each request against all others for all choice combinations
    for (let i = 0; i < pendingRequests.length; i++) {
      const req1 = pendingRequests[i];
      const worker1 = workerMap.get(req1.workerId);
      if (!worker1) continue;
      
      const conflictingWith: Array<{ requestId: string; conflictType: string }> = [];
      
      for (let j = 0; j < pendingRequests.length; j++) {
        if (i === j) continue;
        
        const req2 = pendingRequests[j];
        
        const conflictTypes: string[] = [];
        
        // Check all combinations of choices and record which ones conflict
        if (weeksOverlap(req1.firstChoiceWeeks, req2.firstChoiceWeeks)) {
          conflictTypes.push('first-first');
        }
        
        if (weeksOverlap(req1.firstChoiceWeeks, req2.secondChoiceWeeks)) {
          conflictTypes.push('first-second');
        }
        
        if (weeksOverlap(req1.secondChoiceWeeks, req2.firstChoiceWeeks)) {
          conflictTypes.push('second-first');
        }
        
        if (weeksOverlap(req1.secondChoiceWeeks, req2.secondChoiceWeeks)) {
          conflictTypes.push('second-second');
        }
        
        if (conflictTypes.length > 0) {
          conflictingWith.push({
            requestId: req2.id,
            conflictType: conflictTypes.join(', ')
          });
          conflictSet.add(req1.id);
          conflictSet.add(req2.id);
        }
      }
      
      if (conflictingWith.length > 0) {
        conflicts.push({
          requestId: req1.id,
          workerId: req1.workerId,
          workerName: worker1.name,
          joiningDate: worker1.joiningDate,
          conflictingWith,
          choices: {
            first: req1.firstChoiceWeeks,
            second: req1.secondChoiceWeeks
          }
        });
      }
    }
    
    res.json({
      totalConflicts: conflictSet.size,
      conflicts
    });
  });

  app.post("/api/vacation-requests", async (req, res) => {
    try {
      const validatedData = insertVacationRequestSchema.parse(req.body);
      
      // Validate all week dates are in 2026
      const allWeeks = [...validatedData.firstChoiceWeeks, ...validatedData.secondChoiceWeeks];
      if (!allWeeks.every(isDateIn2026)) {
        return res.status(400).json({ error: "All weeks must be in 2026" });
      }
      
      // Get worker to check entitlement
      const worker = await storage.getWorker(validatedData.workerId);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }
      
      // Calculate seniority-based entitlement
      const weeksEntitled = calculateVacationWeeks(worker.joiningDate);
      
      // Check if worker is eligible for vacation (needs at least 1 year)
      if (weeksEntitled === 0) {
        return res.status(400).json({ 
          error: "Not eligible for vacation. You need at least 1 year of service." 
        });
      }
      
      // Validate week counts against entitlement
      const firstChoiceWeekCount = validatedData.firstChoiceWeeks.length;
      const secondChoiceWeekCount = validatedData.secondChoiceWeeks.length;
      
      if (firstChoiceWeekCount > weeksEntitled) {
        return res.status(400).json({ 
          error: `First choice (${firstChoiceWeekCount} weeks) exceeds entitlement (${weeksEntitled} weeks)` 
        });
      }
      if (secondChoiceWeekCount > weeksEntitled) {
        return res.status(400).json({ 
          error: `Second choice (${secondChoiceWeekCount} weeks) exceeds entitlement (${weeksEntitled} weeks)` 
        });
      }
      
      const request = await storage.createVacationRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating vacation request:', error);
      res.status(400).json({ error: "Invalid vacation request data" });
    }
  });

  app.patch("/api/vacation-requests/:id/status", async (req, res) => {
    const { status, allocatedChoice } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    // Allow allocatedChoice to be null to clear allocation
    const allocatedChoiceValue = req.body.hasOwnProperty('allocatedChoice') 
      ? allocatedChoice 
      : undefined;
    
    const request = await storage.updateVacationRequestStatus(
      req.params.id, 
      status, 
      allocatedChoiceValue
    );
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    res.json(request);
  });

  app.patch("/api/vacation-requests/:id/weeks", async (req, res) => {
    const { approvedWeeks, deniedWeeks } = req.body;
    
    if (!Array.isArray(approvedWeeks) || !Array.isArray(deniedWeeks)) {
      return res.status(400).json({ error: "approvedWeeks and deniedWeeks must be arrays" });
    }
    
    const request = await storage.updateVacationRequestWeeks(
      req.params.id,
      approvedWeeks,
      deniedWeeks
    );
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    res.json(request);
  });

  app.post("/api/vacation-requests/auto-allocate", async (_req, res) => {
    try {
      const pendingRequests = await storage.getPendingVacationRequests();
      const workers = await storage.getAllWorkers();
      
      // Create worker map for quick lookup
      const workerMap = new Map(workers.map(w => [w.id, w]));
      
      // Create a map of request to worker for sorting by seniority
      interface RequestWithSeniority {
        request: typeof pendingRequests[0];
        worker: typeof workers[0];
      }
      
      const requestsWithWorkers: RequestWithSeniority[] = pendingRequests
        .map(req => {
          const worker = workerMap.get(req.workerId);
          return worker ? { request: req, worker } : null;
        })
        .filter((item): item is RequestWithSeniority => item !== null);
      
      // Sort by joining date (earlier = higher seniority)
      requestsWithWorkers.sort((a, b) => {
        return new Date(a.worker.joiningDate).getTime() - new Date(b.worker.joiningDate).getTime();
      });
      
      // Track allocated weeks globally
      const allocatedWeeks = new Set<string>();
      const results: Array<{ 
        requestId: string; 
        approvedCount: number; 
        deniedCount: number;
        approvedWeeks: string[];
        deniedWeeks: string[];
      }> = [];
      
      // Process requests in seniority order
      for (const { request, worker } of requestsWithWorkers) {
        const approvedWeeks: string[] = [];
        const deniedWeeks: string[] = [];
        
        // Calculate entitlement for this worker
        const weeksEntitled = calculateVacationWeeks(worker.joiningDate);
        
        // Process first choice weeks first (preferred)
        for (const week of request.firstChoiceWeeks) {
          if (approvedWeeks.length >= weeksEntitled) {
            // Already reached entitlement limit
            deniedWeeks.push(week);
          } else if (allocatedWeeks.has(week)) {
            // Week is already taken by higher seniority worker
            deniedWeeks.push(week);
          } else {
            // Week is available and within entitlement - approve it
            approvedWeeks.push(week);
            allocatedWeeks.add(week);
          }
        }
        
        // If still under entitlement, try second choice weeks
        if (approvedWeeks.length < weeksEntitled) {
          for (const week of request.secondChoiceWeeks) {
            // Skip if already processed (duplicate between choices)
            if (approvedWeeks.includes(week) || deniedWeeks.includes(week)) {
              continue;
            }
            
            if (approvedWeeks.length >= weeksEntitled) {
              // Already reached entitlement limit
              deniedWeeks.push(week);
            } else if (allocatedWeeks.has(week)) {
              // Week is already taken by higher seniority worker
              deniedWeeks.push(week);
            } else {
              // Week is available and within entitlement - approve it
              approvedWeeks.push(week);
              allocatedWeeks.add(week);
            }
          }
        }
        
        // Any second choice weeks that weren't processed should be denied
        for (const week of request.secondChoiceWeeks) {
          if (!approvedWeeks.includes(week) && !deniedWeeks.includes(week)) {
            deniedWeeks.push(week);
          }
        }
        
        // Update the request with individual week approvals/denials
        await storage.updateVacationRequestWeeks(
          request.id,
          approvedWeeks,
          deniedWeeks
        );
        
        // Update overall request status based on week allocation results
        if (approvedWeeks.length > 0) {
          // At least some weeks were approved - mark request as approved
          await storage.updateVacationRequestStatus(request.id, 'approved', null);
        } else {
          // No weeks were approved - mark request as denied
          await storage.updateVacationRequestStatus(request.id, 'denied', null);
        }
        
        results.push({ 
          requestId: request.id, 
          approvedCount: approvedWeeks.length,
          deniedCount: deniedWeeks.length,
          approvedWeeks,
          deniedWeeks
        });
      }
      
      res.json({
        success: true,
        processed: results.length,
        results
      });
    } catch (error) {
      console.error('Auto-allocation error:', error);
      res.status(500).json({ error: "Auto-allocation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
