-- =====================================================================
-- MIGRATION: Create M-CHAT-R Screening Table & SDIDTK Extensions
-- Standard: M-CHAT-R/F & SDIDTK Kemenkes RI
-- Platform: SIGMA Ecosystem Platform v3.0
-- Date: 2026-08-24
-- =====================================================================

-- 1. Create Dedicated mchat_screenings Table
CREATE TABLE IF NOT EXISTS public.mchat_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.sdidtk_assessments(id) ON DELETE CASCADE,
    balita_id UUID NOT NULL REFERENCES public.balita(id) ON DELETE CASCADE,
    puskesmas_id UUID REFERENCES public.ref_puskesmas(id),
    screening_date DATE NOT NULL DEFAULT CURRENT_DATE,
    age_in_months NUMERIC(4, 2) NOT NULL,
    
    -- Indikasi Klinis Skrining
    is_routine_screening BOOLEAN DEFAULT TRUE,
    has_speech_delay BOOLEAN DEFAULT FALSE,
    has_social_communication_issue BOOLEAN DEFAULT FALSE,
    has_repetitive_behavior BOOLEAN DEFAULT FALSE,
    
    -- Raw 20 Items Responses (true = Ya, false = Tidak)
    q1_points_at_objects BOOLEAN NOT NULL DEFAULT TRUE,
    q2_hearing_concern BOOLEAN NOT NULL DEFAULT FALSE,      -- Inverted (Risk if true)
    q3_pretend_play BOOLEAN NOT NULL DEFAULT TRUE,
    q4_climbs_objects BOOLEAN NOT NULL DEFAULT TRUE,
    q5_unusual_finger_movement BOOLEAN NOT NULL DEFAULT FALSE, -- Inverted (Risk if true)
    q6_point_to_ask BOOLEAN NOT NULL DEFAULT TRUE,
    q7_point_to_share BOOLEAN NOT NULL DEFAULT TRUE,
    q8_interest_in_children BOOLEAN NOT NULL DEFAULT TRUE,
    q9_shows_objects_to_share BOOLEAN NOT NULL DEFAULT TRUE,
    q10_responds_to_name BOOLEAN NOT NULL DEFAULT TRUE,
    q11_social_smile BOOLEAN NOT NULL DEFAULT TRUE,
    q12_noise_sensitive BOOLEAN NOT NULL DEFAULT FALSE,     -- Inverted (Risk if true)
    q13_can_walk BOOLEAN NOT NULL DEFAULT TRUE,
    q14_eye_contact BOOLEAN NOT NULL DEFAULT TRUE,
    q15_imitates_actions BOOLEAN NOT NULL DEFAULT TRUE,
    q16_gaze_following BOOLEAN NOT NULL DEFAULT TRUE,
    q17_seeks_attention BOOLEAN NOT NULL DEFAULT TRUE,
    q18_understands_commands BOOLEAN NOT NULL DEFAULT TRUE,
    q19_social_referencing BOOLEAN NOT NULL DEFAULT TRUE,
    q20_enjoys_movement_play BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Scoring & Decision Output
    total_risk_score INT NOT NULL DEFAULT 0,
    risk_classification VARCHAR(30) NOT NULL, -- 'RISIKO_RENDAH', 'RISIKO_SEDANG_TINGGI'
    failed_items INT[] NOT NULL DEFAULT '{}', -- Array of item numbers causing risk points
    referral_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    referral_destination VARCHAR(100),
    next_reassessment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Performa Query
CREATE INDEX IF NOT EXISTS idx_mchat_balita_date ON public.mchat_screenings(balita_id, screening_date DESC);
CREATE INDEX IF NOT EXISTS idx_mchat_risk ON public.mchat_screenings(risk_classification);
CREATE INDEX IF NOT EXISTS idx_mchat_puskesmas ON public.mchat_screenings(puskesmas_id);

-- Enable RLS
ALTER TABLE public.mchat_screenings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read mchat_screenings" ON public.mchat_screenings;
CREATE POLICY "Allow authenticated read mchat_screenings" ON public.mchat_screenings
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert mchat_screenings" ON public.mchat_screenings;
CREATE POLICY "Allow authenticated insert mchat_screenings" ON public.mchat_screenings
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 2. Extend sdidtk_assessments Table with JSONB & Array Columns for Detailed M-CHAT-R State
ALTER TABLE public.sdidtk_assessments 
    ADD COLUMN IF NOT EXISTS mchat_indications JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS mchat_answers JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS mchat_failed_items INT[] DEFAULT '{}';

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
