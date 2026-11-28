export const STAFF_ROLES = ['admin', 'approver', 'loan_officer'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && STAFF_ROLES.includes(role as StaffRole);
}

export function getStaffHome(role: StaffRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'approver':
      return '/approver';
    case 'loan_officer':
      return '/loan-officer';
  }
}

export function getStaffRoleLabel(role: StaffRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'approver':
      return 'Approver';
    case 'loan_officer':
      return 'Loan Officer';
  }
}
