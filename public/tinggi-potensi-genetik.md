SPESIFIKASI FITUR & ANALISIS: TINGGI POTENSI GENETIK (TPG / MID-PARENTAL HEIGHT)
Sistem: SIGMA Ecosystem Platform
Modul: Child Growth & Anthropometry Analytics Engine
Dokumen: Technical & Clinical Analysis Specification
Format: Markdown (.md)

________________________________________
1. PENDAHULUAN & LANDASAN KLINIS
1.1 Definisi & Tujuan
Tinggi Potensi Genetik (TPG) atau Mid-Parental Height (MPH) / Target Height adalah estimasi tinggi badan dewasa yang diharapkan dapat dicapai oleh seorang anak berdasarkan tinggi biologis kedua orang tua kandungnya.

Dalam ekosistem pemantauan tumbuh kembang (seperti SIGMA Ecosystem), analisis TPG berfungsi sebagai:

1.	Tolok Ukur Biologis Individu: Menilai apakah pertumbuhan linier anak berada pada jalur potensi genetiknya atau mengalami deviasi (gangguan pertumbuhan).
2.	Skrining Diferensiasi Diagnostik:
-	Membedakan antara variasi normal pertumbuhan (Familial Short Stature vs Constitutional Delay of Growth and Puberty / CDGP) dengan kondisi patologis (Growth Hormone Deficiency, sindrom Turner, disproporsi skeletal).
-	Membedakan perawakan pendek akibat stunting (malnutrisi kronis & infeksi berulang) dari potensi genetik bawaan keluarga.
3.	Early Warning & Prognosis: Memberikan proyeksi target akhir pertumbuhan saat usia dewasa (18–20 tahun) untuk mendukung intervensi gizi dan medis sedini mungkin.

________________________________________
2. FORMULA PERHITUNGAN STANDAR (IDAI & TANNER)
Perhitungan TPG mengacu pada rekomendasi Ikatan Dokter Anak Indonesia (IDAI) dan metode Tanner-Whitehouse yang disesuaikan dengan rata-rata perbedaan tinggi badan pria dan wanita dewasa (13 cm).
2.1 Formula Matematis
A. Anak Laki-Laki (Boy Target Height)
$$\text{TPG}{\text{Laki-laki}} = \frac{\text{TB}{\text{Ayah}} + (\text{TB}_{\text{Ibu}} + 13)}{2} \pm 8.5 \text{ cm}$$

-	Target Height (Mean): $\frac{\text{TB}{\text{Ayah}} + \text{TB}{\text{Ibu}} + 13}{2}$
-	Rentang Minimum (Lower Bound): $\text{TPG}_{\text{Mean}} - 8.5 \text{ cm}$
-	Rentang Maksimum (Upper Bound): $\text{TPG}_{\text{Mean}} + 8.5 \text{ cm}$
B. Anak Perempuan (Girl Target Height)
$$\text{TPG}{\text{Perempuan}} = \frac{(\text{TB}{\text{Ayah}} - 13) + \text{TB}_{\text{Ibu}}}{2} \pm 8.5 \text{ cm}$$

-	Target Height (Mean): $\frac{\text{TB}{\text{Ayah}} + \text{TB}{\text{Ibu}} - 13}{2}$
-	Rentang Minimum (Lower Bound): $\text{TPG}_{\text{Mean}} - 8.5 \text{ cm}$
-	Rentang Maksimum (Upper Bound): $\text{TPG}_{\text{Mean}} + 8.5 \text{ cm}$

Catatan: Deviasi $\pm 8.5 \text{ cm}$ merepresentasikan rentang persentil ke-3 hingga ke-97 ($\pm 2 \text{ SD}$ variabilitas poligenik populasi).

________________________________________
3. LOGIKA ANALISIS & INTERPRETASI
3.1 Proyeksi Tinggi Dewasa (Predicted Adult Height - PAH)
Untuk mengevaluasi posisi anak saat ini terhadap TPG:

