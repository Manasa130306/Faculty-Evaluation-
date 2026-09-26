-- ==============================================================================
-- SYSTEM SETTINGS TABLE (FOR SECURE OAUTH & INTEGRATION METADATA)
-- Migration: 20260926000002_create_system_settings.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only Admins can view or update system settings
CREATE POLICY "Admins can view system settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update system settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );
