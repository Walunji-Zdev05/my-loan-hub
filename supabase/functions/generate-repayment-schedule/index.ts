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

function generateFlatRateSchedule(loan: LoanData): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const disbursedDate = new Date(loan.disbursed_at);
  
  // For flat rate, interest is calculated upfront and distributed evenly
  const totalInterest = Number(loan.total_amount) - Number(loan.principal_amount);
  const monthlyInterest = totalInterest / loan.term_months;
  const monthlyPrincipal = Number(loan.principal_amount) / loan.term_months;
  const monthlyPayment = monthlyPrincipal + monthlyInterest;
  
  for (let i = 1; i <= loan.term_months; i++) {
    const dueDate = new Date(disbursedDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      loan_id: loan.id,
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_portion: Math.round(monthlyPrincipal * 100) / 100,
      interest_portion: Math.round(monthlyInterest * 100) / 100,
      total_amount: Math.round(monthlyPayment * 100) / 100,
      status: 'scheduled',
    });
  }
  
  return schedule;
}

function generateReducingBalanceSchedule(loan: LoanData): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const disbursedDate = new Date(loan.disbursed_at);
  
  // Monthly interest rate
  const monthlyRate = Number(loan.interest_rate) / 100 / 12;
  const principal = Number(loan.principal_amount);
  
  // Calculate EMI using reducing balance formula
  // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, loan.term_months);
  const denominator = Math.pow(1 + monthlyRate, loan.term_months) - 1;
  const emi = numerator / denominator;
  
  let remainingBalance = principal;
  
  for (let i = 1; i <= loan.term_months; i++) {
    const dueDate = new Date(disbursedDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    // Interest for this month on remaining balance
    const interestPortion = remainingBalance * monthlyRate;
    const principalPortion = emi - interestPortion;
    
    schedule.push({
      loan_id: loan.id,
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_portion: Math.round(principalPortion * 100) / 100,
      interest_portion: Math.round(interestPortion * 100) / 100,
      total_amount: Math.round(emi * 100) / 100,
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
