```markdown
# INSTRUCTION SPECIFICATION: ARSITEKTUR & ENGINE ANALISIS SDIDTK TERINTEGRASI (0–60 BULAN)
## Platform: SIGMA PKMK (System Longitudinal Assessment & Growth Tracking)
**Target Environment:** IDE Antigravity / Fullstack Web Framework (Next.js, FastAPI, PostgreSQL, Pandas)[cite: 2]
**Author:** SIGMA PKMK Medical & Analytics Engineering Team[cite: 2]
**Version:** 2.2-SDIDTK-CORE[cite: 2]

---

## 1. DESKRIPSI SISTEM DAN TUJUAN INTEGRASI
Modul Analisis SDIDTK (Stimulasi, Deteksi, dan Intervensi Dini Tumbuh Kembang) ini dibangun sebagai modul komputasi klinis otomatis untuk balita usia **0 hingga 60 bulan**[cite: 2]. Modul ini mengintegrasikan pemantauan antropometri pertumbuhan (BB, TB/PB, LK, LiLA, serta *weight/length increments*) dengan skrining neurodevelopmental (KPSP), fungsi sensorik (TDD, TDL, Skrining Leukokoria), dan status emosional/perilaku (M-CHAT-R, KMPE, GPPH/ACTRS)[cite: 2].


```

+--------------------------------------------------------------------------------------------------+
|                                ARSITEKTUR ENGINE SDIDTK - SIGMA PKMK                             |
|                                                                                                  |
|   [Input Data Klinis & Tgl Lahir]                                                                |
|                 │                                                                                |
|                 ▼                                                                                |
|   [1. Kalkulator Umur Presisi & Koreksi Prematuritas] ───► [Pilihan Jadwal Instrumen Otomatis]  |
|                                                                          │                       |
|         ┌────────────────────────────────────────────────────────────────┴───────────┐           |
|         ▼                                                                            ▼           |
|   [2. Engine Pertumbuhan & FTT]                                            [3. Engine Perkembangan]     |
|   - Z-Score (WAZ, HAZ, WHZ, BMIZ)                                          - KPSP (10 Butir)     |
|   - Weight/Length Increment (Nelson/WHO)                                   - TDD & Skrining Mata |
|   - Early Adiposity Rebound & LiLA                                         - M-CHAT-R/KMPE/GPPH  |
|         │                                                                            │           |
|         └────────────────────────────────┬───────────────────────────────────────────┘           |
|                                          ▼                                                       |
|                     [4. Clinical Decision & Rujukan Otomatis]                                    |
|                     - Rekomendasi Asuhan Nutrisi & Stimulasi                                     |
|                     - Auto-generate Rujukan Level 1 / Spesialistik                               |
+--------------------------------------------------------------------------------------------------+

