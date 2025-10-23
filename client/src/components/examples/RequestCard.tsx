import RequestCard from '../RequestCard';

export default function RequestCardExample() {
  const sampleRequest = {
    id: '1',
    workerName: 'Sarah Martinez',
    joiningDate: new Date('2015-06-15'),
    yearsOfService: 10,
    weeksOfVacation: 4,
    department: 'Assembly Line B',
    requestedWeeks: [
      { week: 12, choice: 'first' as const },
      { week: 13, choice: 'first' as const },
      { week: 14, choice: 'first' as const },
      { week: 15, choice: 'first' as const },
      { week: 26, choice: 'second' as const },
      { week: 27, choice: 'second' as const },
      { week: 28, choice: 'second' as const },
      { week: 29, choice: 'second' as const },
    ],
    status: 'pending' as const,
    hasConflict: true,
    conflictDetails: '3 other workers requested week 12-13. Seniority-based allocation recommended.',
  };

  return (
    <div className="p-6 max-w-2xl">
      <RequestCard 
        request={sampleRequest}
        onApprove={(id) => console.log('Approved:', id)}
        onDeny={(id) => console.log('Denied:', id)}
      />
    </div>
  );
}
