-- Add Google Drive Storage Metadata to Evaluation Heads

ALTER TABLE public.evaluation_heads 
ADD COLUMN IF NOT EXISTS drive_file_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS website_visible_until TIMESTAMPTZ DEFAULT NULL;

-- Backfill uploaded_at with created_at or updated_at if a document exists
UPDATE public.evaluation_heads
SET uploaded_at = COALESCE(updated_at, created_at)
WHERE reference_document_path IS NOT NULL AND uploaded_at IS NULL;

-- Backfill website_visible_until to uploaded_at + 2 months
UPDATE public.evaluation_heads
SET website_visible_until = uploaded_at + INTERVAL '2 months'
WHERE uploaded_at IS NOT NULL AND website_visible_until IS NULL;

-- Create Monthly Drive Folders table to avoid redundant folder creation lookups
CREATE TABLE IF NOT EXISTS public.monthly_drive_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL,
    month TEXT NOT NULL,
    drive_folder_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_monthly_drive_folder UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_drive_folders_period ON public.monthly_drive_folders(year, month);