```

---

## 2. ARSITEKTUR PERHITUNGAN USIA & LOGIKA KOREKSI PREMATURITAS

### A. Algoritma Perhitungan Umur Presisi
1. **Umur Kronologis:**
   $$\text{Umur Hari} = \text{Tanggal Asesmen} - \text{Tanggal Lahir}$$
   $$\text{Umur Bulan Kronologis} = \left\lfloor \frac{\text{Umur Hari}}{30.4375} \right\rfloor$$
[cite: 2]
2. **Koreksi Prematuritas (IDAI / Kemenkes):**
   * Berlaku jika: **Usia Kronologis < 24 Bulan** DAN **Usia Gestasi saat Lahir < 37 Minggu** (atau selisih kelahiran $\ge 14\text{ hari}$ sebelum HPL)[cite: 2].
   * Rumus Koreksi:
     $$\text{Hari Defisit} = (40 - \text{Usia Gestasi (Minggu)}) \times 7$$
     $$\text{Umur Terkoreksi (Hari)} = \text{Umur Hari} - \text{Hari Defisit}$$
     $$\text{Umur Bulan Terkoreksi} = \left\lfloor \frac{\text{Umur Terkoreksi (Hari)}}{30.4375} \right\rfloor$$
[cite: 2]
3. **Logika Snap Jadwal KPSP (0–60 Bulan):**
   * Titik jadwal kuesioner baku: **3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60 Bulan**[cite: 2].
   * Aturan pembulatan: Sisa hari $\ge 16\text{ hari}$ dibulatkan ke atas ($+1\text{ bulan}$)[cite: 2]. Jika usia hasil pembulatan belum mencapai batas titik jadwal berikutnya, sistem menggunakan paket instrumen titik usia terdekat yang lebih muda[cite: 2].

---

## 3. MATRIKS ASESMEN & STANDAR INSTRUMEN BY KLASIFIKASI USIA

| Usia Asesmen | Parameter Pertumbuhan | Skrining Perkembangan (KPSP) | Skrining Pendengaran (TDD) | Skrining Penglihatan | Skrining Emosional & Perilaku Khusus |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0 – 2 Bulan** | BB/U, PB/U, BB/PB, LK, *Weight/Length Increment*[cite: 2] | Checklist Stimulasi 0–2 bln[cite: 2] | TDD 0–3 Bulan[cite: 2] | Refleks Merah & Pupil Putih[cite: 2] | Red Flags Neonatal / 2 Bulan[cite: 2] |
| **3 – 5 Bulan** | BB/U, PB/U, BB/PB, LK, *Increment*[cite: 2] | KPSP 3 Bulan (10 Soal)[cite: 2] | TDD 3–6 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | Red Flags 4 Bulan[cite: 2] |
| **6 – 8 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 6 Bulan (10 Soal)[cite: 2] | TDD 6–9 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | Red Flags 6 Bulan[cite: 2] |
| **9 – 11 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 9 Bulan (10 Soal)[cite: 2] | TDD 9–12 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | Red Flags 9 Bulan[cite: 2] |
| **12 – 14 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 12 Bulan (10 Soal)[cite: 2] | TDD 12–24 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | Red Flags 12 Bulan[cite: 2] |
| **15 – 17 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 15 Bulan (10 Soal)[cite: 2] | TDD 12–24 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | M-CHAT-R (Bila ada indikasi / $\ge 16$ bln)[cite: 2] |
| **18 – 20 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 18 Bulan (10 Soal)[cite: 2] | TDD 12–24 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | M-CHAT-R (Autisme) + Red Flags 18 bln[cite: 2] |
| **21 – 23 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 21 Bulan (10 Soal)[cite: 2] | TDD 12–24 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | M-CHAT-R (Autisme)[cite: 2] |
| **24 – 29 Bulan** | BB/U, PB/U, BB/PB, IMT/U, LK, LiLA[cite: 2] | KPSP 24 Bulan (10 Soal)[cite: 2] | TDD 24–30 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | M-CHAT-R (Autisme) + Red Flags 24 bln[cite: 2] |
| **30 – 35 Bulan** | BB/U, TB/U, BB/TB, IMT/U, LK, LiLA[cite: 2] | KPSP 30 Bulan (10 Soal)[cite: 2] | TDD 30–36 Bulan[cite: 2] | Tes Pupil Putih[cite: 2] | M-CHAT-R (Autisme)[cite: 2] |
| **36 – 41 Bulan** | BB/U, TB/U, BB/TB, IMT/U, LK, LiLA[cite: 2] | KPSP 36 Bulan (10 Soal)[cite: 2] | TDD > 36 Bulan[cite: 2] | TDL (Kartu E) + Pupil Putih[cite: 2] | KMPE + GPPH/ACTRS + Red Flags 36 bln[cite: 2] |
| **42 – 47 Bulan** | BB/U, TB/U, BB/TB, IMT/U, LK, LiLA[cite: 2] | KPSP 42 Bulan (10 Soal)[cite: 2] | TDD > 36 Bulan[cite: 2] | TDL (Kartu E) + Pupil Putih[cite: 2] | KMPE + GPPH/ACTRS[cite: 2] |
| **48 – 53 Bulan** | BB/U, TB/U, BB/TB, IMT/U, LK, LiLA[cite: 2] | KPSP 48 Bulan (10 Soal)[cite: 2] | TDD > 36 Bulan[cite: 2] | TDL (Kartu E) + Pupil Putih[cite: 2] | KMPE + GPPH/ACTRS + Red Flags 48 bln[cite: 2] |
| **54 – 59 Bulan** | BB/U, TB/U, BB/TB, IMT/U, LK, LiLA[cite: 2] | KPSP 54 Bulan (10 Soal)[cite: 2] | TDD > 36 Bulan[cite: 2] | TDL (Kartu E) + Pupil Putih[cite: 2] | KMPE + GPPH/ACTRS[cite: 2] |
| **60 Bulan** | BB/U, TB/U, BB/TB, IMT/U, LK, LiLA[cite: 2] | KPSP 60 Bulan (10 Soal)[cite: 2] | TDD > 36 Bulan[cite: 2] | TDL (Kartu E) + Pupil Putih[cite: 2] | KMPE + GPPH/ACTRS + Red Flags 60 bln[cite: 2] |

---

## 4. LOGIKA SKORING & ATURAN DIAGNOSTIK INSTRUMEN SDIDTK

### A. Kuesioner Pra Skrining Perkembangan (KPSP)
* Terdiri dari 10 pertanyaan per kelompok usia, terbagi atas 4 sektor: Gerak Kasar (GK), Gerak Halus (GH), Bicara & Bahasa (BB), Sosialisasi & Kemandirian (SK)[cite: 2].
* **Skor Ya = 9 – 10:** `SESUAI_UMUR` (Ds) $\rightarrow$ Pujian orang tua, lanjutkan stimulasi bertahap[cite: 2].
* **Skor Ya = 7 – 8:** `MERAGUKAN` (Dm) $\rightarrow$ Konseling stimulasi intensif sektor gagal selama 2 minggu, jadwalkan evaluasi ulang 2 minggu lagi[cite: 2]. Jika pada kunjungan kedua hasil tetap meragukan $\rightarrow$ trigger `RUJUK_LEVEL_1`[cite: 2].
* **Skor Ya $\le 6$:** `PENYIMPANGAN` (Dp) $\rightarrow$ Trigger rujukan otomatis ke Fasilitas Kesehatan Rujukan Tingkat Lanjut (FKRTL) / RS Rujukan Tumbuh Kembang Level 1[cite: 2].

### B. Tes Daya Dengar (TDD)
* Evaluasi kemampuan reseptif, ekspresif, dan visual interaktif anak[cite: 2].
* **Total Jawaban "Tidak" = 0:** `NORMAL`[cite: 2].
* **Total Jawaban "Tidak" $\ge 1$:** `SUSPEK_GANGGUAN_DENGAR` $\rightarrow$ Evaluasi 1 minggu atau rujuk dokter Sp.THT-KL[cite: 2].

### C. Skrining Kelainan Penglihatan (TDL & Skrining Leukokoria)
1. **Skrining Pupil Putih (Leukokoria Skrining):**
   * `NORMAL`: Refleks merah fundus simetris bilateral, pupil hitam jernih[cite: 2].
   * `ABNORMAL / CURIGA LEUKOKORIA`: Refleks merah tidak ada/asimetris atau tampak bercak putih $\rightarrow$ **EMERGENCY REFERRAL** (Suspek Retinoblastoma / Katarak Kongenital)[cite: 2].
2. **Tes Daya Lihat (TDL - Kartu E Tumbling) (Usia 36–60 Bulan):**
   * Pemeriksaan jarak 3 meter[cite: 2].
   * `DAYA_LIHAT_BAIK`: Menjawab benar arah kaki E $\ge 4$ dari 5 kesempatan (atau 3 kali berturut-turut benar)[cite: 2].
   * `DAYA_LIHAT_KURANG`: Menjawab benar $< 4$ kali atau salah 3 kali berturut-turut $\rightarrow$ `RUJUK_POLI_MATA`[cite: 2].

### D. Skrining Perilaku & Emosi Spesifik
1. **M-CHAT-R (Skrining Spektrum Autisme) (Usia 16–30 Bulan):**
   * 20 butir pertanyaan perilaku interaksi sosial[cite: 2].
   * **Aturan Penilaian:** Jawaban **"Tidak"** bernilai 1 poin risiko, **KECUALI butir No. 2, 5, dan 12** di mana jawaban **"Ya"** yang bernilai 1 poin risiko[cite: 2].
   * Skor 0 – 2: `RISIKO_RENDAH` $\rightarrow$ Stimulasi rutin[cite: 2].
   * Skor 3 – 20: `RISIKO_SEDANG_TINGGI` $\rightarrow$ `RUJUK_LEVEL_1`[cite: 2].
2. **KMPE (Kuesioner Masalah Perilaku Emosional) (Usia 36–60 Bulan):**
   * 14 pertanyaan keluhan agresivitas, kecemasan, perubahan pola tidur/makan[cite: 2].
   * Total "Ya" $= 0$: `NORMAL`[cite: 2].
   * Total "Ya" $= 1$: `MASALAH_EMOSIONAL_RINGAN` $\rightarrow$ Konseling orang tua & evaluasi 1 bulan[cite: 2].
   * Total "Ya" $\ge 2$: `MASALAH_EMOSIONAL_SIGNIFIKAN` $\rightarrow$ `RUJUK_LEVEL_1`[cite: 2].
3. **GPPH / ACTRS (Deteksi Gangguan Pemusatan Perhatian & Hiperaktivitas) (Usia $\ge 36$ Bulan):**
   * 10 butir pertanyaan skala nilai 0 (Tidak Pernah), 1 (Kadang-kadang), 2 (Sering), 3 (Selalu)[cite: 2].
   * Total Skor $< 13$: `NORMAL / BUKAN GPPH`[cite: 2].
   * Total Skor $\ge 13$: `KEMUNGKINAN_GPPH` $\rightarrow$ `RUJUK_LEVEL_1`[cite: 2].

### E. Integrasi Deteksi Pertumbuhan & Gagal Tumbuh (FTT)
1. **Weight Increment Minimal (Standar Nelson / WHO Growth Increments):**
   * Usia 3–6 bulan: $\ge 600\text{ g/bulan}$ ($20\text{ g/hari}$)
   * Usia 6–9 bulan: $\ge 450\text{ g/bulan}$ ($15\text{ g/hari}$)
   * Usia 9–12 bulan: $\ge 300\text{ g/bulan}$ ($12\text{ g/hari}$)
   * Usia 1–3 tahun: $\ge 200\text{ g/bulan}$ ($8\text{ g/hari}$)
   * Usia 4–6 tahun: $\ge 150\text{ g/bulan}$ ($6\text{ g/hari}$)
2. **Klasifikasi Trajektori Pertumbuhan:**
   * `NORMAL`: Mengikuti garis kurva pertumbuhan[cite: 2].
   * `AT_RISK_FTT`: Kenaikan BB $<\text{persentil 5 standar weight increment}$ (0–24 bln)[cite: 2].
   * `EARLY_ADIPOSITY_REBOUND`: IMT/U meningkat tajam pada usia $>7\text{ bulan}$[cite: 2].
   * `STATUS_LILA` (6–59 bln): $<11.5\text{ cm}$ (Gizi Buruk), $11.5–12.4\text{ cm}$ (Gizi Kurang), $\ge 12.5\text{ cm}$ (Normal)[cite: 2].

---

## 5. SKEMA DATABASE POSTGRESQL & TYPESCRIPT INTERFACE

### A. Skema PostgreSQL DDL
```sql
CREATE TABLE sdidtk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    faskes_id UUID NOT NULL REFERENCES puskesmas(id),
    assessment_date DATE NOT NULL,
    chronological_age_days INT NOT NULL,
    corrected_age_days INT NOT NULL,
    is_premature_corrected BOOLEAN DEFAULT FALSE,
    gestational_weeks INT,
    
    -- Parameter Antropometri
    weight_kg NUMERIC(4, 2) NOT NULL,
    height_cm NUMERIC(4, 1) NOT NULL,
    head_circ_cm NUMERIC(4, 1) NOT NULL,
    muac_lila_cm NUMERIC(4, 1),
    waz NUMERIC(4, 2),
    haz NUMERIC(4, 2),
    whz NUMERIC(4, 2),
    bmiz NUMERIC(4, 2),
    growth_trajectory VARCHAR(50),
    weight_increment_status VARCHAR(50),
    
    -- Hasil Perkembangan
    kpsp_schedule_age INT NOT NULL,
    kpsp_yes_count INT NOT NULL,
    kpsp_status VARCHAR(30) NOT NULL, -- SESUAI_UMUR, MERAGUKAN, PENYIMPANGAN
    kpsp_failed_sectors TEXT[],       -- Array: ['GK', 'GH', 'BB', 'SK']
    
    -- Skrining Khusus
    tdd_status VARCHAR(30) NOT NULL,  -- NORMAL, SUSPEK_GANGGUAN_DENGAR
    leukocoria_status VARCHAR(30),    -- NORMAL, CURIGA_LEUKOKORIA
    tdl_status VARCHAR(30),           -- DAYA_LIHAT_BAIK, DAYA_LIHAT_KURANG
    mchat_score INT,
    mchat_risk_level VARCHAR(30),     -- RISIKO_RENDAH, RISIKO_SEDANG, RISIKO_TINGGI
    kmpe_yes_count INT,
    kmpe_status VARCHAR(30),          -- NORMAL, MERAGUKAN, MASALAH_EMOSIONAL
    gpph_total_score INT,
    gpph_status VARCHAR(30),          -- NORMAL, KEMUNGKINAN_GPPH
    
    -- Keputusan & Rekomendasi
    clinical_action VARCHAR(50) NOT NULL,
    referral_required BOOLEAN DEFAULT FALSE,
    referral_target VARCHAR(100),
    next_visit_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sdidtk_child_date ON sdidtk_assessments(child_id, assessment_date DESC);
