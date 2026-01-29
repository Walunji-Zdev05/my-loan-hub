import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Users, Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AppRole } from '@/hooks/useSupabaseAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('borrower');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(`/${role}`);
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, selectedRole);
        
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message || 'Please try again',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'You can now sign in',
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message || 'Invalid email or password',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Signed in successfully',
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
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
            <h2 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? 'Sign up to get started' : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Role selector (only for signup) */}
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('borrower')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  selectedRole === 'borrower'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                )}
              >
                <Users className={cn(
                  'h-6 w-6',
                  selectedRole === 'borrower' ? 'text-accent' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  selectedRole === 'borrower' ? 'text-accent' : 'text-muted-foreground'
                )}>
                  Borrower
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  selectedRole === 'admin'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                )}
              >
                <Shield className={cn(
                  'h-6 w-6',
                  selectedRole === 'admin' ? 'text-accent' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  selectedRole === 'admin' ? 'text-accent' : 'text-muted-foreground'
                )}>
                  Admin
                </span>
              </button>
            </div>
          )}

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
                minLength={6}
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
              {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="font-medium text-accent">Sign in</span></>
              ) : (
                <>Don't have an account? <span className="font-medium text-accent">Sign up</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
