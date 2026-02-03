-- Enable realtime for clients table
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;

-- Enable realtime for loans table
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;

-- Enable realtime for repayments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.repayments;

-- Enable realtime for ledger_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_entries;