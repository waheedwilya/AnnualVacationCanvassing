import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-6">
      <StatusBadge status="pending" />
      <StatusBadge status="awarded_first" />
      <StatusBadge status="awarded_second" />
      <StatusBadge status="denied" />
      <StatusBadge status="conflict" />
    </div>
  );
}
