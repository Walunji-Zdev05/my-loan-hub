-- Fix function search path for generate_client_number
CREATE OR REPLACE FUNCTION public.generate_client_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix function search path for generate_loan_number
CREATE OR REPLACE FUNCTION public.generate_loan_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;