-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'borrower');

-- Create enum for loan status
CREATE TYPE public.loan_status AS ENUM ('applied', 'approved', 'disbursed', 'active', 'overdue', 'paid', 'rejected');

-- Create enum for fee types
CREATE TYPE public.fee_type AS ENUM ('application_fee', 'approval_fee', 'penalty');

-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'mobile_money');

-- Create enum for ledger entry types
CREATE TYPE public.ledger_entry_type AS ENUM ('application_fee', 'approval_fee', 'interest', 'penalty', 'repayment');

-- Create enum for interest types
CREATE TYPE public.interest_type AS ENUM ('flat_rate', 'reducing_balance');

-- =====================
-- TABLES
-- =====================

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'borrower',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Clients table (borrower profiles)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_number TEXT,
  address TEXT,
  occupation TEXT,
  employer TEXT,
  monthly_income DECIMAL(15,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loan products table
CREATE TABLE public.loan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount DECIMAL(15,2) NOT NULL DEFAULT 1000,
  max_amount DECIMAL(15,2) NOT NULL DEFAULT 100000,
  interest_rate DECIMAL(5,2) NOT NULL,
  interest_type interest_type NOT NULL DEFAULT 'flat_rate',
  min_term_months INTEGER NOT NULL DEFAULT 1,
  max_term_months INTEGER NOT NULL DEFAULT 24,
  application_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  approval_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  penalty_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
  product_id UUID REFERENCES public.loan_products(id) ON DELETE RESTRICT NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  interest_type interest_type NOT NULL,
  term_months INTEGER NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  outstanding_balance DECIMAL(15,2) NOT NULL,
  status loan_status NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  next_payment_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fee payments table (application fees, approval fees)
CREATE TABLE public.fees_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  fee_type fee_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method payment_method NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repayments table
CREATE TABLE public.repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  principal_portion DECIMAL(15,2),
  interest_portion DECIMAL(15,2),
  payment_method payment_method NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger entries table (income tracking)
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  entry_type ledger_entry_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  )
$$;

-- Get client_id for a user
CREATE OR REPLACE FUNCTION public.get_client_id_for_user(check_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients WHERE user_id = check_user_id LIMIT 1
$$;

-- Check if user owns a client record
CREATE OR REPLACE FUNCTION public.is_client_owner(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = target_client_id AND user_id = auth.uid()
  )
$$;

-- Check if user owns a loan (via client)
CREATE OR REPLACE FUNCTION public.is_loan_owner(target_loan_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.loans l
    JOIN public.clients c ON l.client_id = c.id
    WHERE l.id = target_loan_id AND c.user_id = auth.uid()
  )
$$;

-- Generate client number
CREATE OR REPLACE FUNCTION public.generate_client_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.clients;
  new_number := 'C' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Generate loan number
CREATE OR REPLACE FUNCTION public.generate_loan_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.loans;
  new_number := 'L' || LPAD(counter::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================
-- TRIGGERS
-- =====================

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_products_updated_at
  BEFORE UPDATE ON public.loan_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ENABLE RLS
-- =====================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS POLICIES
-- =====================

-- User roles policies
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Clients policies
CREATE POLICY "Admins can manage all clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Borrowers can view own client record"
  ON public.clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Loan products policies
CREATE POLICY "Admins can manage all loan products"
  ON public.loan_products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view active products"
  ON public.loan_products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Loans policies
CREATE POLICY "Admins can manage all loans"
  ON public.loans FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Borrowers can view own loans"
  ON public.loans FOR SELECT
  TO authenticated
  USING (public.is_loan_owner(id));

-- Fees payments policies
CREATE POLICY "Admins can manage all fee payments"
  ON public.fees_payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Borrowers can view own fee payments"
  ON public.fees_payments FOR SELECT
  TO authenticated
  USING (public.is_loan_owner(loan_id));

-- Repayments policies
CREATE POLICY "Admins can manage all repayments"
  ON public.repayments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Borrowers can view own repayments"
  ON public.repayments FOR SELECT
  TO authenticated
  USING (public.is_loan_owner(loan_id));

-- Ledger entries policies
CREATE POLICY "Admins can manage all ledger entries"
  ON public.ledger_entries FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Borrowers can view own ledger entries"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (loan_id IS NOT NULL AND public.is_loan_owner(loan_id));

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_loans_client_id ON public.loans(client_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_next_payment ON public.loans(next_payment_date);
CREATE INDEX idx_fees_payments_loan_id ON public.fees_payments(loan_id);
CREATE INDEX idx_repayments_loan_id ON public.repayments(loan_id);
CREATE INDEX idx_ledger_entries_entry_date ON public.ledger_entries(entry_date);
CREATE INDEX idx_ledger_entries_loan_id ON public.ledger_entries(loan_id);