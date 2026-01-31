-- Create storage bucket for loan application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to loan-documents bucket
CREATE POLICY "Authenticated users can upload loan documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'loan-documents');

-- Allow admins to view all loan documents
CREATE POLICY "Admins can view all loan documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'loan-documents' AND public.is_admin());

-- Allow admins to delete loan documents
CREATE POLICY "Admins can delete loan documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'loan-documents' AND public.is_admin());

-- Add columns to loans table for additional application data
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS purpose text,
ADD COLUMN IF NOT EXISTS guarantor_name text,
ADD COLUMN IF NOT EXISTS guarantor_phone text,
ADD COLUMN IF NOT EXISTS guarantor_relationship text,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;