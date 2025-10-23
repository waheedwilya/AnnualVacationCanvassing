import SupervisorDashboard from '../SupervisorDashboard';

export default function SupervisorDashboardExample() {
  return (
    <div className="p-6">
      <SupervisorDashboard
        totalRequests={24}
        pendingRequests={8}
        approvedRequests={12}
        conflicts={4}
        onAutoAllocate={() => console.log('Auto-allocation complete')}
      />
    </div>
  );
}
