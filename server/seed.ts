import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if data already exists (idempotent seeding)
    const existingWorkers = await storage.getAllWorkers();
    if (existingWorkers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Create some workers
    const workers = await Promise.all([
      storage.createWorker({
        name: "John Smith",
        joiningDate: "2018-03-15",
        department: "Assembly",
        weeksEntitled: 6
      }),
      storage.createWorker({
        name: "Sarah Johnson",
        joiningDate: "2020-06-20",
        department: "Assembly",
        weeksEntitled: 5
      }),
      storage.createWorker({
        name: "Mike Chen",
        joiningDate: "2015-01-10",
        department: "Packaging",
        weeksEntitled: 6
      }),
      storage.createWorker({
        name: "Emily Davis",
        joiningDate: "2021-09-05",
        department: "Assembly",
        weeksEntitled: 4
      }),
    ]);

    // Create some vacation requests using new array-based week format
    await Promise.all([
      storage.createVacationRequest({
        workerId: workers[0].id,
        year: 2026,
        firstChoiceWeeks: ["2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"],
        secondChoiceWeeks: ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24"],
        status: "pending",
        allocatedChoice: null
      }),
      storage.createVacationRequest({
        workerId: workers[1].id,
        year: 2026,
        firstChoiceWeeks: ["2026-07-13", "2026-07-20", "2026-07-27"],
        secondChoiceWeeks: ["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22"],
        status: "pending",
        allocatedChoice: null
      }),
      storage.createVacationRequest({
        workerId: workers[2].id,
        year: 2026,
        firstChoiceWeeks: ["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22"],
        secondChoiceWeeks: ["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"],
        status: "approved",
        allocatedChoice: "first"
      }),
    ]);

    console.log("Database seeded successfully!");
    console.log(`Created ${workers.length} workers and 3 vacation requests`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
