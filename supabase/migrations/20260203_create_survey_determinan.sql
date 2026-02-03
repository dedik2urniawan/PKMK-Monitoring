-- ============================================
-- DETERMINAN STUNTING SURVEY TABLE
-- Version 1.2.1
-- ============================================

CREATE TABLE survey_determinan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id UUID NOT NULL REFERENCES balita(id) ON DELETE CASCADE,
    surveyor_id UUID REFERENCES app_users(id),
    tanggal_survey DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Section 2: Riwayat Kelahiran & Ibu (6 questions)
    q2_1_lbw VARCHAR(20),              -- Berat lahir <2.5kg? Ya/Tidak/Tidak tahu
    q2_2_hf_delivery VARCHAR(10),       -- Lahir di faskes? Ya/Tidak
    q2_3_anc4 VARCHAR(20),              -- ANC >=4x? Ya/Tidak/Tidak tahu
    q2_4_mat_height_low VARCHAR(20),    -- Tinggi ibu <150cm? Ya/Tidak/Tidak diukur
    q2_5_mat_underweight VARCHAR(20),   -- Ibu kurus (IMT<18.5)? Ya/Tidak/Tidak tahu
    q2_6_low_mat_edu VARCHAR(10),       -- Pendidikan ibu SMP ke bawah? Ya/Tidak
    
    -- Section 3: Pemberian ASI & MP-ASI (5 questions)
    q3_1_ebf VARCHAR(10),               -- ASI eksklusif 0-6 bulan? Ya/Tidak
    q3_2_cf_6m VARCHAR(10),             -- MP-ASI tepat 6 bulan? Ya/Tidak
    q3_3_current_bf VARCHAR(10),        -- Masih menyusui? Ya/Tidak
    q3_4_min_meal_freq VARCHAR(10),     -- Frekuensi makan minimal? Ya/Tidak
    q3_5_mdd VARCHAR(10),               -- Keragaman pangan >=4 kelompok? Ya/Tidak
    
    -- Section 4: Penyakit Infeksi 2 minggu terakhir (5 questions)
    q4_1_diarrhea VARCHAR(10),          -- Diare? Ya/Tidak
    q4_1a_recurrent_diarrhea VARCHAR(10), -- Diare berulang? Ya/Tidak (conditional)
    q4_2_ari VARCHAR(10),               -- ISPA? Ya/Tidak
    q4_3_fever VARCHAR(10),             -- Demam >=2 hari? Ya/Tidak
    q4_4_helminth VARCHAR(10),          -- Cacingan 6 bulan terakhir? Ya/Tidak
    
    -- Section 5: WASH & Sosial Ekonomi (8 questions)
    q5_1_safe_water VARCHAR(10),        -- Air minum layak? Ya/Tidak
    q5_2_water_treat VARCHAR(10),       -- Air diolah? Ya/Tidak
    q5_3_improved_san VARCHAR(10),      -- Jamban sehat? Ya/Tidak
    q5_4_hwws VARCHAR(10),              -- Fasilitas cuci tangan? Ya/Tidak
    q5_5_overcrowd VARCHAR(10),         -- Anggota RT >5 orang? Ya/Tidak
    q5_6_multi_u5 VARCHAR(10),          -- >=2 balita dalam rumah? Ya/Tidak
    q5_7_low_ses VARCHAR(10),           -- Status ekonomi rendah? Ya/Tidak
    q5_8_female_hhh VARCHAR(10),        -- KRT perempuan? Ya/Tidak
    
    -- Section 6: Pola Pengasuhan (2 questions)
    q6_1_non_mat_care VARCHAR(10),      -- Ibu bukan pengasuh utama? Ya/Tidak
    q6_2_child_not_priority VARCHAR(10), -- Anak bukan prioritas makan? Ya/Tidak
    
    -- Geolocation & Photo (new fields)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    foto_rumah_url TEXT,
    
    -- Calculated Scores
    risk_score INTEGER DEFAULT 0,        -- Total risk factors (0-26)
    risk_category VARCHAR(20),           -- Rendah/Sedang/Tinggi
    
    -- Metadata
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_survey_determinan_balita ON survey_determinan(balita_id);
CREATE INDEX idx_survey_determinan_tanggal ON survey_determinan(tanggal_survey);
CREATE INDEX idx_survey_determinan_risk ON survey_determinan(risk_category);

-- RLS Policies
ALTER TABLE survey_determinan ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "survey_determinan_select" ON survey_determinan
    FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert
CREATE POLICY "survey_determinan_insert" ON survey_determinan
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update
CREATE POLICY "survey_determinan_update" ON survey_determinan
    FOR UPDATE TO authenticated USING (true);

-- Allow all authenticated users to delete
CREATE POLICY "survey_determinan_delete" ON survey_determinan
    FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_survey_determinan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_survey_determinan_updated_at
    BEFORE UPDATE ON survey_determinan
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_determinan_updated_at();
