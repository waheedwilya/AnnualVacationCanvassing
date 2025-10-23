import MyRequestsList from '../MyRequestsList';

export default function MyRequestsListExample() {
  const requests = [
    {
      id: '1',
      choice: 'first' as const,
      weeks: [12, 13, 14, 15, 16, 17],
      status: 'awarded_first' as const,
      submittedDate: new Date('2024-12-15'),
    },
    {
      id: '2',
      choice: 'second' as const,
      weeks: [26, 27, 28, 29, 30, 31],
      status: 'pending' as const,
      submittedDate: new Date('2024-12-15'),
    },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <MyRequestsList requests={requests} />
    </div>
  );
}
