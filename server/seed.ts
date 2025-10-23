import { storage } from "./storage";

export async function seedDatabase() {
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

  // Create some vacation requests
  await Promise.all([
    storage.createVacationRequest({
      workerId: workers[0].id,
      year: 2026,
      firstChoiceStart: "2026-07-06",
      firstChoiceEnd: "2026-07-31",
      secondChoiceStart: "2026-08-03",
      secondChoiceEnd: "2026-08-28",
      status: "pending",
      allocatedChoice: null
    }),
    storage.createVacationRequest({
      workerId: workers[1].id,
      year: 2026,
      firstChoiceStart: "2026-07-13",
      firstChoiceEnd: "2026-08-02",
      secondChoiceStart: "2026-06-01",
      secondChoiceEnd: "2026-06-26",
      status: "pending",
      allocatedChoice: null
    }),
    storage.createVacationRequest({
      workerId: workers[2].id,
      year: 2026,
      firstChoiceStart: "2026-06-01",
      firstChoiceEnd: "2026-06-26",
      secondChoiceStart: "2026-09-07",
      secondChoiceEnd: "2026-10-02",
      status: "approved",
      allocatedChoice: "first"
    }),
  ]);

  console.log("Database seeded successfully!");
  console.log(`Created ${workers.length} workers and 3 vacation requests`);
}
