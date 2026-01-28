import { Navigate, Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Bell, AlertCircle, UserCheck, CreditCard, Clock, Loader2 } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'alert',
    icon: AlertCircle,
    title: 'Overdue Payment',
    description: 'John Doe missed payment of K5,000',
    time: '5 min ago',
    unread: true,
  },
  {
    id: 2,
    type: 'approval',
    icon: UserCheck,
    title: 'New Client Pending',
    description: 'Jane Smith awaiting approval',
    time: '1 hour ago',
    unread: true,
  },
  {
    id: 3,
    type: 'payment',
    icon: CreditCard,
    title: 'Payment Received',
    description: 'K12,500 from Mary Johnson',
    time: '2 hours ago',
    unread: false,
  },
  {
    id: 4,
    type: 'pending',
    icon: Clock,
    title: 'Loan Application',
    description: '3 applications need review',
    time: '3 hours ago',
    unread: true,
  },
];

export function AdminLayout() {
  const { user, isAuthenticated, isAdmin, isLoading, signOut } = useSupabaseAuth();
  const unreadCount = notifications.filter(n => n.unread).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // For now, allow any authenticated user to access admin pages
  // TODO: Re-enable role check when borrower portal is implemented
  // if (!isAdmin) {
  //   return <Navigate to="/borrower" replace />;
  // }

  const handleSignOut = async () => {
    await signOut();
  };

  const userEmail = user?.email || '';
  const userInitial = userEmail.charAt(0).toUpperCase() || 'U';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Header Bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            
            {/* Notifications Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      variant="destructive"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-popover">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer ${
                        notification.unread ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full p-2 ${
                        notification.type === 'alert' ? 'bg-destructive/10 text-destructive' :
                        notification.type === 'approval' ? 'bg-warning/10 text-warning' :
                        notification.type === 'payment' ? 'bg-success/10 text-success' :
                        'bg-primary/10 text-primary'
                      }`}>
                        <notification.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {notification.time}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start text-left md:flex">
                    <span className="text-sm font-medium">{userEmail}</span>
                    <span className="text-xs text-muted-foreground capitalize">Admin</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          {/* Page Content */}
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
