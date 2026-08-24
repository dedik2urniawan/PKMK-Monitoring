```markdown
# INSTRUCTION SPECIFICATION: MODUL DETEKSI DINI GANGGUAN SPEKTRUM AUTISME (M-CHAT-R)
## Platform: SIGMA PKMK (System Longitudinal Assessment & Growth Tracking)
**Target Environment:** Antigravity IDE / Fullstack Web Framework (Next.js / FastAPI / PostgreSQL / TypeScript / Python)[cite: 1]
**Clinical Standard:** Modified Checklist for Autism in Toddlers, Revised (M-CHAT-R/F) & Buku Bagan SDIDTK Kemenkes RI[cite: 1]
**Version:** 2.5-MCHATR-CORE[cite: 1]

---

## 1. DESKRIPSI DAN INDIKASI PEMERIKSAAN
Modul M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) adalah instrumen skrining terstandardisasi yang digunakan pada platform SIGMA PKMK untuk mengidentifikasi risiko Gangguan Spektrum Autisme (GSA / *Autism Spectrum Disorder*)[cite: 1].

### Indikasi Pelaksanaan Skrining:
* **Kelompok Usia Sasaran:** Anak usia **16 hingga 30 bulan** (skrining universal atau berkala pada jadwal KPSP 18 dan 24 bulan)[cite: 1].
* **Skrining Atas Indikasi (Keluhan Spesifik):** Dilakukan jika ditemukan keluhan/tanda berikut pada anak[cite: 1]:
  1. Terlambat bicara (*speech delay*) atau hilangnya kemampuan bahasa yang telah dikuasai[cite: 1].
  2. Gangguan komunikasi dan interaksi sosial (kontak mata minim, tidak menoleh saat dipanggil namanya)[cite: 1].
  3. Perilaku berulang-ulang (*stereotypic / repetitive behavior*) atau minat yang sangat terbatas[cite: 1].

---

## 2. DAFTAR KUESIONER LENGKAP 20 BUTIR PERTANYAAN M-CHAT-R

Petunjuk pengisian untuk orang tua/pengasuh: *Jawablah pertanyaan berdasarkan perilaku kebiasaan anak sehari-hari. Jika anak hanya pernah melakukan tindakan tersebut beberapa kali dan tidak konsisten, pilihlah jawaban "TIDAK"*[cite: 1].

| No | Butir Pertanyaan M-CHAT-R | Penjelasan & Contoh Klinis bagi Orang Tua | Jawaban Risiko Tinggi (Poin = 1) |
| :---: | :--- | :--- | :---: |
| **1** | Jika Anda menunjuk sesuatu di ruangan, apakah anak Anda melihatnya? | Misalnya, jika Anda menunjuk seekor hewan atau mainan di sudut ruangan, apakah anak Anda menoleh dan melihat ke arah objek yang Anda tunjuk[cite: 1]? | **TIDAK**[cite: 1] |
| **2** | Pernahkah Anda berpikir bahwa anak Anda tuli / sulit mendengar? | Orang tua merasa anak tidak mendengar karena sering tidak merespons suara, meskipun fungsi organ telinga normal[cite: 1]. | **YA** *(Inverted)*[cite: 1] |
| **3** | Apakah anak Anda pernah bermain pura-pura (*pretend play*)? | Misalnya, berpura-pura minum dari cangkir kosong, berbicara menggunakan gagang telepon mainan, atau menyuapi boneka[cite: 1]. | **TIDAK**[cite: 1] |
| **4** | Apakah anak Anda suka memanjat benda-benda? | Misalnya, memanjat perabot rumah tangga, tangga, atau alat permainan di taman[cite: 1]. | **TIDAK**[cite: 1] |
| **5** | Apakah anak Anda membuat gerakan jari yang tidak biasa di dekat matanya? | Misalnya, melambai-lambaikan atau memutar-mutar jari di depan matanya sendiri secara berulang-ulang (*stereotypic finger movement*)[cite: 1]. | **YA** *(Inverted)*[cite: 1] |
| **6** | Apakah anak Anda menunjuk dengan satu jari untuk meminta sesuatu atau meminta tolong? | Misalnya, menunjuk kue atau mainan di rak tinggi yang tidak dapat ia jangkau (*protoimperative pointing*)[cite: 1]. | **TIDAK**[cite: 1] |
| **7** | Apakah anak Anda menunjuk dengan satu jari untuk memperlihatkan sesuatu yang menarik? | Misalnya, menunjuk pesawat terbang di langit atau truk lewat untuk berbagi ketertarikan, bukan untuk memintanya (*protodeclarative pointing*)[cite: 1]. | **TIDAK**[cite: 1] |
| **8** | Apakah anak Anda tertarik pada anak-anak lain? | Misalnya, memperhatikan anak lain, tersenyum pada mereka, atau berusaha berjalan mendekati anak sebayanya[cite: 1]. | **TIDAK**[cite: 1] |
| **9** | Apakah anak Anda pernah memperlihatkan suatu benda dengan membawa atau mengangkatnya kepada Anda? | Tujuannya murni untuk berbagi (*joint attention*), bukan untuk meminta tolong (misalnya membawa bunga atau mobil mainan lalu menunjukkannya kepada orang tua)[cite: 1]. | **TIDAK**[cite: 1] |
| **10** | Apakah anak Anda memberikan respons jika namanya dipanggil? | Misalnya menoleh, menatap mata pemanggil, bersuara/bergumam, atau menghentikan sejenak apa yang sedang dilakukannya saat namanya dipanggil[cite: 1]. | **TIDAK**[cite: 1] |
| **11** | Saat Anda tersenyum pada anak Anda, apakah anak Anda tersenyum balik? | Respons senyuman sosial dua arah (*social smile*) terhadap interaksi wajah orang tua[cite: 1]. | **TIDAK**[cite: 1] |
| **12** | Apakah anak Anda pernah marah/menangis saat mendengar suara bising sehari-hari? | Misalnya berteriak, menangis ketakutan, atau menutup telinga saat mendengar suara *vacuum cleaner*, blender, atau musik keras (*sensory auditory hypersensitivity*)[cite: 1]. | **YA** *(Inverted)*[cite: 1] |
| **13** | Apakah anak Anda bisa berjalan mandiri? | Menilai perkembangan motorik kasar dasar[cite: 1]. | **TIDAK**[cite: 1] |
| **14** | Apakah anak Anda menatap mata Anda saat Anda bicara padanya, bermain bersamanya, atau saat memakaikan pakaian? | Mempertahankan kontak mata (*eye contact*) secara konsisten selama interaksi tatap muka[cite: 1]. | **TIDAK**[cite: 1] |
| **15** | Apakah anak Anda mencoba meniru apa yang Anda lakukan? | Misalnya menirukan lambaian tangan (*dadah*), tepuk tangan, atau menirukan suara lucu yang Anda buat[cite: 1]. | **TIDAK**[cite: 1] |
| **16** | Jika Anda memutar kepala untuk melihat sesuatu, apakah anak Anda melihat sekeliling untuk melihat apa yang Anda lihat? | Mengikuti arah pandangan orang tua (*gaze following*)[cite: 1]. | **TIDAK**[cite: 1] |
| **17** | Apakah anak Anda mencoba membuat Anda melihat kepadanya? | Misalnya mencari pujian, menatap Anda sambil berkata *"lihat"* atau menarik perhatian agar Anda memperhatikannya[cite: 1]. | **TIDAK**[cite: 1] |
| **18** | Apakah anak Anda mengerti saat Anda memintanya melakukan sesuatu tanpa bantuan gestur? | Misalnya memahami instruksi *"taruh buku di atas kursi"* atau *"ambilkan sepatu"* murni dari instruksi lisan tanpa Anda menunjuk ke arah benda tersebut[cite: 1]. | **TIDAK**[cite: 1] |
| **19** | Jika sesuatu yang baru terjadi, apakah anak Anda menatap wajah Anda untuk melihat perasaan Anda tentang hal tersebut? | *Social referencing*: menatap wajah orang tua saat mendengar suara aneh atau melihat benda asing untuk mengecek apakah situasi aman[cite: 1]. | **TIDAK**[cite: 1] |
| **20** | Apakah anak Anda menyukai aktivitas fisik yang dinamis? | Misalnya merasa senang saat diayun-ayun atau dihentak-hentakkan perlahan di atas lutut orang tua (*vestibular stimulation*)[cite: 1]. | **TIDAK**[cite: 1] |

---

## 3. MODEL PERHITUNGAN SKOR & LOGIKA DIAGNOSTIK

### A. Algoritma Skoring Poin Risiko
Skor risiko dihitung dari akumulasi poin kegagalan (*risk items*)[cite: 1]:
* **Aturan Baku:** Setiap jawaban **"TIDAK"** bernilai $+1\text{ poin risiko}$[cite: 1].
* **Aturan Inversi (Pengecualian Kritis):** Khusus butir **No. 2, 5, dan 12**, jawaban **"YA"** bernilai $+1\text{ poin risiko}$[cite: 1].

$$\text{Total Skor Risiko} = \sum_{i \in \{2, 5, 12\}} \mathbb{I}(\text{Answer}_i == \text{'YA'}) + \sum_{j \notin \{2, 5, 12\}} \mathbb{I}(\text{Answer}_j == \text{'TIDAK'})$$
[cite: 1]

### B. Matriks Stratifikasi Risiko & Jalur Intervensi Klinis


```

