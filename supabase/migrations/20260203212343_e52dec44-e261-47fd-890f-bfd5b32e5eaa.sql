-- Create loan_schedule table for expected/scheduled installments
CREATE TABLE public.loan_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_portion NUMERIC NOT NULL,
  interest_portion NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid', 'overdue', 'partial')),
  paid_amount NUMERIC DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(loan_id, installment_number)
);

-- Enable RLS
ALTER TABLE public.loan_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all loan schedules"
ON public.loan_schedule
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Borrowers can view own loan schedules"
ON public.loan_schedule
FOR SELECT
USING (is_loan_owner(loan_id));

-- Create index for faster queries
CREATE INDEX idx_loan_schedule_loan_id ON public.loan_schedule(loan_id);
CREATE INDEX idx_loan_schedule_due_date ON public.loan_schedule(due_date);
CREATE INDEX idx_loan_schedule_status ON public.loan_schedule(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_schedule;

-- Trigger for updated_at
CREATE TRIGGER update_loan_schedule_updated_at
BEFORE UPDATE ON public.loan_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();