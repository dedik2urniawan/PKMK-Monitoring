"use server";

export async function getAiNutritionAdvice(payload: {
  namaBalita: string;
  usiaBulan: number;
  jk: string;
  bbKg: number;
  tbCm: number;
  lilaCm?: number;
  bbIdeal?: string;
  deltaKg?: number;
  zsBbu?: number | null;
  zsTbu?: number | null;
  zsBbtb?: number | null;
  klasBbu?: string;
  klasTbu?: string;
  klasBbtb?: string;
  weightAge?: number | null;
  lengthAge?: number | null;
  probableStunting?: boolean | null;
  kondisiKlinis: string;
  pkmkDose: any;
}) {
  try {
    const {
      namaBalita, usiaBulan, jk, bbKg, tbCm, lilaCm, bbIdeal, deltaKg,
      zsBbu, zsTbu, zsBbtb, klasBbu, klasTbu, klasBbtb,
      weightAge, lengthAge, probableStunting, kondisiKlinis, pkmkDose
    } = payload;

    const genderLabel = jk === "L" ? "Laki-laki" : "Perempuan";
    const psStatus = probableStunting === true ? "YA (Probable Stunting Terdeteksi)" : probableStunting === false ? "TIDAK" : "Data kurang";

    const userPrompt = `Analisis data klinis balita berikut dan berikan rekomendasi asuhan gizi yang komprehensif:

**IDENTITAS BALITA**
- Nama: ${namaBalita}
- Usia: ${usiaBulan} bulan
- Jenis Kelamin: ${genderLabel}

**DATA ANTROPOMETRI**
- Berat Badan: ${bbKg} kg (BB Ideal: ${bbIdeal ?? "-"} kg)
- Tinggi Badan: ${tbCm} cm
- LILA: ${lilaCm ?? "-"} cm
- Kenaikan BB (ΔBB): ${deltaKg != null ? `${deltaKg > 0 ? "+" : ""}${(deltaKg * 1000).toFixed(0)} gr` : "-"}

**Z-SCORE & KLASIFIKASI**
- ZS BB/U: ${zsBbu != null ? Number(zsBbu).toFixed(2) + " SD" : "-"} → ${klasBbu || "-"}
- ZS TB/U: ${zsTbu != null ? Number(zsTbu).toFixed(2) + " SD" : "-"} → ${klasTbu || "-"}
- ZS BB/TB: ${zsBbtb != null ? Number(zsBbtb).toFixed(2) + " SD" : "-"} → ${klasBbtb || "-"}

**ANALISIS PROBABLE STUNTING**
- Status: ${psStatus}
- Weight Age (WA): ${weightAge ?? "-"} bulan
- Length Age (LA): ${lengthAge ?? "-"} bulan
- Chronological Age (CA): ${usiaBulan} bulan

**KONDISI KLINIS TERDETEKSI**: ${kondisiKlinis}
**REKOMENDASI PKMK (Tabel Standar)**: 
- Kalori/Hari: ${pkmkDose?.kaloriHari ?? "-"} kkal (${pkmkDose?.persenRda ?? "-"}% RDA)
- Jenis PKMK: ${pkmkDose?.jenisPkmk ?? "-"} | ${pkmkDose?.proteinEnergyRatio ?? "-"}
- Kebutuhan 3 Bulan: ${pkmkDose?.kaleng3Bulan ?? "-"} kaleng/kotak (400 gram)

Berikan analisis dan rekomendasi asuhan gizi yang menyeluruh dan actionable.`;

    const SYSTEM_PROMPT = `Kamu adalah SIGMA Ai Advisor, seorang Dokter Spesialis Anak & Clinical Pediatric Dietitian.
Kamu ahli dalam asuhan gizi balita stunting berdasarkan standar pediatric Kemenkes RI dan WHO.

REFERENSI DOSIS PKMK (Tabel 3.2 & 4.1 Standar Pediatric):
- Stunting + Gizi Buruk: 600 kkal/hari (50% RDA), PKMK 1,5 kkal/ml PER > 10%, 30 kaleng/3 bulan
- Stunting + Gizi Kurang: 450 kkal/hari (30% RDA), PKMK 1,5 kkal/ml PER > 10%, 23 kaleng/3 bulan
- Stunting + BB Kurang/Underweight: 400 kkal/hari (30% RDA), PKMK 1 kkal/ml PER > 10%, 21 kaleng/3 bulan
- Stunting + BB/TB Normal: 400 kkal/hari (30% RDA), PKMK 1 kkal/ml PER > 10%, 21 kaleng/3 bulan

FORMAT RESPONS: Gunakan format Markdown. Tulis dalam Bahasa Indonesia yang jelas dan profesional untuk tenaga kesehatan.
Bagi respons menjadi 4 bagian dengan heading ## :
1. ## Asesmen Medis Ringkas (Interpretasi Z-Score & Pertumbuhan)
2. ## Analisis Kebutuhan Nutrisi (Koreksi berat badan, kalori, dan protein)
3. ## Instruksi Pemberian PKMK (Frekuensi, takaran, dan cara penyajian)
4. ## Red Flags / Tanda Bahaya (Kapan harus dirujuk ke RS / indikasi rawat inap)

DISCLAIMER MEDIS:
Di bagian paling bawah, tambahkan teks miring berikut persis seperti ini:
*⚠️ **Disclaimer Medis:** Analisis ini dihasilkan oleh AI (SIGMA Ai Advisor) berdasarkan pedoman standar. Keputusan medis, dosis final, dan tata laksana klinis **wajib** diverifikasi oleh Dokter Spesialis Anak atau Ahli Gizi Terdaftar yang memeriksa kondisi klinis pasien secara langsung.*`;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      const keys = Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE')).join(', ');
      return { success: false, error: `API Key belum dikonfigurasi. Vercel Env: [${keys}]. Pastikan NEXT_PUBLIC_GEMINI_API_KEY sudah disimpan dan Redeploy TANPA cache.` };
    }

    const aiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${response.status}`;
      const friendlyMsg = response.status === 429 ? `Kuota AI habis. Detail: ${errMsg}` : `Gagal menghubungi Gemini API: ${errMsg}`;
      return { success: false, error: friendlyMsg };
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return { success: true, data: text, kondisiKlinis, pkmkDose };
  } catch (err: any) {
    console.error("AI Nutrition Advisor error:", err);
    return { success: false, error: err?.message || "Gagal menghubungi AI Advisor" };
  }
}

export async function getAiDischargeSummary(payload: {
  namaBalita: string;
  nik?: string;
  desa?: string;
  cycleNum: number;
  antroCount: number;
  konsumsiCount: number;
  pemberianCount: number;
}) {
  try {
    const { namaBalita, nik, desa, cycleNum, antroCount, konsumsiCount, pemberianCount } = payload;

    const userPrompt = `Analisis hasil evaluasi penyelesaian intervensi PKMK untuk balita berikut:

**IDENTITAS BALITA**
- Nama: ${namaBalita}
- NIK: ${nik || "-"}
- Desa/Kel: ${desa || "-"}
- Siklus Pemberian: Siklus ${cycleNum} (12 Minggu)

**KEPATUHAN PEMANTAUAN**
- Antropometri terpantau: ${antroCount} dari 12 minggu
- Konsumsi PKMK terpantau: ${konsumsiCount} dari 12 minggu
- Pemberian PKMK terpantau: ${pemberianCount} dari 12 minggu

Berikan Rangkuman Evaluasi Klinis Selesai Intervensi PKMK yang profesional, ringkas (2-3 paragraf padat) untuk tenaga kesehatan Puskesmas. Sertakan evaluasi trajektori pertumbuhan dan rekomendasi apakah perlu Lanjut Siklus ${cycleNum + 1} atau Edukasi PMT Lokal.`;

    const SYSTEM_PROMPT = `Kamu adalah SIGMA Ai Advisor, Dokter Spesialis Anak & Konsultan Nutrisi Klinis Kemenkes RI.
Berikan Rangkuman Evaluasi Klinis Selesai Intervensi PKMK yang ringkas, ilmiah, dan actionable.`;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "API Key Gemini belum diset pada environment Vercel." };
    }

    const aiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return { success: false, error: errBody?.error?.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return { success: true, data: text };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menghubungi AI Advisor" };
  }
}
