import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CreditCard, 
  Package,
  Wallet,
  BookOpen,
  UserCheck,
  UserPlus,
  Send,
  BookOpenCheck,
  AlertTriangle,
  Clock,
  FilePlus,
  Users2
} from 'lucide-react';
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

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  // Client Management
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Client Approval', href: '/admin/pending-clients', icon: Users2 },
  { label: 'Staff Management', href: '/admin/staff', icon: UserPlus },
  // Loan Workflow
  { label: 'New Application', href: '/admin/applications/new', icon: FilePlus },
  { label: 'Applications', href: '/admin/applications', icon: ClipboardList },
  { label: 'Loan Approval', href: '/admin/approval', icon: UserCheck },
  { label: 'Disbursement', href: '/admin/disbursement', icon: Send },
  { label: 'Record Payment', href: '/admin/payments', icon: CreditCard },
  // Reports & Analytics
  { label: 'Loan Book', href: '/admin/loan-book', icon: BookOpenCheck },
  { label: 'Expected Loans', href: '/admin/expected', icon: Clock },
  { label: 'Portfolio at Risk', href: '/admin/par', icon: AlertTriangle },
  { label: 'Loan Products', href: '/admin/products', icon: Package },
  { label: 'Ledger', href: '/admin/ledger', icon: BookOpen },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
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
