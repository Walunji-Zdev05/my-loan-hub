import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingDown, Percent, Calendar, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InstallmentRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const RepaymentCalculator = () => {
  const [principal, setPrincipal] = useState<number>(10000);
  const [rate, setRate] = useState<number>(12);
  const [term, setTerm] = useState<number>(12);
  const [method, setMethod] = useState<"flat" | "reducing">("flat");

  const calculations = useMemo(() => {
    const monthlyRate = rate / 100 / 12;
    
    // Flat Interest Calculation
    const flatTotalInterest = (principal * rate * term) / (12 * 100);
    const flatTotalAmount = principal + flatTotalInterest;
    const flatMonthlyPayment = flatTotalAmount / term;
    const flatPrincipalPerMonth = principal / term;
    const flatInterestPerMonth = flatTotalInterest / term;

    const flatSchedule: InstallmentRow[] = [];
    let flatBalance = principal;
    for (let i = 1; i <= term; i++) {
      flatBalance -= flatPrincipalPerMonth;
      flatSchedule.push({
        period: i,
        payment: flatMonthlyPayment,
        principal: flatPrincipalPerMonth,
        interest: flatInterestPerMonth,
        balance: Math.max(0, flatBalance),
      });
    }

    // Reducing Balance Calculation (EMI formula)
    const reducingMonthlyPayment = monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
      : principal / term;
    
    const reducingSchedule: InstallmentRow[] = [];
    let reducingBalance = principal;
    let reducingTotalInterest = 0;

    for (let i = 1; i <= term; i++) {
      const interestPayment = reducingBalance * monthlyRate;
      const principalPayment = reducingMonthlyPayment - interestPayment;
      reducingBalance -= principalPayment;
      reducingTotalInterest += interestPayment;
      
      reducingSchedule.push({
        period: i,
        payment: reducingMonthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, reducingBalance),
      });
    }

    return {
      flat: {
        monthlyPayment: flatMonthlyPayment,
        totalInterest: flatTotalInterest,
        totalAmount: flatTotalAmount,
        schedule: flatSchedule,
      },
      reducing: {
        monthlyPayment: reducingMonthlyPayment,
        totalInterest: reducingTotalInterest,
        totalAmount: principal + reducingTotalInterest,
        schedule: reducingSchedule,
      },
    };
  }, [principal, rate, term]);

  const currentCalc = calculations[method];
  const savings = calculations.flat.totalInterest - calculations.reducing.totalInterest;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-MW", {
      style: "currency",
      currency: "MWK",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <DashboardLayout requiredRole="borrower">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repayment Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Compare flat vs reducing balance interest methods
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Loan Amount ($)</Label>
                <Input
                  id="principal"
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  min={100}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  min={0.1}
                  max={100}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="term">Loan Term (months)</Label>
                <Input
                  id="term"
                  type="number"
                  value={term}
                  onChange={(e) => setTerm(Number(e.target.value))}
                  min={1}
                  max={360}
                />
              </div>

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-medium">Interest Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={method === "flat" ? "default" : "outline"}
                    onClick={() => setMethod("flat")}
                    className="w-full"
                  >
                    Flat Rate
                  </Button>
                  <Button
                    variant={method === "reducing" ? "default" : "outline"}
                    onClick={() => setMethod("reducing")}
                    className="w-full"
                  >
                    Reducing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Monthly Payment</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(currentCalc.monthlyPayment)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Percent className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Total Interest</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(currentCalc.totalInterest)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Total Repayment</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(currentCalc.totalAmount)}</p>
                </CardContent>
              </Card>
              <Card className={savings > 0 ? "bg-success/10 border-success/30" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-success mb-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Reducing Saves</span>
                  </div>
                  <p className="text-2xl font-bold text-success">{formatCurrency(savings)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Method Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Flat Rate</TableHead>
                      <TableHead className="text-right">Reducing Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Monthly Payment</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculations.flat.monthlyPayment)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculations.reducing.monthlyPayment)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Interest</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculations.flat.totalInterest)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculations.reducing.totalInterest)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Repayment</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculations.flat.totalAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculations.reducing.totalAmount)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">Effective Rate</TableCell>
                      <TableCell className="text-right">{rate.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        {((calculations.reducing.totalInterest / principal) * 100 / (term / 12)).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Amortization Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>
              Amortization Schedule ({method === "flat" ? "Flat Rate" : "Reducing Balance"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-20">Month</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCalc.schedule.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="font-medium">{row.period}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.payment)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RepaymentCalculator;
