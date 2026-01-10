import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  PlusCircle, 
  Users, 
  ClipboardList, 
  CreditCard, 
  Package,
  LogOut,
  Wallet,
  BookOpen,
  UserCheck,
  Send,
  BookOpenCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const borrowerNav: NavItem[] = [
  { label: 'Dashboard', href: '/borrower', icon: LayoutDashboard },
  { label: 'My Loans', href: '/borrower/loans', icon: FileText },
  { label: 'Repayment Schedule', href: '/borrower/schedule', icon: Calendar },
  { label: 'Apply for Loan', href: '/borrower/apply', icon: PlusCircle },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Client Approval', href: '/admin/approval', icon: UserCheck },
  { label: 'Disbursement', href: '/admin/disbursement', icon: Send },
  { label: 'Applications', href: '/admin/applications', icon: ClipboardList },
  { label: 'Record Payment', href: '/admin/payments', icon: CreditCard },
  { label: 'Loan Products', href: '/admin/products', icon: Package },
  { label: 'Loan Book', href: '/admin/loan-book', icon: BookOpenCheck },
  { label: 'Portfolio at Risk', href: '/admin/par', icon: AlertTriangle },
  { label: 'Ledger', href: '/admin/ledger', icon: BookOpen },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = user?.role === 'admin' ? adminNav : borrowerNav;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Wallet className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">LoanPro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'nav-link',
                  isActive && 'nav-link-active'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
