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
  if (!dateStr || typeof dateStr !== 'string') return false;
  // Parse date string (format: YYYY-MM-DD)
  // Use UTC to avoid timezone issues
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return false;
  const year = parseInt(dateMatch[1], 10);
  return year === 2026;
}

// Helper function to check if two week arrays have any overlap
function weeksOverlap(weeks1: string[] | null | undefined, weeks2: string[] | null | undefined): boolean {
  // Handle null/undefined cases
  if (!weeks1 || !weeks2 || weeks1.length === 0 || weeks2.length === 0) {
    return false;
  }
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
        const worker2 = workerMap.get(req2.workerId);
        if (!worker2) continue;
        
        // Only check conflicts within the same department
        if (worker1.department !== worker2.department) continue;
        
        const conflictTypes: string[] = [];
        
        // Get weeks for both requests (prioritized or legacy)
        const req1Weeks = req1.prioritizedWeeks || 
          [...(req1.firstChoiceWeeks || []), ...(req1.secondChoiceWeeks || [])];
        const req2Weeks = req2.prioritizedWeeks || 
          [...(req2.firstChoiceWeeks || []), ...(req2.secondChoiceWeeks || [])];
        
        // Check if weeks overlap (for priority-based, just check overlap)
        if (weeksOverlap(req1Weeks, req2Weeks)) {
          conflictTypes.push('priority-overlap');
        }
        
        // Also check legacy combinations for backward compatibility
        if (req1.firstChoiceWeeks && req2.firstChoiceWeeks && weeksOverlap(req1.firstChoiceWeeks, req2.firstChoiceWeeks)) {
          conflictTypes.push('first-first');
        }
        if (req1.firstChoiceWeeks && req2.secondChoiceWeeks && weeksOverlap(req1.firstChoiceWeeks, req2.secondChoiceWeeks)) {
          conflictTypes.push('first-second');
        }
        if (req1.secondChoiceWeeks && req2.firstChoiceWeeks && weeksOverlap(req1.secondChoiceWeeks, req2.firstChoiceWeeks)) {
          conflictTypes.push('second-first');
        }
        if (req1.secondChoiceWeeks && req2.secondChoiceWeeks && weeksOverlap(req1.secondChoiceWeeks, req2.secondChoiceWeeks)) {
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
        // Get weeks (prioritized or legacy)
        const weeks = req1.prioritizedWeeks || 
          [...(req1.firstChoiceWeeks || []), ...(req1.secondChoiceWeeks || [])];
        
        conflicts.push({
          requestId: req1.id,
          workerId: req1.workerId,
          workerName: worker1.name,
          joiningDate: worker1.joiningDate,
          conflictingWith,
          choices: {
            first: req1.firstChoiceWeeks || [],
            second: req1.secondChoiceWeeks || [],
            prioritized: weeks
          }
        });
      }
    }
    
    res.json({
      totalConflicts: conflictSet.size,
      conflicts
    });
  });

  // Get conflicts for a specific worker (only weeks conflicting with higher seniority in same department)
  app.get("/api/vacation-requests/worker-conflicts/:workerId", async (req, res) => {
    const { workerId } = req.params;
    
    // Get worker's requests
    const workerRequests = await storage.getVacationRequestsByWorker(workerId);
    const pendingWorkerRequests = workerRequests.filter(r => r.status === 'pending');
    
    if (pendingWorkerRequests.length === 0) {
      return res.json({ conflictingWeeks: [] });
    }
    
    // Get the worker
    const worker = await storage.getWorker(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }
    
    // Get all pending requests and workers
    const allPendingRequests = await storage.getPendingVacationRequests();
    const allWorkers = await storage.getAllWorkers();
    const workerMap = new Map(allWorkers.map(w => [w.id, w]));
    
    const conflictingWeeks: string[] = [];
    
    // For each of the worker's requests
    for (const myRequest of pendingWorkerRequests) {
      // Get my weeks (prioritized or legacy)
      const myWeeks = myRequest.prioritizedWeeks || 
        [...(myRequest.firstChoiceWeeks || []), ...(myRequest.secondChoiceWeeks || [])];
      
      // Check against other workers' requests
      for (const otherRequest of allPendingRequests) {
        if (myRequest.id === otherRequest.id) continue;
        
        const otherWorker = workerMap.get(otherRequest.workerId);
        if (!otherWorker) continue;
        
        // Only check workers in the same department
        if (otherWorker.department !== worker.department) continue;
        
        // Only show conflicts with higher seniority workers (earlier joining date = more seniority)
        if (new Date(otherWorker.joiningDate) >= new Date(worker.joiningDate)) {
          continue;
        }
        
        // Get other worker's weeks (prioritized or legacy)
        const otherWeeks = otherRequest.prioritizedWeeks || 
          [...(otherRequest.firstChoiceWeeks || []), ...(otherRequest.secondChoiceWeeks || [])];
        
        // Check conflicts in my weeks
        myWeeks.forEach(week => {
          if (otherWeeks.includes(week)) {
            if (!conflictingWeeks.includes(week)) {
              conflictingWeeks.push(week);
            }
          }
        });
      }
    }
    
    res.json({ conflictingWeeks });
  });

  app.post("/api/vacation-requests", async (req, res) => {
    try {
      const validatedData = insertVacationRequestSchema.parse(req.body);
      
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
      
      // Handle new priority-based system
      if (validatedData.prioritizedWeeks && validatedData.prioritizedWeeks.length > 0) {
        // Validate all week dates are in 2026
        const invalidDates = validatedData.prioritizedWeeks.filter(date => !isDateIn2026(date));
        if (invalidDates.length > 0) {
          return res.status(400).json({ 
            error: `All weeks must be in 2026. Invalid dates: ${invalidDates.join(', ')}` 
          });
        }
        
        // Validate week count: must be between 1 and 2× entitlement
        const maxWeeks = weeksEntitled * 2;
        if (validatedData.prioritizedWeeks.length === 0) {
          return res.status(400).json({ 
            error: "You must select at least 1 priority week"
          });
        }
        if (validatedData.prioritizedWeeks.length > maxWeeks) {
          return res.status(400).json({ 
            error: `You can select up to ${maxWeeks} priority weeks (2× your entitlement of ${weeksEntitled} weeks). You selected ${validatedData.prioritizedWeeks.length} weeks.` 
          });
        }
        
        // Check for duplicates
        const uniqueWeeks = new Set(validatedData.prioritizedWeeks);
        if (uniqueWeeks.size !== validatedData.prioritizedWeeks.length) {
          return res.status(400).json({ error: "Duplicate weeks are not allowed" });
        }
      } else {
        // Legacy validation for first/second choice
        if (!validatedData.firstChoiceWeeks || !validatedData.secondChoiceWeeks) {
          return res.status(400).json({ error: "Must provide either prioritizedWeeks or both firstChoiceWeeks and secondChoiceWeeks" });
        }
        
        // Validate all week dates are in 2026
        const allWeeks = [...validatedData.firstChoiceWeeks, ...validatedData.secondChoiceWeeks];
        if (!allWeeks.every(isDateIn2026)) {
          return res.status(400).json({ error: "All weeks must be in 2026" });
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
      }
      
      const request = await storage.createVacationRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating vacation request:', error);
      if (error instanceof Error) {
        // Return more specific error messages
        if (error.name === 'ZodError') {
          const zodError = error as any;
          const errors = zodError.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || error.message;
          return res.status(400).json({ error: `Validation error: ${errors}` });
        }
        return res.status(400).json({ error: error.message || "Invalid vacation request data" });
      }
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
        weeksEntitled: number;
      }
      
      const requestsWithWorkers: RequestWithSeniority[] = pendingRequests
        .map(req => {
          const worker = workerMap.get(req.workerId);
          if (!worker) return null;
          const weeksEntitled = calculateVacationWeeks(worker.joiningDate);
          return { request: req, worker, weeksEntitled };
        })
        .filter((item): item is RequestWithSeniority => item !== null);
      
      // Sort by joining date (earlier = higher seniority)
      requestsWithWorkers.sort((a, b) => {
        return new Date(a.worker.joiningDate).getTime() - new Date(b.worker.joiningDate).getTime();
      });
      
      // Track allocated weeks per department (key: department, value: Set of week dates)
      const allocatedWeeksByDepartment = new Map<string, Set<string>>();
      
      // Initialize department tracking
      for (const worker of workers) {
        if (!allocatedWeeksByDepartment.has(worker.department)) {
          allocatedWeeksByDepartment.set(worker.department, new Set<string>());
        }
      }
      
      // Track approvals and denials for each request
      const requestResults = new Map<string, {
        approvedWeeks: string[];
        deniedWeeks: string[];
        weeksEntitled: number;
      }>();
      
      // Initialize results map
      for (const { request, weeksEntitled } of requestsWithWorkers) {
        requestResults.set(request.id, {
          approvedWeeks: [],
          deniedWeeks: [],
          weeksEntitled
        });
      }
      
      // Process requests by seniority, allocating weeks in priority order
      for (const { request, worker } of requestsWithWorkers) {
        const result = requestResults.get(request.id)!;
        const departmentWeeks = allocatedWeeksByDepartment.get(worker.department)!;
        
        // Get weeks in priority order (prioritizedWeeks or legacy first/second choice)
        let weeksToProcess: string[] = [];
        
        if (request.prioritizedWeeks && request.prioritizedWeeks.length > 0) {
          // New priority-based system: process weeks in priority order
          weeksToProcess = request.prioritizedWeeks;
        } else {
          // Legacy system: process first choice, then second choice
          weeksToProcess = [
            ...(request.firstChoiceWeeks || []),
            ...(request.secondChoiceWeeks || [])
          ];
        }
        
        // Process weeks in priority order (index 0 = highest priority)
        for (const week of weeksToProcess) {
          // Skip if already processed
          if (result.approvedWeeks.includes(week) || result.deniedWeeks.includes(week)) {
            continue;
          }
          
          if (result.approvedWeeks.length >= result.weeksEntitled) {
            // Already reached entitlement limit - deny remaining weeks
            result.deniedWeeks.push(week);
          } else if (departmentWeeks.has(week)) {
            // Week is already taken by higher seniority worker in same department
            result.deniedWeeks.push(week);
          } else {
            // Week is available in department and within entitlement - approve it
            result.approvedWeeks.push(week);
            departmentWeeks.add(week);
          }
        }
      }
      
      // PHASE 3: Update all requests in database
      const results: Array<{ 
        requestId: string; 
        approvedCount: number; 
        deniedCount: number;
        approvedWeeks: string[];
        deniedWeeks: string[];
      }> = [];
      
      for (const { request } of requestsWithWorkers) {
        const result = requestResults.get(request.id)!;
        
        // Get all weeks that should be processed
        const allWeeks = request.prioritizedWeeks || 
          [...(request.firstChoiceWeeks || []), ...(request.secondChoiceWeeks || [])];
        
        // Ensure all weeks are accounted for
        for (const week of allWeeks) {
          if (!result.approvedWeeks.includes(week) && !result.deniedWeeks.includes(week)) {
            result.deniedWeeks.push(week);
          }
        }
        
        // Update the request with individual week approvals/denials
        await storage.updateVacationRequestWeeks(
          request.id,
          result.approvedWeeks,
          result.deniedWeeks
        );
        
        // Update overall request status based on week allocation results
        if (result.approvedWeeks.length > 0) {
          // At least some weeks were approved - mark request as approved
          await storage.updateVacationRequestStatus(request.id, 'approved', null);
        } else {
          // No weeks were approved - mark request as denied
          await storage.updateVacationRequestStatus(request.id, 'denied', null);
        }
        
        results.push({ 
          requestId: request.id, 
          approvedCount: result.approvedWeeks.length,
          deniedCount: result.deniedWeeks.length,
          approvedWeeks: result.approvedWeeks,
          deniedWeeks: result.deniedWeeks
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

  // Revert individual week approval/denial
  app.post("/api/vacation-requests/:id/revert-week", async (req, res) => {
    try {
      const { week } = req.body;
      
      if (!week) {
        return res.status(400).json({ error: "Week is required" });
      }
      
      const request = await storage.getVacationRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      // Remove the week from both approved and denied lists
      const approvedWeeks = (request.approvedWeeks || []).filter((w: string) => w !== week);
      const deniedWeeks = (request.deniedWeeks || []).filter((w: string) => w !== week);
      
      await storage.updateVacationRequestWeeks(
        req.params.id,
        approvedWeeks,
        deniedWeeks
      );
      
      // If no more approved weeks, revert status to pending
      if (approvedWeeks.length === 0 && request.status === 'approved') {
        await storage.updateVacationRequestStatus(req.params.id, 'pending', null);
      }
      
      const updatedRequest = await storage.getVacationRequest(req.params.id);
      res.json(updatedRequest);
    } catch (error) {
      console.error('Revert week error:', error);
      res.status(500).json({ error: "Failed to revert week" });
    }
  });

  // Reset all approvals (all requests back to pending with no approved/denied weeks)
  app.post("/api/vacation-requests/reset-all", async (_req, res) => {
    try {
      const allRequests = await storage.getAllVacationRequests();
      
      let resetCount = 0;
      for (const request of allRequests) {
        // Clear all approved and denied weeks
        await storage.updateVacationRequestWeeks(request.id, [], []);
        
        // Set status back to pending
        if (request.status !== 'pending') {
          await storage.updateVacationRequestStatus(request.id, 'pending', null);
          resetCount++;
        }
      }
      
      res.json({
        success: true,
        resetCount,
        message: `Reset ${resetCount} requests to pending`
      });
    } catch (error) {
      console.error('Reset all error:', error);
      res.status(500).json({ error: "Failed to reset approvals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