```
                      +------------------------------------------+
                      |   TOTAL SKOR RISIKO M-CHAT-R (0 - 20)    |
                      +------------------------------------------+
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼

```

+───────────────────────────+                                       +───────────────────────────+
|     SKOR 0 - 2 POIN       |                                       |     SKOR 3 - 20 POIN      |
|       Risiko Rendah       |                                       |    Risiko Sedang-Tinggi   |
+───────────────────────────+                                       +───────────────────────────+
│                                                                   │
┌────────┴────────┐                                                          ▼
▼                 ▼                                             +───────────────────────────+
[Usia < 24 Bulan]  [Usia >= 24 Bulan]                               |     RUJUK SEGERA KE       |
Skrining ulang     Stimulasi rutin,                                 |   RS RUJUKAN TUMBANG      |
setelah ultah ke-2 jadwal berkala                                   |         LEVEL 1           |
+───────────────────────────+

```

| Kategori Skor | Klasifikasi Status | Interpretasi Klinis | Tindakan & Alur Rujukan Kemenkes RI |
| :---: | :--- | :--- | :--- |
| **0 – 2 Poin** | `RISIKO_RENDAH`[cite: 1] | Kemungkinan gangguan spektrum autisme sangat rendah[cite: 1]. | • Berikan apresiasi kepada orang tua dan anak[cite: 1].<br>• Lanjutkan stimulasi perkembangan sesuai tahapan usia[cite: 1].<br>• **Khusus anak umur < 24 bulan:** Wajib jadwalkan pemeriksaan ulang setelah ulang tahun ke-2 (usia 24 bulan)[cite: 1].<br>• Jadwalkan kunjungan pemantauan berkala berikutnya[cite: 1]. |
| **3 – 20 Poin** | `RISIKO_SEDANG_TINGGI`[cite: 1] | Ditemukan indikasi kuat hambatan interaksi sosial, komunikasi, atau perilaku stereotipik[cite: 1]. | • **Rujuk ke RS Rujukan Tumbuh Kembang Level 1** / Dokter Spesialis Anak Konsultan Tumbuh Kembang untuk pemeriksaan diagnostik lanjutan (*Autism Diagnostic Observation Schedule* / ADOS, *Childhood Autism Rating Scale* / CARS)[cite: 1].<br>• Lakukan edukasi awal dan konseling suportif bagi keluarga[cite: 1]. |

---

## 4. SKEMA DATABASE & DATA CONTRACT (TYPESCRIPT DTO)

### A. Skema Tabel PostgreSQL DDL
```sql
CREATE TABLE mchat_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES sdidtk_assessments(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    faskes_id UUID NOT NULL REFERENCES puskesmas(id),
    screening_date DATE NOT NULL,
    age_in_months NUMERIC(4, 2) NOT NULL,
    
    -- Indikasi Skrining
    is_routine_screening BOOLEAN DEFAULT TRUE,
    has_speech_delay BOOLEAN DEFAULT FALSE,
    has_social_communication_issue BOOLEAN DEFAULT FALSE,
    has_repetitive_behavior BOOLEAN DEFAULT FALSE,
    
    -- Raw Responses (20 Butir)
    q1_points_at_objects BOOLEAN NOT NULL,
    q2_hearing_concern BOOLEAN NOT NULL,      -- Inverted
    q3_pretend_play BOOLEAN NOT NULL,
    q4_climbs_objects BOOLEAN NOT NULL,
    q5_unusual_finger_movement BOOLEAN NOT NULL, -- Inverted
    q6_point_to_ask BOOLEAN NOT NULL,
    q7_point_to_share BOOLEAN NOT NULL,
    q8_interest_in_children BOOLEAN NOT NULL,
    q9_shows_objects_to_share BOOLEAN NOT NULL,
    q10_responds_to_name BOOLEAN NOT NULL,
    q11_social_smile BOOLEAN NOT NULL,
    q12_noise_sensitive BOOLEAN NOT NULL,     -- Inverted
    q13_can_walk BOOLEAN NOT NULL,
    q14_eye_contact BOOLEAN NOT NULL,
    q15_imitates_actions BOOLEAN NOT NULL,
    q16_gaze_following BOOLEAN NOT NULL,
    q17_seeks_attention BOOLEAN NOT NULL,
    q18_understands_commands BOOLEAN NOT NULL,
    q19_social_referencing BOOLEAN NOT NULL,
    q20_enjoys_movement_play BOOLEAN NOT NULL,
    
    -- Scoring & Decision Output
    total_risk_score INT NOT NULL,
    risk_classification VARCHAR(30) NOT NULL, -- RISIKO_RENDAH, RISIKO_SEDANG_TINGGI
    failed_items INT[] NOT NULL,              -- Array butir yang memicu poin risiko
    referral_triggered BOOLEAN NOT NULL,
    referral_destination VARCHAR(100),
    next_reassessment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mchat_child ON mchat_screenings(child_id, screening_date DESC);
CREATE INDEX idx_mchat_risk ON mchat_screenings(risk_classification);

```

### B. TypeScript Data Contract (`mchat.types.ts`)

```typescript
export interface MchatSubmissionPayload {
  childId: string;
  faskesId: string;
  screeningDate: string; // YYYY-MM-DD
  ageInMonths: number;
  clinicalIndications?: {
    hasSpeechDelay: boolean;
    hasSocialCommunicationIssue: boolean;
    hasRepetitiveBehavior: boolean;
  };
  // Key: 1 to 20, Value: true for "YA", false for "TIDAK"
  responses: Record<number, boolean>;
}

export interface MchatEvaluationResult {
  childId: string;
  screeningDate: string;
  ageInMonths: number;
  totalRiskScore: number;
  riskClassification: 'RISIKO_RENDAH' | 'RISIKO_SEDANG_TINGGI';
  failedItemNumbers: number[];
  recommendation: {
    actionCode: 'STIMULASI_RUTIN' | 'RETEST_AFTER_24M' | 'RUJUK_RS_LEVEL_1';
    title: string;
    description: string;
    referralRequired: boolean;
    referralTarget?: string;
    nextReassessmentDueDate?: string;
  };
}

```

---

## 5. MESIN KALKULASI PYTHON BACKEND (`mchat_engine.py`)

```python
from datetime import date, timedelta
from typing import Dict, List, Any

class MchatEngine:
    """
    Engine Kalkulasi M-CHAT-R Sesuai Standar SDIDTK Kemenkes RI.
    """
    INVERTED_ITEMS = {2, 5, 12}  # Butir bernilai risiko jika dijawab YA (True)

    @classmethod
    def calculate_score(cls, responses: Dict[int, bool]) -> Dict[str, Any]:
        """
        responses: dict dengan key int (1 - 20) dan value boolean (True = Ya, False = Tidak)
        """
        if len(responses) < 20:
            raise ValueError(f"Form M-CHAT-R tidak lengkap. Diterima {len(responses)} dari 20 butir.")

        total_risk_score = 0
        failed_items: List[int] = []

        for item_no in range(1, 21):
            val = responses.get(item_no)
            if item_no in cls.INVERTED_ITEMS:
                # Butir inversi: Berisiko jika dijawab YA (True)
                if val is True:
                    total_risk_score += 1
                    failed_items.append(item_no)
            else:
                # Butir reguler: Berisiko jika dijawab TIDAK (False)
                if val is False:
                    total_risk_score += 1
                    failed_items.append(item_no)

        return {
            "total_risk_score": total_risk_score,
            "failed_items": failed_items
        }

    @classmethod
    def evaluate_clinical_decision(
        cls, 
        child_id: str, 
        age_in_months: float, 
        screening_date: date, 
        responses: Dict[int, bool]
    ) -> Dict[str, Any]:
        scoring = cls.calculate_score(responses)
        score = scoring["total_risk_score"]
        failed = scoring["failed_items"]

        if score <= 2:
            classification = "RISIKO_RENDAH"
            referral_required = False
            referral_target = None
            
            if age_in_months < 24.0:
                action_code = "RETEST_AFTER_24M"
                title = "Risiko Rendah (Perlu Re-evaluasi Usia 24 Bulan)"
                description = "Lanjutkan stimulasi rutin. Jadwalkan pemeriksaan ulang saat anak berusia genap 2 tahun."
                # Jadwalkan saat usia 24 bulan
                months_to_add = 24.0 - age_in_months
                days_to_add = int(months_to_add * 30.4375)
                next_date = (screening_date + timedelta(days=days_to_add)).isoformat()
            else:
                action_code = "STIMULASI_RUTIN"
                title = "Risiko Rendah Gangguan Spektrum Autisme"
                description = "Perkembangan interaksi sosial dan komunikasi dalam batas normal. Lanjutkan stimulasi sesuai usia."
                next_date = (screening_date + timedelta(days=90)).isoformat()
        else:
            classification = "RISIKO_SEDANG_TINGGI"
            action_code = "RUJUK_RS_LEVEL_1"
            title = "Risiko Sedang-Tinggi Gangguan Spektrum Autisme"
            description = f"Ditemukan {score} butir risiko. Diperlukan rujukan ke Rumah Sakit Rujukan Tumbuh Kembang Level 1."
            referral_required = True
            referral_target = "RS Rujukan Tumbuh Kembang Level 1 / Dokter Spesialis Anak"
            next_date = None

        return {
            "child_id": child_id,
            "screening_date": screening_date.isoformat(),
            "age_in_months": age_in_months,
            "total_risk_score": score,
            "risk_classification": classification,
            "failed_item_numbers": failed,
            "recommendation": {
                "action_code": action_code,
                "title": title,
                "description": description,
                "referral_required": referral_required,
                "referral_target": referral_target,
                "next_reassessment_due_date": next_date
            }
        }

```

---

## 6. SPESIFIKASI UI/UX WIZARD DI ANTIGRAVITY IDE

1. **Adaptive Triggering Logic:** Form M-CHAT-R otomatis diaktifkan pada wizard jika umur anak berada pada rentang **16–30 bulan**, atau saat petugas mencentang salah satu dari 3 keluhan indikasi (*speech delay*, gangguan kontak sosial, *repetitive behavior*).


2. **Contextual Question Tooltips:** Setiap butir pertanyaan dilengkapi teks bantuan (*helper text*) berwarna netral yang memuat contoh konkret perilaku sehari-hari agar orang tua tidak salah menafsirkan pertanyaan.


3. **Inverted Item Visual Safeguard:** Pada backend dan state form, butir No. 2, 5, dan 12 ditandai secara internal tanpa membingungkan petugas input (pilihan antarmuka tetap berupa tombol sederhana: **"Ya"** atau **"Tidak"**).


4. **Instant Score & Referral Dispatcher:** Setelah 20 butir terisi lengkap, dashboard secara instan menampilkan *Risk Score Gauge* (0–20). Jika skor $\ge 3$, sistem langsung mengaktifkan tombol *Generate Surat Rujukan RS Level 1* dengan ringkasan butir yang gagal.



```

```