CREATE INDEX idx_sdidtk_faskes ON sdidtk_assessments(faskes_id);

```

### B. TypeScript Interface Definitions

```typescript
export type KpspSector = 'GK' | 'GH' | 'BB' | 'SK';
export type DevelopmentStatus = 'SESUAI_UMUR' | 'MERAGUKAN' | 'PENYIMPANGAN';
export type GrowthTrajectory = 'NORMAL' | 'AT_RISK_FTT' | 'EARLY_ADIPOSITY_REBOUND' | 'GROWTH_FALTERING';

export interface SdidtkInputDTO {
  childId: string;
  faskesId: string;
  birthDate: string;        // ISO Format: YYYY-MM-DD
  assessmentDate: string;   // ISO Format: YYYY-MM-DD
  gestationalWeeksAtBirth: number;
  weightKg: number;
  heightCm: number;
  headCircumferenceCm: number;
  muacLilaCm?: number;
  previousAssessment?: {
    weightKg: number;
    heightCm: number;
    assessmentDate: string;
  };
  kpspResponses: Array<{
    questionId: string;
    sector: KpspSector;
    response: boolean; // true = Ya, false = Tidak
  }>;
  tddResponses: Array<{
    questionId: string;
    response: boolean; // true = Ya, false = Tidak
  }>;
  leukocoriaScreening: 'NORMAL' | 'ABNORMAL';
  tdlResponseCorrectCount?: number; // 0 - 5
  mchatAnswers?: Record<number, boolean>; // key: 1-20
  kmpeAnswers?: Record<number, boolean>;  // key: 1-14
  gpphAnswers?: Record<number, number>;   // key: 1-10, value: 0-3
}

