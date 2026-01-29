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
  Wallet,
  BookOpen,
  UserCheck,
  Send,
  BookOpenCheck,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

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
  { label: 'Expected Loans', href: '/admin/expected', icon: Clock },
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
  const { user } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const navItems = user?.role === 'admin' ? adminNav : borrowerNav;
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      {/* Logo Header */}
      <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">LoanPro</span>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