1.	Konversi Tinggi Badan (TB) anak saat ini ke dalam Z-Score TB/U (atau persentil) mengacu pada standar WHO Child Growth Standards (0–5 tahun) atau CDC/National Growth Charts (5–18 tahun).
2.	Asumsikan lintasan pertumbuhan anak mengikuti kanal persentil/Z-score yang sama hingga usia dewasa (18–20 tahun) untuk mendapatkan Predicted Adult Height (PAH).
3.	Bandingkan nilai PAH dengan rentang $[\text{TPG}{\text{Min}}, \text{TPG}{\text{Max}}]$.
3.2 Matriks Klasifikasi Status
Kategori Status	Kondisi Matematis	Interpretasi Klinis	Rekomendasi Sistem / Tindakan
Sesuai Potensi Genetik (On-Track / Normal)	$\text{TPG}{\text{Min}} \le \text{PAH} \le \text{TPG}{\text{Max}}$	Pertumbuhan linier anak berjalan seimbang dengan potensi biologis orang tua.	Lanjutkan pemantauan gizi dan stimulasi rutin berkala.
Di Bawah Potensi Genetik (Below Genetic Potential)	$\text{PAH} < \text{TPG}_{\text{Min}}$	Pertumbuhan anak tertinggal dibanding potensi genetiknya. Mengindikasikan gagal tumbuh (growth faltering), stunting nutrisional, penyakit kronis, atau gangguan endokrin.	Alert sistem! Periksa kecepatan tumbuh (growth velocity), evaluasi asupan gizi makro/mikro, riwayat infeksi, dan rujukan ke dokter spesialis anak.
Di Atas Potensi Genetik (Above Genetic Potential)	$\text{PAH} > \text{TPG}_{\text{Max}}$	Pertumbuhan anak melampaui potensi genetik orang tua. Dapat merupakan variasi positif (nutrisi optimal generasi baru) atau waspada pubertas prekoks / percepatan maturasi tulang.	Evaluasi tanda pubertas dini (tanner staging) dan laju percepatan pertumbuhan.
3.3 Diferensiasi Klinis: Familial Short Stature vs Stunting vs CDGP
                                [ Anak TB/U < -2 SD (Pendek) ]

                                              │

                    ┌─────────────────────────┴─────────────────────────┐

                    ▼                                                   ▼

         [ PAH Sesuai Rentang TPG ]                           [ PAH di Bawah Rentang TPG ]

                    │                                                   │

         ┌──────────┴──────────┐                                        │

         ▼                     ▼                                        ▼

 [ Laju Tumbuh Normal,  [ Laju Tumbuh Normal,             [ Gagal Tumbuh / Growth Faltering,

   Bone Age = Kronologis] Bone Age Terlambat ]              Malnutrisi Kronis (Stunting),

         │                     │                            Endokrinopati / Penyakit Sistemik ]

         ▼                     ▼                                        │

  Familial Short           Constitutional Delay of                      ▼

     Stature             Growth & Puberty (CDGP)                 Investigasi & Rujukan Spesialistik

________________________________________
4. SKEMA DATA & ARSITEKTUR IMPLEMENTASI (JSON / CODE)
4.1 Payload Request & Response API
Request Schema (JSON)
{

  "childId": "CH-2026-0891",

  "gender": "MALE", 

  "birthDate": "2023-05-14",

  "measurementDate": "2026-08-24",

  "currentHeightCm": 94.5,

  "fatherHeightCm": 172.0,

  "motherHeightCm": 158.0

}
Response Schema (JSON)
{

  "status": "SUCCESS",

  "data": {

    "childId": "CH-2026-0891",

    "ageInMonths": 39.3,

    "currentHeightCm": 94.5,

    "currentHeightZScore": -0.85,

    "tpg": {

      "targetHeightCm": 171.5,

      "minTargetHeightCm": 163.0,

      "maxTargetHeightCm": 180.0,

      "formulaUsed": "(fatherHeight + (motherHeight + 13)) / 2"

    },

    "predictedAdultHeightCm": 170.8,

    "assessment": {

      "category": "ON_TRACK",

      "label": "Pertumbuhan Sesuai Potensi Genetik",

      "deviationFromTargetCm": -0.7,

      "clinicalNotes": "Proyeksi tinggi dewasa anak (170.8 cm) berada dalam rentang TPG keluarga (163.0 cm - 180.0 cm)."

    }

  }

}
4.2 TypeScript Implementation Logic
export interface ParentalHeightInput {

  gender: 'MALE' | 'FEMALE';

  fatherHeightCm: number;

  motherHeightCm: number;

  currentHeightCm?: number;

  ageInMonths?: number;

}

export interface TPGCalculationResult {

  targetHeightCm: number;

  minRangeCm: number;

  maxRangeCm: number;

  deviationRangeCm: number;

}

