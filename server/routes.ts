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

// Helper function to check if two date ranges overlap
function dateRangesOverlap(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 <= e2 && s2 <= e1;
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
    first: { start: string; end: string };
    second: { start: string; end: string };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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
        if (dateRangesOverlap(
          req1.firstChoiceStart, 
          req1.firstChoiceEnd,
          req2.firstChoiceStart,
          req2.firstChoiceEnd
        )) {
          conflictTypes.push('first-first');
        }
        
        if (dateRangesOverlap(
          req1.firstChoiceStart, 
          req1.firstChoiceEnd,
          req2.secondChoiceStart,
          req2.secondChoiceEnd
        )) {
          conflictTypes.push('first-second');
        }
        
        if (dateRangesOverlap(
          req1.secondChoiceStart, 
          req1.secondChoiceEnd,
          req2.firstChoiceStart,
          req2.firstChoiceEnd
        )) {
          conflictTypes.push('second-first');
        }
        
        if (dateRangesOverlap(
          req1.secondChoiceStart, 
          req1.secondChoiceEnd,
          req2.secondChoiceStart,
          req2.secondChoiceEnd
        )) {
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
            first: {
              start: req1.firstChoiceStart,
              end: req1.firstChoiceEnd
            },
            second: {
              start: req1.secondChoiceStart,
              end: req1.secondChoiceEnd
            }
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
      
      // Validate dates are in 2026
      if (!isDateIn2026(validatedData.firstChoiceStart) || 
          !isDateIn2026(validatedData.firstChoiceEnd) ||
          !isDateIn2026(validatedData.secondChoiceStart) || 
          !isDateIn2026(validatedData.secondChoiceEnd)) {
        return res.status(400).json({ error: "All dates must be in 2026" });
      }
      
      // Validate start dates are before end dates
      if (new Date(validatedData.firstChoiceStart) >= new Date(validatedData.firstChoiceEnd)) {
        return res.status(400).json({ error: "First choice start date must be before end date" });
      }
      if (new Date(validatedData.secondChoiceStart) >= new Date(validatedData.secondChoiceEnd)) {
        return res.status(400).json({ error: "Second choice start date must be before end date" });
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
      
      // Calculate weeks for both choices
      const firstChoiceWeeks = calculateWeeks(validatedData.firstChoiceStart, validatedData.firstChoiceEnd);
      const secondChoiceWeeks = calculateWeeks(validatedData.secondChoiceStart, validatedData.secondChoiceEnd);
      
      // Validate against seniority-based entitlement
      if (firstChoiceWeeks > weeksEntitled) {
        return res.status(400).json({ 
          error: `First choice (${firstChoiceWeeks} weeks) exceeds entitlement (${weeksEntitled} weeks)` 
        });
      }
      if (secondChoiceWeeks > weeksEntitled) {
        return res.status(400).json({ 
          error: `Second choice (${secondChoiceWeeks} weeks) exceeds entitlement (${weeksEntitled} weeks)` 
        });
      }
      
      const request = await storage.createVacationRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
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
      
      // Track allocated date ranges
      const allocatedRanges: Array<{ start: string; end: string }> = [];
      const results: Array<{ requestId: string; status: string; allocatedChoice: string }> = [];
      
      // Process requests in seniority order
      for (const { request, worker } of requestsWithWorkers) {
        let allocated = false;
        
        // Try first choice
        const firstChoiceConflicts = allocatedRanges.some(range =>
          dateRangesOverlap(
            request.firstChoiceStart,
            request.firstChoiceEnd,
            range.start,
            range.end
          )
        );
        
        if (!firstChoiceConflicts) {
          // Allocate first choice
          allocatedRanges.push({
            start: request.firstChoiceStart,
            end: request.firstChoiceEnd
          });
          await storage.updateVacationRequestStatus(request.id, 'approved', 'first');
          results.push({ 
            requestId: request.id, 
            status: 'approved', 
            allocatedChoice: 'first' 
          });
          allocated = true;
        } else {
          // Try second choice
          const secondChoiceConflicts = allocatedRanges.some(range =>
            dateRangesOverlap(
              request.secondChoiceStart,
              request.secondChoiceEnd,
              range.start,
              range.end
            )
          );
          
          if (!secondChoiceConflicts) {
            // Allocate second choice
            allocatedRanges.push({
              start: request.secondChoiceStart,
              end: request.secondChoiceEnd
            });
            await storage.updateVacationRequestStatus(request.id, 'approved', 'second');
            results.push({ 
              requestId: request.id, 
              status: 'approved', 
              allocatedChoice: 'second' 
            });
            allocated = true;
          }
        }
        
        // If neither choice could be allocated, deny the request
        if (!allocated) {
          await storage.updateVacationRequestStatus(request.id, 'denied', null);
          results.push({ 
            requestId: request.id, 
            status: 'denied', 
            allocatedChoice: 'none' 
          });
        }
      }
      
      res.json({
        success: true,
        processed: results.length,
        results
      });
    } catch (error) {
      res.status(500).json({ error: "Auto-allocation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
