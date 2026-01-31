import { cn } from '@/lib/utils';

type StatusType = 'paid' | 'pending' | 'overdue' | 'active' | 'approved' | 'rejected' | 'completed' | 'failed' | 'disbursed' | 'applied';

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
  applied: 'status-pending',
  overdue: 'status-overdue',
  rejected: 'status-rejected',
  failed: 'status-rejected',
  disbursed: 'status-paid',
};

const statusLabels: Record<StatusType, string> = {
  paid: 'Paid',
  completed: 'Completed',
  approved: 'Approved',
  active: 'Active',
  pending: 'Pending',
  applied: 'Applied',
  overdue: 'Overdue',
  rejected: 'Rejected',
  failed: 'Failed',
  disbursed: 'Disbursed',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', statusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  );
}