export interface SdidtkOutputDTO {
  chronologicalAgeMonths: number;
  correctedAgeMonths: number;
  isPrematureCorrected: boolean;
  growth: {
    waz: number;
    haz: number;
    whz: number;
    bmiz: number;
    trajectory: GrowthTrajectory;
    weightGainVelocityGDay?: number;
    incrementAdequate: boolean;
    lilaClassification?: string;
  };
  development: {
    kpspSchedule: number;
    kpspScore: number;
    kpspStatus: DevelopmentStatus;
    failedSectors: KpspSector[];
  };
  screening: {
    tddStatus: 'NORMAL' | 'SUSPEK_GANGGUAN_DENGAR';
    leukocoriaStatus: 'NORMAL' | 'CURIGA_LEUKOKORIA';
    tdlStatus?: 'DAYA_LIHAT_BAIK' | 'DAYA_LIHAT_KURANG';
    mchatRisk?: 'RISIKO_RENDAH' | 'RISIKO_SEDANG' | 'RISIKO_TINGGI';
    kmpeStatus?: 'NORMAL' | 'MERAGUKAN' | 'MASALAH_EMOSIONAL';
    gpphStatus?: 'NORMAL' | 'KEMUNGKINAN_GPPH';
  };
  decision: {
    actionCode: 'STIMULASI_RUTIN' | 'EVALUASI_2_MINGGU' | 'EVALUASI_1_BULAN' | 'RUJUK_RS_LEVEL_1' | 'EMERGENCY_RUJUKAN';
    referralNeeded: boolean;
    referralDestination?: string;
    nextScheduleDate: string;
    clinicalNotes: string;
  };
}

