-- =====================================================================
-- MIGRATION: Database Indexing & RLS Policy Performance Optimization
-- Date: 2026-07-30
-- Description:
-- 1. Create B-Tree indexes for all unindexed Foreign Keys (Poin 1 Supabase Audit)
-- 2. Refactor RLS policies to use subquery (SELECT auth.uid()) / (SELECT auth.role()) for InitPlan optimization (Poin 2 Supabase Audit)
-- 3. Consolidate multiple permissive policies on reference and survey tables
-- =====================================================================

-- =====================================================================
-- STEP 1: B-TREE INDEXES ON FOREIGN KEYS & CRITICAL FILTER COLUMNS
-- =====================================================================

-- User & Tenant Boundary Indexes
CREATE INDEX IF NOT EXISTS idx_app_users_puskesmas_id ON public.app_users (puskesmas_id);

-- Balita Table Indexes
CREATE INDEX IF NOT EXISTS idx_balita_puskesmas_id ON public.balita (puskesmas_id);
CREATE INDEX IF NOT EXISTS idx_balita_desa_kel ON public.balita (desa_kel);
CREATE INDEX IF NOT EXISTS idx_balita_nik ON public.balita (nik);

-- Kohort Table Indexes
CREATE INDEX IF NOT EXISTS idx_kohort_balita_id ON public.kohort (balita_id);
CREATE INDEX IF NOT EXISTS idx_kohort_puskesmas_id ON public.kohort (puskesmas_id);
CREATE INDEX IF NOT EXISTS idx_kohort_status ON public.kohort (status);

