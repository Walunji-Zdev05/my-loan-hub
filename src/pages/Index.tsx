import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Shield, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle,
  ArrowRight,
  BarChart3,
  FileText,
  CreditCard
} from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Clock,
      title: 'Fast Approvals',
      description: 'Get your loan approved within 24 hours with our streamlined process.'
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Your data is protected with bank-grade security. No hidden fees.'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rates',
      description: 'Enjoy some of the lowest interest rates in the market.'
    },
    {
      icon: Users,
      title: 'Dedicated Support',
      description: '24/7 customer support to help you every step of the way.'
    }
  ];

  const benefits = [
    'Flexible repayment options',
    'No collateral required',
    'Instant disbursement',
    'Mobile-friendly platform',
    'Real-time tracking',
    'Multiple loan products'
  ];

  const stats = [
    { value: 'MWK 50M+', label: 'Loans Disbursed' },
    { value: '2,500+', label: 'Happy Customers' },
    { value: '24hrs', label: 'Average Approval' },
    { value: '98%', label: 'Satisfaction Rate' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LoanPro</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <Button asChild variant="accent">
                  <Link to={`/${user.role}`}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild variant="accent">
                    <Link to="/login">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Trusted by thousands of customers
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Fast & Flexible
                <span className="text-primary block mt-2">Loan Solutions</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Get access to quick loans with competitive rates. Simple application, 
                fast approval, and flexible repayment options tailored to your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" variant="accent" className="text-lg px-8">
                  <Link to="/login">
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8">
                  <Link to="/login">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Credit</p>
                      <p className="text-2xl font-bold">MWK 5,000,000</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <FileText className="h-5 w-5 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Active Loans</p>
                      <p className="text-xl font-semibold">2</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <CreditCard className="h-5 w-5 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Next Payment</p>
                      <p className="text-xl font-semibold">Jan 15</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="accent">
                    Quick Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Choose LoanPro?</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              We make borrowing simple, transparent, and accessible for everyone.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Everything You Need for Smart Borrowing
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Our platform provides all the tools and features you need to manage 
                your loans efficiently and stay on top of your finances.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8">
                <h3 className="text-xl font-semibold mb-6">Calculate Your Loan</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Loan Amount</p>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-primary rounded-full" />
                    </div>
                    <p className="text-right mt-1 font-medium">MWK 750,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Duration</p>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-accent rounded-full" />
                    </div>
                    <p className="text-right mt-1 font-medium">12 months</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Monthly Payment</span>
                      <span className="font-semibold">MWK 68,750</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate</span>
                      <span className="font-semibold text-accent">12% p.a.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust LoanPro for their 
            financial needs. Apply today and get a decision within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="accent" className="text-lg px-8">
              <Link to="/login">
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link to="/login">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">LoanPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 LoanPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
