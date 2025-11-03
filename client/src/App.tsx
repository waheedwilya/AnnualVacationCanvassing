import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/LoginPage";
import WorkerApp from "@/pages/WorkerApp";
import SupervisorApp from "@/pages/SupervisorApp";
import NotFound from "@/pages/not-found";

// Protected route wrapper for worker app
function ProtectedWorkerRoute() {
  const currentWorker = localStorage.getItem('currentWorker');
  
  if (!currentWorker) {
    return <Redirect to="/login" />;
  }
  
  return <WorkerApp />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={ProtectedWorkerRoute} />
      <Route path="/supervisor" component={SupervisorApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
