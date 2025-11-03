import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if data already exists (idempotent seeding)
    const existingWorkers = await storage.getAllWorkers();
    if (existingWorkers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Create some workers with specified phone numbers and random seniority < 7 years
    const workers = await Promise.all([
      storage.createWorker({
        name: "Maria Rodriguez",
        phoneNumber: "5513759096",
        joiningDate: "2020-04-12",  // ~5 years seniority
        department: "Assembly",
        weeksEntitled: 5
      }),
      storage.createWorker({
        name: "James Thompson",
        phoneNumber: "2272185752",
        joiningDate: "2022-08-15",  // ~3 years seniority
        department: "Packaging",
        weeksEntitled: 4
      }),
      storage.createWorker({
        name: "Linda Martinez",
        phoneNumber: "2813527628",
        joiningDate: "2019-11-03",  // ~6 years seniority
        department: "Assembly",
        weeksEntitled: 5
      }),
    ]);

    // Create some vacation requests using new array-based week format
    await Promise.all([
      storage.createVacationRequest({
        workerId: workers[0].id,
        year: 2026,
        firstChoiceWeeks: ["2026-07-06", "2026-07-13", "2026-07-20"],
        secondChoiceWeeks: ["2026-08-03", "2026-08-10"],
        status: "pending",
        allocatedChoice: null
      }),
      storage.createVacationRequest({
        workerId: workers[1].id,
        year: 2026,
        firstChoiceWeeks: ["2026-07-13", "2026-07-20"],
        secondChoiceWeeks: ["2026-06-01", "2026-06-08", "2026-06-15"],
        status: "pending",
        allocatedChoice: null
      }),
    ]);

    console.log("Database seeded successfully!");
    console.log(`Created ${workers.length} workers and 2 vacation requests`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
