import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoanData {
  id: string;
  principal_amount: number;
  interest_rate: number;
  interest_type: 'flat_rate' | 'reducing_balance';
  term_months: number;
  total_amount: number;
  monthly_payment: number;
  disbursed_at: string;
}

interface ScheduleEntry {
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_portion: number;
  interest_portion: number;
  total_amount: number;
  status: string;
}

// Weekly-only repayment schedules. Term is still expressed in months,
// so the number of weekly installments is derived from the term.
function weeksForTerm(termMonths: number): number {
  return Math.max(1, Math.round((termMonths * 52) / 12));
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function generateFlatRateSchedule(loan: LoanData): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const disbursedDate = new Date(loan.disbursed_at);
  const weeks = weeksForTerm(loan.term_months);

  // For flat rate, interest is calculated upfront and distributed evenly
  const totalInterest = Number(loan.total_amount) - Number(loan.principal_amount);
  const weeklyInterest = totalInterest / weeks;
  const weeklyPrincipal = Number(loan.principal_amount) / weeks;
  const weeklyPayment = weeklyPrincipal + weeklyInterest;

  for (let i = 1; i <= weeks; i++) {
    const dueDate = addWeeks(disbursedDate, i);

    schedule.push({
      loan_id: loan.id,
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_portion: Math.round(weeklyPrincipal * 100) / 100,
      interest_portion: Math.round(weeklyInterest * 100) / 100,
      total_amount: Math.round(weeklyPayment * 100) / 100,
      status: 'scheduled',
    });
  }

  return schedule;
}

function generateReducingBalanceSchedule(loan: LoanData): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const disbursedDate = new Date(loan.disbursed_at);
  const weeks = weeksForTerm(loan.term_months);

  // interest_rate is per month; convert to an equivalent weekly rate
  const weeklyRate = (Number(loan.interest_rate) / 100) * (12 / 52);
  const principal = Number(loan.principal_amount);

  // Weekly installment using reducing balance formula
  // PMT = P * r * (1+r)^n / ((1+r)^n - 1)
  let installment: number;
  if (weeklyRate === 0) {
    installment = principal / weeks;
  } else {
    const factor = Math.pow(1 + weeklyRate, weeks);
    installment = (principal * weeklyRate * factor) / (factor - 1);
  }

  let remainingBalance = principal;

  for (let i = 1; i <= weeks; i++) {
    const dueDate = addWeeks(disbursedDate, i);

    const interestPortion = remainingBalance * weeklyRate;
    const principalPortion = installment - interestPortion;

    schedule.push({
      loan_id: loan.id,
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_portion: Math.round(principalPortion * 100) / 100,
      interest_portion: Math.round(interestPortion * 100) / 100,
      total_amount: Math.round(installment * 100) / 100,
      status: 'scheduled',
    });

    remainingBalance -= principalPortion;
  }

  return schedule;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { loan_id } = await req.json();
    
    if (!loan_id) {
      return new Response(
        JSON.stringify({ error: 'loan_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📅 Generating repayment schedule for loan:', loan_id);

    // Fetch loan details
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('id, principal_amount, interest_rate, interest_type, term_months, total_amount, monthly_payment, disbursed_at')
      .eq('id', loan_id)
      .single();

    if (loanError || !loan) {
      console.error('Error fetching loan:', loanError);
      return new Response(
        JSON.stringify({ error: 'Loan not found', details: loanError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!loan.disbursed_at) {
      return new Response(
        JSON.stringify({ error: 'Loan has not been disbursed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if schedule already exists
    const { data: existingSchedule } = await supabase
      .from('loan_schedule')
      .select('id')
      .eq('loan_id', loan_id)
      .limit(1);

    if (existingSchedule && existingSchedule.length > 0) {
      console.log('Schedule already exists for loan:', loan_id);
      return new Response(
        JSON.stringify({ message: 'Schedule already exists', loan_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate schedule based on interest type
    let schedule: ScheduleEntry[];
    if (loan.interest_type === 'reducing_balance') {
      console.log('Using reducing balance calculation');
      schedule = generateReducingBalanceSchedule(loan as LoanData);
    } else {
      console.log('Using flat rate calculation');
      schedule = generateFlatRateSchedule(loan as LoanData);
    }

    console.log(`Generated ${schedule.length} installments`);

    // Insert schedule into database
    const { data: insertedSchedule, error: insertError } = await supabase
      .from('loan_schedule')
      .insert(schedule)
      .select();

    if (insertError) {
      console.error('Error inserting schedule:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create schedule', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Successfully created repayment schedule:', insertedSchedule?.length, 'installments');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Repayment schedule generated',
        installments: insertedSchedule?.length || 0,
        schedule: insertedSchedule
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
