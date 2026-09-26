-- ==============================================================================
-- SUPABASE STORAGE CONFIGURATION: PRIVATE BUCKET `reference-documents`
-- Migration: 20260913000003_create_reference_documents_storage.sql
-- ==============================================================================

-- 1. CREATE PRIVATE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reference-documents',
    'reference-documents',
    FALSE,
    15728640, -- 15MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

-- 2. STORAGE RLS POLICIES FOR `reference-documents` BUCKET

-- Policy: Authenticated users can view/download reference documents
-- Faculty: Only their own folder (folder name matching their faculty_id)
-- Admin: All faculty folders
DROP POLICY IF EXISTS "Authenticated users view reference documents" ON storage.objects;
CREATE POLICY "Authenticated users view reference documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'reference-documents'
        AND (
            (storage.foldername(name))[1] = public.get_auth_faculty_id()
            OR public.is_admin()
        )
    );

-- Policy: Faculty can upload reference documents only into their own folder
-- Path structure: {faculty_id}/{year}/{month}/head_{head_number}_{filename}
DROP POLICY IF EXISTS "Faculty upload reference documents" ON storage.objects;
CREATE POLICY "Faculty upload reference documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'reference-documents'
        AND (storage.foldername(name))[1] = public.get_auth_faculty_id()
    );

-- Policy: Faculty can update their own reference documents
DROP POLICY IF EXISTS "Faculty update reference documents" ON storage.objects;
CREATE POLICY "Faculty update reference documents" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'reference-documents'
        AND (storage.foldername(name))[1] = public.get_auth_faculty_id()
    )
    WITH CHECK (
        bucket_id = 'reference-documents'
        AND (storage.foldername(name))[1] = public.get_auth_faculty_id()
    );

-- Policy: Faculty can delete their own reference documents
DROP POLICY IF EXISTS "Faculty delete reference documents" ON storage.objects;
CREATE POLICY "Faculty delete reference documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'reference-documents'
        AND (storage.foldername(name))[1] = public.get_auth_faculty_id()
    );

-- Policy: Admin full access to manage reference documents
DROP POLICY IF EXISTS "Admin manage reference documents" ON storage.objects;
CREATE POLICY "Admin manage reference documents" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'reference-documents'
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id = 'reference-documents'
        AND public.is_admin()
    );
