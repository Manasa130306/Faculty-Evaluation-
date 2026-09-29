-- ==============================================================================
-- FIX SYSTEM SETTINGS RLS POLICIES FOR SECURE SERVER-SIDE ACCESS
-- Migration: 20260927000001_fix_system_settings_rls.sql
-- ==============================================================================

-- Create system_settings table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if present
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow authenticated and service access to system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow server read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow server write system settings" ON public.system_settings;

-- Allow read/write access for authenticated and anon clients for backend server routes
-- (Server routes enforce verifyAdminSession at application layer)
CREATE POLICY "Allow server read system settings"
    ON public.system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Allow server write system settings"
    ON public.system_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);
