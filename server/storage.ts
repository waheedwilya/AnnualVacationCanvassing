import { 
  type Worker, 
  type InsertWorker,
  type VacationRequest,
  type InsertVacationRequest,
  workers,
  vacationRequests
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Worker operations
  getWorker(id: string): Promise<Worker | undefined>;
  getAllWorkers(): Promise<Worker[]>;
  getWorkersByDepartment(department: string): Promise<Worker[]>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  
  // Vacation request operations
  getVacationRequest(id: string): Promise<VacationRequest | undefined>;
  getAllVacationRequests(): Promise<VacationRequest[]>;
  getVacationRequestsByWorker(workerId: string): Promise<VacationRequest[]>;
  getVacationRequestsByYear(year: number): Promise<VacationRequest[]>;
  getPendingVacationRequests(): Promise<VacationRequest[]>;
  createVacationRequest(request: InsertVacationRequest): Promise<VacationRequest>;
  updateVacationRequestStatus(id: string, status: string, allocatedChoice?: string | null): Promise<VacationRequest | undefined>;
}

export class MemStorage implements IStorage {
  private workers: Map<string, Worker>;
  private vacationRequests: Map<string, VacationRequest>;

  constructor() {
    this.workers = new Map();
    this.vacationRequests = new Map();
  }

  // Worker operations
  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async getAllWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async getWorkersByDepartment(department: string): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter(
      (worker) => worker.department === department
    );
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const id = randomUUID();
    const worker: Worker = { 
      ...insertWorker, 
      id,
      weeksEntitled: insertWorker.weeksEntitled ?? 6
    };
    this.workers.set(id, worker);
    return worker;
  }

  // Vacation request operations
  async getVacationRequest(id: string): Promise<VacationRequest | undefined> {
    return this.vacationRequests.get(id);
  }

  async getAllVacationRequests(): Promise<VacationRequest[]> {
    return Array.from(this.vacationRequests.values());
  }

  async getVacationRequestsByWorker(workerId: string): Promise<VacationRequest[]> {
    return Array.from(this.vacationRequests.values()).filter(
      (request) => request.workerId === workerId
    );
  }

  async getVacationRequestsByYear(year: number): Promise<VacationRequest[]> {
    return Array.from(this.vacationRequests.values()).filter(
      (request) => request.year === year
    );
  }

  async getPendingVacationRequests(): Promise<VacationRequest[]> {
    return Array.from(this.vacationRequests.values()).filter(
      (request) => request.status === 'pending'
    );
  }

  async createVacationRequest(insertRequest: InsertVacationRequest): Promise<VacationRequest> {
    const id = randomUUID();
    const request: VacationRequest = { 
      ...insertRequest, 
      id,
      status: insertRequest.status ?? 'pending',
      year: insertRequest.year ?? 2026,
      allocatedChoice: insertRequest.allocatedChoice ?? null,
      submittedAt: new Date()
    };
    this.vacationRequests.set(id, request);
    return request;
  }

  async updateVacationRequestStatus(
    id: string, 
    status: string, 
    allocatedChoice?: string | null
  ): Promise<VacationRequest | undefined> {
    const request = this.vacationRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = {
      ...request,
      status,
      allocatedChoice: allocatedChoice !== undefined ? allocatedChoice : request.allocatedChoice
    };
    this.vacationRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

// PostgreSQL storage implementation using Drizzle ORM
export class PgStorage implements IStorage {
  private db;

  constructor(connectionString: string) {
    const sql = neon(connectionString);
    this.db = drizzle({ client: sql });
  }

  // Worker operations
  async getWorker(id: string): Promise<Worker | undefined> {
    const result = await this.db
      .select()
      .from(workers)
      .where(eq(workers.id, id))
      .limit(1);
    return result[0];
  }

  async getAllWorkers(): Promise<Worker[]> {
    return await this.db.select().from(workers);
  }

  async getWorkersByDepartment(department: string): Promise<Worker[]> {
    return await this.db
      .select()
      .from(workers)
      .where(eq(workers.department, department));
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const result = await this.db
      .insert(workers)
      .values(insertWorker)
      .returning();
    return result[0];
  }

  // Vacation request operations
  async getVacationRequest(id: string): Promise<VacationRequest | undefined> {
    const result = await this.db
      .select()
      .from(vacationRequests)
      .where(eq(vacationRequests.id, id))
      .limit(1);
    return result[0];
  }

  async getAllVacationRequests(): Promise<VacationRequest[]> {
    return await this.db.select().from(vacationRequests);
  }

  async getVacationRequestsByWorker(workerId: string): Promise<VacationRequest[]> {
    return await this.db
      .select()
      .from(vacationRequests)
      .where(eq(vacationRequests.workerId, workerId));
  }

  async getVacationRequestsByYear(year: number): Promise<VacationRequest[]> {
    return await this.db
      .select()
      .from(vacationRequests)
      .where(eq(vacationRequests.year, year));
  }

  async getPendingVacationRequests(): Promise<VacationRequest[]> {
    return await this.db
      .select()
      .from(vacationRequests)
      .where(eq(vacationRequests.status, 'pending'));
  }

  async createVacationRequest(insertRequest: InsertVacationRequest): Promise<VacationRequest> {
    const result = await this.db
      .insert(vacationRequests)
      .values(insertRequest)
      .returning();
    return result[0];
  }

  async updateVacationRequestStatus(
    id: string, 
    status: string, 
    allocatedChoice?: string | null
  ): Promise<VacationRequest | undefined> {
    const updates: any = { status };
    if (allocatedChoice !== undefined) {
      updates.allocatedChoice = allocatedChoice;
    }
    
    const result = await this.db
      .update(vacationRequests)
      .set(updates)
      .where(eq(vacationRequests.id, id))
      .returning();
    
    return result[0];
  }
}

// Use PostgreSQL if DATABASE_URL is available, otherwise use in-memory storage
export const storage = process.env.DATABASE_URL 
  ? new PgStorage(process.env.DATABASE_URL)
  : new MemStorage();
