import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(email, password, 'admin');
    
    if (success) {
      toast({
        title: 'Welcome back!',
        description: 'Signed in as Admin',
      });
      navigate('/admin');
    } else {
      toast({
        title: 'Login failed',
        description: 'Please check your credentials',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Wallet className="h-7 w-7 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">LoanPro</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight mb-6">
            Simplify Your Loan Management
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            A modern platform for managing loans, tracking payments, and growing your lending business efficiently.
          </p>
          
          <div className="mt-12 grid gap-4">
            <div className="flex items-center gap-4 text-primary-foreground/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Shield className="h-5 w-5" />
              </div>
              <span>Secure & reliable platform</span>
            </div>
            <div className="flex items-center gap-4 text-primary-foreground/90">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Users className="h-5 w-5" />
              </div>
              <span>Multi-role access control</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-20 -right-10 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Right panel - Login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LoanPro</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your dashboard
            </p>
            <p className="mt-1 text-sm text-accent font-medium">
              Admin access only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button 
              type="submit" 
              variant="accent"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Demo: Use any email and password (4+ chars)
          </p>
        </div>
      </div>
    </div>
  );
}
