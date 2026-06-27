-- ============================================================
-- STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor
-- ============================================================

-- Allow authenticated users to upload KYC documents
create policy "Users can upload KYC documents" on storage.objects
  for insert with check (
    bucket_id = 'kyc-documents' 
    and auth.role() = 'authenticated'
  );

-- Allow admins to view/download KYC documents
create policy "Admins can view all KYC documents" on storage.objects
  for select using (
    bucket_id = 'kyc-documents' 
    and is_admin()
  );

-- Allow users to view their own uploaded documents (if needed)
create policy "Users can view own KYC documents" on storage.objects
  for select using (
    bucket_id = 'kyc-documents' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
