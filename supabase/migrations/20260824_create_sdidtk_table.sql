-- =====================================================================
-- MIGRATION: Create SDIDTK Assessments Table
-- System: SIGMA Ecosystem Platform v3.0
-- Date: 2026-08-24
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.sdidtk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id UUID NOT NULL REFERENCES public.balita(id) ON DELETE CASCADE,
    puskesmas_id UUID REFERENCES public.ref_puskesmas(id),
    examiner_name VARCHAR(100) DEFAULT 'Petugas Kesehatan',
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    birth_date DATE NOT NULL,
    gestational_weeks INT DEFAULT 40,
    chronological_age_months NUMERIC(5, 2) NOT NULL,
    corrected_age_months NUMERIC(5, 2),
    is_premature_corrected BOOLEAN DEFAULT FALSE,
    
    -- Antropometri & Pertumbuhan
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    head_circ_cm NUMERIC(5, 2),
    muac_lila_cm NUMERIC(5, 2),
    zs_bbu NUMERIC(4, 2),
    zs_tbu NUMERIC(4, 2),
    zs_bbtb NUMERIC(4, 2),
    
    -- KPSP Perkembangan
    kpsp_age_bracket INT NOT NULL,
    kpsp_yes_count INT NOT NULL,
    kpsp_status VARCHAR(30) NOT NULL, -- 'SESUAI_UMUR', 'MERAGUKAN', 'PENYIMPANGAN'
    kpsp_failed_sectors TEXT[],       -- ['GK', 'GH', 'BB', 'SK']
    kpsp_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Skrining Khusus Sensorik & Perilaku
    tdd_status VARCHAR(30) NOT NULL DEFAULT 'NORMAL',  -- 'NORMAL', 'SUSPEK_GANGGUAN_DENGAR'
    leukocoria_status VARCHAR(30) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'CURIGA_LEUKOKORIA'
    tdl_status VARCHAR(30),           -- 'DAYA_LIHAT_BAIK', 'DAYA_LIHAT_KURANG'
    mchat_score INT,
    mchat_risk VARCHAR(30),           -- 'RISIKO_RENDAH', 'RISIKO_SEDANG', 'RISIKO_TINGGI'
    kmpe_yes_count INT,
    kmpe_status VARCHAR(30),          -- 'NORMAL', 'MASALAH_EMOSIONAL'
    gpph_total_score INT,
    gpph_status VARCHAR(30),          -- 'NORMAL', 'KEMUNGKINAN_GPPH'
    
    -- Keputusan Klinis & Rujukan
    clinical_action VARCHAR(50) NOT NULL,
    referral_required BOOLEAN DEFAULT FALSE,
    referral_urgency VARCHAR(30),     -- 'ROUTINE', 'SPECIALIST_LEVEL_1', 'EMERGENCY'
    referral_reasons TEXT[],
    referral_destination VARCHAR(100),
    next_visit_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Performa Query
CREATE INDEX IF NOT EXISTS idx_sdidtk_balita_date ON public.sdidtk_assessments (balita_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_sdidtk_kpsp_status ON public.sdidtk_assessments (kpsp_status);
CREATE INDEX IF NOT EXISTS idx_sdidtk_puskesmas ON public.sdidtk_assessments (puskesmas_id);

-- Enable RLS & Allow Authenticated Access
ALTER TABLE public.sdidtk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sdidtk_assessments" ON public.sdidtk_assessments;
CREATE POLICY "Allow authenticated read sdidtk_assessments" ON public.sdidtk_assessments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert sdidtk_assessments" ON public.sdidtk_assessments;
CREATE POLICY "Allow authenticated insert sdidtk_assessments" ON public.sdidtk_assessments
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Refresh PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
