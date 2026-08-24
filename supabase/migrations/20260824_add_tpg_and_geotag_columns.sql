-- =====================================================================
-- MIGRATION: Add TPG (Parental Heights) & Geotag Location Columns
-- System: SIGMA Ecosystem Platform v2.0
-- Date: 2026-08-24
-- =====================================================================

-- 1. Add Tinggi Potensi Genetik (TPG) Parental Height Columns
ALTER TABLE public.balita ADD COLUMN IF NOT EXISTS tb_ayah_cm NUMERIC(5,2);
ALTER TABLE public.balita ADD COLUMN IF NOT EXISTS tb_ibu_cm NUMERIC(5,2);

-- 2. Add Geotag Coordinates Columns
ALTER TABLE public.balita ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.balita ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- 3. Add Indexes for Spatial & Geotag Querying
CREATE INDEX IF NOT EXISTS idx_balita_lat_lng ON public.balita (latitude, longitude);

-- 4. Force PostgREST Schema Cache Reload
NOTIFY pgrst, 'reload schema';