-- Fact Monitoring Tables Indexes (Highest volume tables)
CREATE INDEX IF NOT EXISTS idx_monitoring_antropometri_kohort_id ON public.monitoring_antropometri (kohort_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_antropometri_minggu_ke ON public.monitoring_antropometri (minggu_ke);
CREATE INDEX IF NOT EXISTS idx_monitoring_pkmk_konsumsi_kohort_id ON public.monitoring_pkmk_konsumsi (kohort_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_pkmk_konsumsi_minggu_ke ON public.monitoring_pkmk_konsumsi (minggu_ke);
CREATE INDEX IF NOT EXISTS idx_monitoring_pkmk_pemberian_kohort_id ON public.monitoring_pkmk_pemberian (kohort_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_pkmk_pemberian_minggu_ke ON public.monitoring_pkmk_pemberian (minggu_ke);

-- Logistik Tables Indexes
CREATE INDEX IF NOT EXISTS idx_logistik_stok_puskesmas_jenis_pkmk_id ON public.logistik_stok_puskesmas (jenis_pkmk_id);
CREATE INDEX IF NOT EXISTS idx_logistik_stok_puskesmas_puskesmas_id ON public.logistik_stok_puskesmas (puskesmas_id);
CREATE INDEX IF NOT EXISTS idx_logistik_transaksi_created_by ON public.logistik_transaksi (created_by);
CREATE INDEX IF NOT EXISTS idx_logistik_transaksi_jenis_pkmk_id ON public.logistik_transaksi (jenis_pkmk_id);
CREATE INDEX IF NOT EXISTS idx_logistik_transaksi_puskesmas_id ON public.logistik_transaksi (puskesmas_id);

-- Reference & Survey Tables Indexes
CREATE INDEX IF NOT EXISTS idx_ref_desa_puskesmas_id ON public.ref_desa (puskesmas_id);
CREATE INDEX IF NOT EXISTS idx_survey_determinan_surveyor_id ON public.survey_determinan (surveyor_id);
CREATE INDEX IF NOT EXISTS idx_survey_determinan_balita_id ON public.survey_determinan (balita_id);

-- =====================================================================
-- STEP 2: REFACTOR RLS POLICIES FOR INITPLAN OPTIMIZATION & CONSOLIDATION
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. Reference Tables (ref_puskesmas, ref_desa, ref_jenis_pkmk, ref_lms_*)
-- Consolidate duplicate permissive policies into a single statement-cached policy
-- ---------------------------------------------------------------------

-- ref_puskesmas
ALTER TABLE public.ref_puskesmas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ref_puskesmas" ON public.ref_puskesmas;
DROP POLICY IF EXISTS "Authenticated users select ref_puskesmas" ON public.ref_puskesmas;
DROP POLICY IF EXISTS "Allow authenticated read ref_puskesmas" ON public.ref_puskesmas;
CREATE POLICY "Allow authenticated read ref_puskesmas" ON public.ref_puskesmas
    FOR SELECT TO authenticated USING (true);

-- ref_desa
ALTER TABLE public.ref_desa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ref_desa" ON public.ref_desa;
DROP POLICY IF EXISTS "Authenticated users select ref_desa" ON public.ref_desa;
DROP POLICY IF EXISTS "Allow authenticated read ref_desa" ON public.ref_desa;
CREATE POLICY "Allow authenticated read ref_desa" ON public.ref_desa
    FOR SELECT TO authenticated USING (true);

-- ref_jenis_pkmk
ALTER TABLE public.ref_jenis_pkmk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ref_jenis_pkmk" ON public.ref_jenis_pkmk;
DROP POLICY IF EXISTS "Authenticated users select ref_jenis_pkmk" ON public.ref_jenis_pkmk;
DROP POLICY IF EXISTS "Allow authenticated read ref_jenis_pkmk" ON public.ref_jenis_pkmk;
CREATE POLICY "Allow authenticated read ref_jenis_pkmk" ON public.ref_jenis_pkmk
    FOR SELECT TO authenticated USING (true);

-- ref_lms_bbu
ALTER TABLE public.ref_lms_bbu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ref_lms_bbu" ON public.ref_lms_bbu;
DROP POLICY IF EXISTS "Authenticated select ref_lms_bbu" ON public.ref_lms_bbu;
DROP POLICY IF EXISTS "Allow authenticated read ref_lms_bbu" ON public.ref_lms_bbu;
CREATE POLICY "Allow authenticated read ref_lms_bbu" ON public.ref_lms_bbu
    FOR SELECT TO authenticated USING (true);

-- ref_lms_tbu
ALTER TABLE public.ref_lms_tbu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ref_lms_tbu" ON public.ref_lms_tbu;
DROP POLICY IF EXISTS "Authenticated select ref_lms_tbu" ON public.ref_lms_tbu;
DROP POLICY IF EXISTS "Allow authenticated read ref_lms_tbu" ON public.ref_lms_tbu;
CREATE POLICY "Allow authenticated read ref_lms_tbu" ON public.ref_lms_tbu
    FOR SELECT TO authenticated USING (true);

-- ref_lms_bbtb
ALTER TABLE public.ref_lms_bbtb ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read ref_lms_bbtb" ON public.ref_lms_bbtb;
DROP POLICY IF EXISTS "Authenticated select ref_lms_bbtb" ON public.ref_lms_bbtb;
DROP POLICY IF EXISTS "Allow authenticated read ref_lms_bbtb" ON public.ref_lms_bbtb;
CREATE POLICY "Allow authenticated read ref_lms_bbtb" ON public.ref_lms_bbtb
    FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------
-- B. Survey Determinan Table
-- Consolidate duplicate policies and use statement-cached auth calls
-- ---------------------------------------------------------------------
ALTER TABLE public.survey_determinan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select survey_determinan" ON public.survey_determinan;
DROP POLICY IF EXISTS "Users can insert survey_determinan" ON public.survey_determinan;
DROP POLICY IF EXISTS "Users can update survey_determinan" ON public.survey_determinan;
DROP POLICY IF EXISTS "Users can delete survey_determinan" ON public.survey_determinan;

DROP POLICY IF EXISTS "Allow authenticated select survey_determinan" ON public.survey_determinan;
DROP POLICY IF EXISTS "Allow authenticated insert survey_determinan" ON public.survey_determinan;
DROP POLICY IF EXISTS "Allow authenticated update survey_determinan" ON public.survey_determinan;
DROP POLICY IF EXISTS "Allow authenticated delete survey_determinan" ON public.survey_determinan;

CREATE POLICY "Allow authenticated select survey_determinan" ON public.survey_determinan
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert survey_determinan" ON public.survey_determinan
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated update survey_determinan" ON public.survey_determinan
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated delete survey_determinan" ON public.survey_determinan
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- =====================================================================
-- STEP 3: VERIFICATION SUMMARY
-- =====================================================================
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
