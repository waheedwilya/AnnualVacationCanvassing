import WorkerDashboard from '../WorkerDashboard';

export default function WorkerDashboardExample() {
  return (
    <div className="p-6">
      <WorkerDashboard
        workerName="Andy Stouffer"
        weeksEntitled={6}
        weeksRequested={6}
        weeksApproved={4}
        submissionDeadline={new Date('2025-01-10')}
        pendingRequests={2}
        approvedRequests={4}
      />
    </div>
  );
}
