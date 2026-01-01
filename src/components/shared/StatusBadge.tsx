import { cn } from '@/lib/utils';

type StatusType = 'paid' | 'pending' | 'overdue' | 'active' | 'approved' | 'rejected' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  paid: 'status-paid',
  completed: 'status-paid',
  approved: 'status-approved',
  active: 'status-paid',
  pending: 'status-pending',
  overdue: 'status-overdue',
  rejected: 'status-rejected',
  failed: 'status-rejected',
};

const statusLabels: Record<StatusType, string> = {
  paid: 'Paid',
  completed: 'Completed',
  approved: 'Approved',
  active: 'Active',
  pending: 'Pending',
  overdue: 'Overdue',
  rejected: 'Rejected',
  failed: 'Failed',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', statusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  );
}
