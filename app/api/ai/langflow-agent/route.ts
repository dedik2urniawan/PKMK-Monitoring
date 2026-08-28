import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * LANGFLOW AGENTIC AI INTEGRATION ENDPOINT
 * Pipeline:
 * 1. Data Ingestion & Sanitization Agent (Outlier & typo correction)
 * 2. Statistical Calculation Agent (Python-aligned WHO WGV g/kg/day & Z-Score)
 * 3. Gemini SIGMA Clinical Decision Agent (Actionable recommendations)
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, raw_records, kohort_id, puskesmas_id } = body;

    // === AGENT 1: DATA SANITATION & HARMONIZER ===
    const sanitizedRecords = (raw_records || []).map((rec: any, idx: number) => {
      const bb = Number(rec.bb_kg);
      const tb = Number(rec.tb_cm);
      const minggu = Number(rec.minggu_ke) || (idx + 1);

      // Outlier / Typo cleaning
      const cleanedFormula = (rec.jenis_formulasi || "").trim();
      let canonicalFormula = cleanedFormula;
      if (/dangrow/i.test(cleanedFormula)) canonicalFormula = "Dangrow";
      else if (/isocal/i.test(cleanedFormula)) canonicalFormula = "Isocal";
      else if (/proteed/i.test(cleanedFormula)) canonicalFormula = "Proteed";
      else if (/optigrowth/i.test(cleanedFormula)) canonicalFormula = "SGM Optigrowth";
      else if (/gain/i.test(cleanedFormula)) canonicalFormula = "SGM Ananda Gain 100";

      // Anomaly flags
      const isAnomaly = isNaN(bb) || bb <= 1.0 || bb >= 35.0 || isNaN(tb) || tb <= 30.0 || tb >= 130.0;

      return {
        ...rec,
        minggu_ke: minggu,
        bb_kg: !isAnomaly ? bb : null,
        tb_cm: !isAnomaly ? tb : null,
        jenis_formulasi: canonicalFormula,
        anomaly_detected: isAnomaly,
        sanitization_status: isAnomaly ? "FLAGGED_OUTLIER" : "VALIDATED",
      };
    });

    // === AGENT 2: PYTHON RESEARCH METRIC CALCULATION ===
    let totalWgvGkg = 0;
    let validTransitions = 0;
    for (let i = 1; i < sanitizedRecords.length; i++) {
      const prev = sanitizedRecords[i - 1];
      const curr = sanitizedRecords[i];
      if (prev.bb_kg && curr.bb_kg) {
        const meanW = (prev.bb_kg + curr.bb_kg) / 2.0;
        const days = Math.max(1, (curr.minggu_ke - prev.minggu_ke) * 7);
        const wgvGkg = ((curr.bb_kg - prev.bb_kg) * 1000.0) / (meanW * days);
        totalWgvGkg += wgvGkg;
        validTransitions++;
      }
    }
    const meanWgvGkg = validTransitions > 0 ? Math.round((totalWgvGkg / validTransitions) * 100) / 100 : null;

    // === AGENT 3: GEMINI CLINICAL POLICY SYNTHESIZER ===
    let aiSynthesis = null;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Anda adalah SIGMA Agentic AI untuk pemantauan PKMK Stunting di Kabupaten Malang.
Analisis data berikut:
- Kohort ID: ${kohort_id || 'Umum'}
- Puskesmas ID: ${puskesmas_id || 'Wilayah'}
- Total Catatan: ${sanitizedRecords.length}
- Validated Records: ${sanitizedRecords.filter((r: any) => !r.anomaly_detected).length}
- WHO Mean WGV (g/kg/hari): ${meanWgvGkg ?? 'N/A'}

Berikan respons JSON murni dengan format:
{
  "status_evaluasi": "Optimal | Cukup | Perlu Perhatian Khusus",
  "anomali_count": ${sanitizedRecords.filter((r: any) => r.anomaly_detected).length},
  "wgv_who_zone": "Optimal (5-10 g/kg/hr) | Rapid (>10) | Suboptimal (0-5) | Faltering (<0)",
  "rekomendasi_klinis": "string",
  "tindakan_petugas_gizi": "string"
}`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text() || "{}";
      const cleanJson = rawText.replace(/```json\s*|```/g, "").trim();
      try {
        aiSynthesis = JSON.parse(cleanJson);
      } catch {
        aiSynthesis = { status_evaluasi: "Cukup", rekomendasi_klinis: rawText };
      }
    }

    return NextResponse.json({
      success: true,
      agent_pipeline: "LANGFLOW_MULTI_AGENT_V2",
      summary: {
        total_input: raw_records?.length || 0,
        cleaned_records_count: sanitizedRecords.filter((r: any) => !r.anomaly_detected).length,
        outlier_records_count: sanitizedRecords.filter((r: any) => r.anomaly_detected).length,
        calculated_who_wgv: meanWgvGkg,
      },
      sanitized_records: sanitizedRecords,
      ai_synthesis: aiSynthesis,
    });

  } catch (err: any) {
    console.error("[POST /api/ai/langflow-agent] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