export function calculateTPG(input: ParentalHeightInput): TPGCalculationResult {

  const { gender, fatherHeightCm, motherHeightCm } = input;

  const VARIATION_SD = 8.5; // Batas variasi +- 8.5 cm (IDAI/Tanner)

  let targetHeight: number;

  if (gender === 'MALE') {

    targetHeight = (fatherHeightCm + (motherHeightCm + 13)) / 2;

  } else {

    targetHeight = ((fatherHeightCm - 13) + motherHeightCm) / 2;

  }

  // Pembulatan 1 desimal

  const roundedTarget = Math.round(targetHeight * 10) / 10;

  const minRange = Math.round((targetHeight - VARIATION_SD) * 10) / 10;

  const maxRange = Math.round((targetHeight + VARIATION_SD) * 10) / 10;

  return {

    targetHeightCm: roundedTarget,

    minRangeCm: minRange,

    maxRangeCm: maxRange,

    deviationRangeCm: VARIATION_SD

  };

}

________________________________________
5. SPESIFIKASI VISUALISASI & CHART IMPLEMENTATION
5.1 Desain Visual Kurva Pertumbuhan & TPG Target Band
Visualisasi chart pada SIGMA Ecosystem dirancang berbasis interaksi chart pertumbuhan standar WHO / CDC dengan penambahan TPG Target Zone di ujung sumbu usia dewasa (18–20 tahun).

Tinggi Badan (cm)

200 ┼

    │                                                   ┌─── TPG Max (180 cm)

180 ┼───────────────────────────────────────────────────┼───┐

    │                                     (Proyeksi) ─ ─│ * │ ← Target TPG (171.5 cm)

    │                                 ╭─────────────────┼───┘

160 ┼                             ╭───╯                 └─── TPG Min (163 cm)

    │                         ╭───╯

140 ┼                     ╭───╯

    │                 ╭───╯

120 ┼             ╭───╯  [Data Pengukuran Riwayat Anak]

    │         ╭───╯

100 ┼─────*───╯ (Usia Sekarang: 3 Tahun / 94.5 cm)

    │    *

 80 ┼──*

    │ *

 60 ┼*

    └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴

    0    2    4    6    8   10   12   14   16   18   20  Usia (Tahun)
5.2 Elemen-Elemen Kunci Visualisasi Chart
1.	Sumbu Koordinat:
-	Sumbu X: Usia (Tahun: 0 hingga 20 tahun / Bulan: 0 hingga 240 bulan).
-	Sumbu Y: Tinggi Badan / Panjang Badan (cm: 40 cm hingga 210 cm).
2.	Kurva Standar Latar (WHO / CDC Reference Curves):
-	Garis Persentil / SD: Median (+0 SD / P50), +2 SD (P97), +3 SD, -2 SD (P3), -3 SD.
3.	Data Riwayat Pertumbuhan Anak:
-	Titik-titik scatter (data points) pengukuran aktual beserta garis solid penghubung lintasan riwayat.
4.	Trajectory Projection (Garis Putus-Putus / Dotted Line):
-	Garis proyeksi ekstrapolasi dari Z-score pengukuran terakhir menuju usia 19 tahun.
5.	TPG Target Zone Widget (Usia 18–20 Tahun):
-	Target Area Box: Area persegi panjang / shaded band semi-transparan (warna aksen emerald/blue, opacity 0.2) membentang dari $\text{TPG}{\text{Min}}$ ke $\text{TPG}{\text{Max}}$.
-	Target Indicator Pin: Diamond mark / horizontal line pada nilai $\text{TPG}_{\text{Mean}}$.
-	Interactive Tooltip: Menampilkan informasi detail:
-	Tinggi Ayah & Ibu
-	Nilai TPG Target & Rentang ($\pm 8.5$ cm)
-	Selisih Proyeksi Anak dengan Target Genetik.

________________________________________
6. VALIDASI INPUT & KASUS KHUSUS (EDGE CASES)
1.	Batas Rentang Input Masuk Akal:
-	Tinggi Ayah: Validasi $120\text{ cm} \le \text{TB} \le 220\text{ cm}$.
-	Tinggi Ibu: Validasi $110\text{ cm} \le \text{TB} \le 210\text{ cm}$.
2.	Penanganan Orang Tua Tunggal / Data Tidak Lengkap:
-	Jika salah satu tinggi orang tua tidak diketahui, sistem menampilkan disclaimer bahwa TPG tidak dapat dihitung secara akurat dan beralih ke analisis persentil populasi murni (Z-score TB/U).
3.	Anak Adopsi / Donor Biologis:
-	Sistem menyediakan toggle "Orang Tua Kandung" vs "Orang Tua Asuh" untuk mencegah bias perhitungan genetika.

________________________________________

Dokumen ini disusun untuk implementasi teknis & standarisasi klinis pada SIGMA Ecosystem.