```

---

## 6. IMPLEMENTASI PYTHON ENGINE COMPUTATION (`sdidtk_engine.py`)

```python
import math
from datetime import datetime, date
from typing import Dict, List, Optional, Any

class SdidtkComputationEngine:
    """
    Engine komputasi SDIDTK terintegrasi untuk SIGMA PKMK.
    Menerapkan standar Kemenkes RI, IDAI, dan Nelson Growth Increment.
    """

    @staticmethod
    def calculate_precise_age(birth_date: date, eval_date: date, gestational_weeks: int) -> Dict[str, Any]:
        delta_days = (eval_date - birth_date).days
        chronological_months = delta_days / 30.4375
        
        is_corrected = False
        corrected_days = delta_days
        
        # Koreksi jika prematur (< 37 minggu) dan usia kronologis < 24 bulan
        if chronological_months < 24.0 and gestational_weeks < 37:
            is_corrected = True
            deficit_days = (40 - gestational_weeks) * 7
            corrected_days = max(0, delta_days - deficit_days)
            
        corrected_months = corrected_days / 30.4375
        
        # Pembulatan KPSP: sisa hari >= 16 dibulatkan ke atas
        rem_days = delta_days % 30
        rounded_chronological = int(chronological_months) + (1 if rem_days >= 16 else 0)
        
        # Penentuan jadwal KPSP baku terdekat
        kpsp_brackets = [3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60]
        eval_age_m = corrected_months if is_corrected else chronological_months
        
        selected_bracket = 3
        for b in kpsp_brackets:
            if eval_age_m >= b:
                selected_bracket = b
            else:
                break
                
        return {
            "chronological_days": delta_days,
            "chronological_months": round(chronological_months, 2),
            "corrected_days": corrected_days,
            "corrected_months": round(corrected_months, 2),
            "is_premature_corrected": is_corrected,
            "kpsp_schedule_bracket": selected_bracket
        }

    @staticmethod
    def evaluate_kpsp(responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        responses = [{'question_id': 'q1', 'sector': 'GK', 'response': True}, ...]
        """
        yes_count = sum(1 for r in responses if r.get('response') is True)
        failed_sectors = list(set(r['sector'] for r in responses if r.get('response') is False))
        
        if yes_count >= 9:
            status = "SESUAI_UMUR"
        elif 7 <= yes_count <= 8:
            status = "MERAGUKAN"
        else:
            status = "PENYIMPANGAN"
            
        return {
            "yes_count": yes_count,
            "status": status,
            "failed_sectors": failed_sectors
        }

    @staticmethod
    def evaluate_tdd(responses: List[Dict[str, Any]]) -> str:
        no_count = sum(1 for r in responses if r.get('response') is False)
        return "NORMAL" if no_count == 0 else "SUSPEK_GANGGUAN_DENGAR"

    @staticmethod
    def evaluate_vision(leukocoria_check: str, tdl_score: Optional[int] = None) -> Dict[str, str]:
        res = {"leukocoria": "NORMAL", "tdl": "NOT_APPLICABLE"}
        
        if leukocoria_check.upper() != "NORMAL":
            res["leukocoria"] = "CURIGA_LEUKOKORIA"
            
        if tdl_score is not None:
            res["tdl"] = "DAYA_LIHAT_BAIK" if tdl_score >= 4 else "DAYA_LIHAT_KURANG"
            
        return res

    @staticmethod
    def evaluate_mchat_r(answers: Dict[int, bool]) -> Dict[str, Any]:
        if not answers:
            return {"score": 0, "risk": "NOT_ASSESSED"}
            
        risk_score = 0
        for item_no, val in answers.items():
            # Item 2, 5, 12 bernilai risiko jika 'Ya' (True), sisanya jika 'Tidak' (False)
            if item_no in [2, 5, 12]:
                if val is True: risk_score += 1
            else:
                if val is False: risk_score += 1
                
        if risk_score <= 2:
            risk_level = "RISIKO_RENDAH"
        elif 3 <= risk_score <= 7:
            risk_level = "RISIKO_SEDANG"
        else:
            risk_level = "RISIKO_TINGGI"
            
        return {"score": risk_score, "risk": risk_level}

    @staticmethod
    def evaluate_kmpe(answers: Dict[int, bool]) -> Dict[str, Any]:
        if not answers:
            return {"yes_count": 0, "status": "NOT_ASSESSED"}
            
        yes_count = sum(1 for v in answers.values() if v is True)
        if yes_count == 0:
            status = "NORMAL"
        elif yes_count == 1:
            status = "MERAGUKAN"
        else:
            status = "MASALAH_EMOSIONAL"
            
        return {"yes_count": yes_count, "status": status}

    @staticmethod
    def evaluate_gpph(answers: Dict[int, int]) -> Dict[str, Any]:
        if not answers:
            return {"score": 0, "status": "NOT_ASSESSED"}
            
        total_score = sum(answers.values())
        status = "KEMUNGKINAN_GPPH" if total_score >= 13 else "NORMAL"
        return {"score": total_score, "status": status}

    @classmethod
    def process_full_sdidtk(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        birth_d = datetime.strptime(payload['birth_date'], '%Y-%m-%d').date()
        eval_d = datetime.strptime(payload['assessment_date'], '%Y-%m-%d').date()
        gest_w = payload.get('gestational_weeks', 40)
        
        age_info = cls.calculate_precise_age(birth_d, eval_d, gest_w)
        kpsp_res = cls.evaluate_kpsp(payload.get('kpsp_responses', []))
        tdd_res = cls.evaluate_tdd(payload.get('tdd_responses', []))
        vis_res = cls.evaluate_vision(payload.get('leukocoria_check', 'NORMAL'), payload.get('tdl_score'))
        mchat_res = cls.evaluate_mchat_r(payload.get('mchat_answers', {}))
        kmpe_res = cls.evaluate_kmpe(payload.get('kmpe_answers', {}))
        gpph_res = cls.evaluate_gpph(payload.get('gpph_answers', {}))
        
        # Clinical Recommendation Logic
        referral_triggers = []
        if kpsp_res['status'] == "PENYIMPANGAN":
            referral_triggers.append("KPSP Penyimpangan")
        if tdd_res == "SUSPEK_GANGGUAN_DENGAR":
            referral_triggers.append("Suspek Gangguan Pendengaran")
        if vis_res['leukocoria'] == "CURIGA_LEUKOKORIA":
            referral_triggers.append("Curiga Leukokoria Mata (EMERGENCY)")
        if vis_res['tdl'] == "DAYA_LIHAT_KURANG":
            referral_triggers.append("Daya Lihat Kurang")
        if mchat_res.get('risk') in ["RISIKO_SEDANG", "RISIKO_TINGGI"]:
            referral_triggers.append(f"M-CHAT-R {mchat_res['risk']}")
        if kmpe_res.get('status') == "MASALAH_EMOSIONAL":
            referral_triggers.append("KMPE Masalah Emosional")
        if gpph_res.get('status') == "KEMUNGKINAN_GPPH":
            referral_triggers.append("Skrining GPPH Positif")
            
        referral_needed = len(referral_triggers) > 0
        
        if vis_res['leukocoria'] == "CURIGA_LEUKOKORIA":
            action_code = "EMERGENCY_RUJUKAN"
            destination = "Spesialis Mata / RS Rujukan Tersier"
        elif referral_needed:
            action_code = "RUJUK_RS_LEVEL_1"
            destination = "RS Rujukan Tumbuh Kembang Level 1"
        elif kpsp_res['status'] == "MERAGUKAN" or kmpe_res.get('status') == "MERAGUKAN":
            action_code = "EVALUASI_2_MINGGU"
            destination = "Puskesmas (Evaluasi Ulang)"
        else:
            action_code = "STIMULASI_RUTIN"
            destination = "Posyandu / Puskesmas"

        return {
            "age_analysis": age_info,
            "development_evaluation": kpsp_res,
            "hearing_evaluation": tdd_res,
            "vision_evaluation": vis_res,
            "behavior_evaluation": {
                "mchat": mchat_res,
                "kmpe": kmpe_res,
                "gpph": gpph_res
            },
            "clinical_decision": {
                "action_code": action_code,
                "referral_needed": referral_needed,
                "referral_triggers": referral_triggers,
                "referral_destination": destination
            }
        }

```

---

## 7. PANDUAN PENGEMBANGAN UI/UX DI ANTIGRAVITY IDE

### A. Dynamic Smart Assessment Wizard

1. **Header Real-Time Badge:** Menampilkan badge usia kronologis vs umur terkoreksi jika anak teridentifikasi lahir prematur.


2. **Age-Adaptive Question Filter:** Sistem hanya menampilkan kuesioner dan tes yang relevan secara otomatis sesuai titik usia anak (misal: form M-CHAT-R otomatis terkunci jika usia $<16$ bulan).


3. **Sectoral Radar Chart:** Menampilkan visualisasi performa 4 sektor perkembangan (GK, GH, BB, SK) dari kuesioner KPSP untuk mendeteksi domain yang tertinggal.


4. **One-Click Clinical Referral Generator:** Menyusun surat pengantar rujukan terstruktur (PDF/Cetak) mencakup data demografi, trajektori pertumbuhan, riwayat KPSP, dan poin pemicu rujukan.



```

---

### Cara Mengunduh & Memasang File Spesifikasi di Antigravity IDE:
1. Simpan kode blok di atas sebagai file **`INSTRUCTION_SDIDTK_ANALYSIS.md`** di folder root proyek atau di dalam direktori `docs/specs/` pada repository **SIGMA PKMK**[cite: 1, 2].
2. Di dalam **Antigravity IDE**, gunakan file ini sebagai panduan implementasi untuk men-generate logic backend, endpoint API, skema tabel migrasi, serta komponen frontend SDIDTK secara otomatis dan konsisten dengan modul analisis PKMK[cite: 1, 2].

```