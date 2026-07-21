import { NextRequest, NextResponse } from "next/server";

// ============================================================
// PKMK Dosing Rule Engine (Tabel 3.2 & 4.1 Standar Pediatric)
// ============================================================
export type PkmkCondition =
  | "Stunting + Gizi Buruk"
  | "Stunting + Gizi Kurang"
  | "Stunting + BB Kurang"
  | "Stunting + BB/TB Normal"
  | "Bukan Stunting";

export interface PkmkDose {
  kondisi: PkmkCondition;
  kaloriHari: number;
  persenRda: number;
  jenisPkmk: string;
  kaleng3Bulan: number;
  proteinEnergyRatio: string;
  isStunting: boolean;
}

export function calcPkmkDose(klas_tbu: string, klas_bbu: string, klas_bbtb: string): PkmkDose {
  const isStunting =
    klas_tbu?.toLowerCase().includes("pendek") ||
    klas_tbu?.toLowerCase().includes("stunting");

  if (!isStunting) {
    return {
      kondisi: "Bukan Stunting",
      kaloriHari: 0,
      persenRda: 0,
      jenisPkmk: "-",
      kaleng3Bulan: 0,
      proteinEnergyRatio: "-",
      isStunting: false,
    };
  }

  const bbuLower = klas_bbu?.toLowerCase() ?? "";
  const bbtbLower = klas_bbtb?.toLowerCase() ?? "";

  // Stunting + Gizi Buruk
  if (bbuLower.includes("buruk") || bbtbLower.includes("buruk")) {
    return {
      kondisi: "Stunting + Gizi Buruk",
      kaloriHari: 600,
      persenRda: 50,
      jenisPkmk: "PKMK 1,5 kkal/ml",
      kaleng3Bulan: 30,
      proteinEnergyRatio: "PER > 10%",
      isStunting: true,
    };
  }

  // Stunting + Gizi Kurang
  if (bbuLower.includes("kurang") && !bbtbLower.includes("kurus")) {
    return {
      kondisi: "Stunting + Gizi Kurang",
      kaloriHari: 450,
      persenRda: 30,
      jenisPkmk: "PKMK 1,5 kkal/ml",
      kaleng3Bulan: 23,
      proteinEnergyRatio: "PER > 10%",
      isStunting: true,
    };
  }

  // Stunting + BB Kurang / Underweight (BB/TB Kurus)
  if (bbtbLower.includes("kurus") || bbuLower.includes("kurang")) {
    return {
      kondisi: "Stunting + BB Kurang",
      kaloriHari: 400,
      persenRda: 30,
      jenisPkmk: "PKMK 1 kkal/ml",
      kaleng3Bulan: 21,
      proteinEnergyRatio: "PER > 10%",
      isStunting: true,
    };
  }

  // Stunting + BB/TB Normal (default stunting)
  return {
    kondisi: "Stunting + BB/TB Normal",
    kaloriHari: 400,
    persenRda: 30,
    jenisPkmk: "PKMK 1 kkal/ml",
    kaleng3Bulan: 21,
    proteinEnergyRatio: "PER > 10%",
    isStunting: true,
  };
}

// ============================================================
// System Prompt — Standar Asuhan Gizi Pediatric
// ============================================================
const SYSTEM_PROMPT = `Kamu adalah AI Nutrition Advisor dalam sistem PKMK Monitoring Dinas Kesehatan Indonesia. 
Kamu ahli dalam asuhan gizi balita stunting berdasarkan standar pediatric Kemenkes RI dan WHO.

REFERENSI DOSIS PKMK (Tabel 3.2 & 4.1 Standar Pediatric):
- Stunting + Gizi Buruk: 600 kkal/hari (50% RDA), PKMK 1,5 kkal/ml PER > 10%, 30 kaleng/3 bulan
- Stunting + Gizi Kurang: 450 kkal/hari (30% RDA), PKMK 1,5 kkal/ml PER > 10%, 23 kaleng/3 bulan
- Stunting + BB Kurang/Underweight: 400 kkal/hari (30% RDA), PKMK 1 kkal/ml PER > 10%, 21 kaleng/3 bulan
- Stunting + BB/TB Normal: 400 kkal/hari (30% RDA), PKMK 1 kkal/ml PER > 10%, 21 kaleng/3 bulan

FORMAT RESPONS: Gunakan format Markdown. Tulis dalam Bahasa Indonesia yang jelas dan profesional untuk tenaga kesehatan.
Bagi respons menjadi 4 bagian dengan heading ## :

## 🔍 Analisis Kondisi Gizi
Jelaskan kondisi klinis anak berdasarkan data Z-Score dan Probable Stunting. Interpretasikan nilai Weight Age, Length Age, dan Chronological Age secara klinis.

## 💊 Rekomendasi PKMK & Dosis
Sebutkan dosis PKMK yang direkomendasikan berdasarkan kondisi. Jelaskan cara pemberian, waktu, dan durasi. Sertakan catatan khusus jika ada.

## 🥗 Kebutuhan Kalori, Protein & MPASI
Rinci kebutuhan kalori dan protein harian. Berikan panduan MPASI pendamping yang sesuai usia dan kondisi. Sebutkan jenis makanan yang dianjurkan dan dihindari.

## 📅 Rencana Tindak Lanjut
Jadwal pemantauan pertumbuhan, target kenaikan BB yang diharapkan, tanda bahaya yang perlu diwaspadai, dan kapan harus dirujuk ke SpA.

PENTING: 
- Jangan melampaui rekomendasi tabel dosis resmi
- Selalu sebutkan angka spesifik (kalori, protein, gram)
- Berikan rekomendasi yang actionable dan praktis
- Maksimal 400 kata total`;

// ============================================================
// POST /api/ai/nutrition-advisor
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      namaBalita,
      usiaBulan,
      jk,
      bbKg,
      tbCm,
      zsBbu,
      klasBbu,
      zsTbu,
      klasTbu,
      zsBbtb,
      klasBbtb,
      deltaKg,
      probableStunting,
      weightAge,
      lengthAge,
      bbIdeal,
      kondisiKlinis,
      pkmkDose,
      lilaCm,
    } = body;

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const aiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash-001";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${response.status}`;
      const status = response.status === 429 ? 429 : 500;
      const friendlyMsg = status === 429
        ? "Kuota AI sementara habis (rate limit). Coba beberapa saat lagi."
        : `Gagal menghubungi Gemini API: ${errMsg}`;
      return NextResponse.json({ error: friendlyMsg }, { status });
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ recommendation: text, kondisiKlinis, pkmkDose });
  } catch (err: any) {
    console.error("AI Nutrition Advisor error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal menghubungi AI Advisor" },
      { status: 500 }
    );
  }
}
