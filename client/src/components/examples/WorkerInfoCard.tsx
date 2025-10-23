import WorkerInfoCard from '../WorkerInfoCard';

export default function WorkerInfoCardExample() {
  return (
    <div className="space-y-6 p-6">
      <WorkerInfoCard
        name="Andy Stouffer"
        joiningDate={new Date('1988-04-04')}
        yearsOfService={37}
        weeksOfVacation={6}
        department="Assembly Line A"
      />
      <WorkerInfoCard
        name="Sarah Martinez"
        joiningDate={new Date('2015-06-15')}
        yearsOfService={10}
        weeksOfVacation={4}
        department="Quality Control"
        compact
      />
    </div>
  );
}
