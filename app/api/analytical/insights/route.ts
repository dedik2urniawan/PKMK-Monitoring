import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createAdminClient } from "@/lib/supabase/server";

import { getAppUser } from "@/lib/appUser";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();

  try {
    const appUser = await getAppUser();
    const isAdminPuskesmas = appUser?.role === 'admin_puskesmas' && !!appUser.puskesmas_id;
    const userPuskesmasId = isAdminPuskesmas ? appUser.puskesmas_id : null;

    // Fetch Puskesmas Name if admin_puskesmas
    let puskesmasName: string | null = null;
    if (userPuskesmasId) {
      const { data: pkmData } = await supabase
        .from("ref_puskesmas")
        .select("nama")
        .eq("id", userPuskesmasId)
        .single();
      puskesmasName = pkmData?.nama || null;
    }

    // === 1. Fetch Balita (scoped by Puskesmas if admin_puskesmas) ===
    let balitaQuery = supabase
      .from("balita")
      .select("id, jk, tb_ayah_cm, tb_ibu_cm, bb_lahir_kg, tb_lahir_cm, redflag_any, bb_tidak_adekuat, ispa_cystitis, muntah_diare_berulang, delayed_development, murmur_edema, organomegali_limfadenopati, wajah_dismorfik, puskesmas_id");

    if (userPuskesmasId) {
      balitaQuery = balitaQuery.eq("puskesmas_id", userPuskesmasId);
    }

    const { data: balitaRaw } = await balitaQuery.limit(2000);

    // === 2. Fetch Kohort (scoped by Puskesmas if admin_puskesmas) ===
    let kohortQuery = supabase
      .from("kohort")
      .select("id, balita_id, puskesmas_id");

    if (userPuskesmasId) {
      kohortQuery = kohortQuery.eq("puskesmas_id", userPuskesmasId);
    }

    const { data: kohortRaw } = await kohortQuery.limit(2000);

    const kohortToBalita = new Map<string, string>();
    (kohortRaw || []).forEach((k) => kohortToBalita.set(k.id, k.balita_id));
    const allowedKohortIds = new Set((kohortRaw || []).map((k) => k.id));
    const allowedBalitaIds = new Set((balitaRaw || []).map((b) => b.id));

    // === 3. Fetch Monitoring Antropometri ===
    let antroQuery = supabase
      .from("monitoring_antropometri")
      .select("id, kohort_id, minggu_ke, tanggal, bb_kg, tb_cm, zs_tbu, zs_bbu, zs_bbtb, lila_cm, delta_bb_kg, klas_tbu, klas_bbu, usia_bulan, redflag_any, ispa_cystitis, muntah_diare_berulang, delayed_development")
      .order("minggu_ke", { ascending: true });

    if (userPuskesmasId && allowedKohortIds.size > 0) {
      antroQuery = antroQuery.in("kohort_id", Array.from(allowedKohortIds));
    }

    const { data: antroRawInitial } = await antroQuery.limit(5000);
    const antroRaw = userPuskesmasId 
      ? (antroRawInitial || []).filter(a => allowedKohortIds.has(a.kohort_id))
      : antroRawInitial;

    // === 4. Fetch SDIDTK assessments ===
    const { data: sdidtkRawInitial } = await supabase
      .from("sdidtk_assessments")
      .select("id, balita_id, kpsp_status, kpsp_yes_count, kpsp_failed_sectors, tdd_status, clinical_action, referral_required")
      .limit(500);

    const sdidtkRaw = userPuskesmasId
      ? (sdidtkRawInitial || []).filter(s => allowedBalitaIds.has(s.balita_id))
      : sdidtkRawInitial;

    // === BUILD MAP: balita_id → sex & red flags ===
    const balitaMap = new Map<string, any>();
    (balitaRaw || []).forEach((b) => balitaMap.set(b.id, b));


    // === ANALYSIS 1: Weekly Z-Score Trajectory (minggu_ke 1–12) ===
    const weeklyBuckets: Record<number, { zs_tbu_sum: number; count: number; delta_bb_sum: number; delta_count: number }> = {};
    for (let w = 1; w <= 12; w++) {
      weeklyBuckets[w] = { zs_tbu_sum: 0, count: 0, delta_bb_sum: 0, delta_count: 0 };
    }

    (antroRaw || []).forEach((a) => {
      const week = Number(a.minggu_ke);
      if (week >= 1 && week <= 12 && a.zs_tbu != null) {
        weeklyBuckets[week].zs_tbu_sum += Number(a.zs_tbu);
        weeklyBuckets[week].count += 1;
      }
      if (week >= 1 && week <= 12 && a.delta_bb_kg != null) {
        weeklyBuckets[week].delta_bb_sum += Number(a.delta_bb_kg) * 1000; // convert to grams
        weeklyBuckets[week].delta_count += 1;
      }
    });

    const trajectoryData = Object.entries(weeklyBuckets)
      .filter(([, v]) => v.count > 0)
      .map(([week, v]) => ({
        week: `W${week}`,
        minggu_ke: Number(week),
        zscore_mean: v.count > 0 ? Math.round((v.zs_tbu_sum / v.count) * 100) / 100 : null,
        zscore_count: v.count,
        target_tbu: -2.0,
        velocity_mean: v.delta_count > 0 ? Math.round(v.delta_bb_sum / v.delta_count / 7) : null, // g/day
      }));

    // === ANALYSIS 2: Z-Score Distribution (HAZ TB/U) ===
    const zBuckets = {
      severe: 0,   // < -3 SD
      stunted: 0,  // -3 to -2 SD
      mild: 0,     // -2 to -1 SD
      ontrack: 0,  // -1 to +1 SD
      above: 0,    // > +1 SD
    };

    const latestByKohort = new Map<string, any>();
    (antroRaw || []).forEach((a) => {
      // Use first entry per kohort (latest because ordered by minggu_ke asc... but we want latest)
      const existing = latestByKohort.get(a.kohort_id);
      if (!existing || Number(a.minggu_ke) > Number(existing.minggu_ke)) {
        latestByKohort.set(a.kohort_id, a);
      }
    });

    latestByKohort.forEach((a) => {
      const z = Number(a.zs_tbu);
      if (isNaN(z)) return;
      if (z < -3.0) zBuckets.severe++;
      else if (z < -2.0) zBuckets.stunted++;
      else if (z < -1.0) zBuckets.mild++;
      else if (z <= 1.0) zBuckets.ontrack++;
      else zBuckets.above++;
    });

    const distributionData = [
      { range: '< -3.0 SD', label: 'Sangat Pendek', count: zBuckets.severe, category: 'Severe Stunting', color: '#dc2626' },
      { range: '-3.0 s/d -2.0 SD', label: 'Pendek', count: zBuckets.stunted, category: 'Stunted', color: '#f97316' },
      { range: '-2.0 s/d -1.0 SD', label: 'Borderline', count: zBuckets.mild, category: 'Borderline', color: '#eab308' },
      { range: '-1.0 s/d +1.0 SD', label: 'Normal', count: zBuckets.ontrack, category: 'On-Track TPG', color: '#22c55e' },
      { range: '> +1.0 SD', label: 'Di Atas Normal', count: zBuckets.above, category: 'Above Normal', color: '#3b82f6' },
    ];

    // === ANALYSIS 3: Red Flag Multi-Factorial Impact ===
    // NOTE: All 7 flag fields must match columns in balita table.
    // redflag_any = true is triggered by ANY of: bb_tidak_adekuat, ispa_cystitis, muntah_diare_berulang,
    //   delayed_development, murmur_edema, organomegali_limfadenopati, wajah_dismorfik
    const redFlagStats: Record<string, { cases: number; zscores: number[]; deltaBbs: number[] }> = {
      'BB Tidak Adekuat': { cases: 0, zscores: [], deltaBbs: [] },
      'ISPA / Cystitis': { cases: 0, zscores: [], deltaBbs: [] },
      'Delayed Development': { cases: 0, zscores: [], deltaBbs: [] },
      'Diare / Muntah Berulang': { cases: 0, zscores: [], deltaBbs: [] },
      'Wajah Dismorfik': { cases: 0, zscores: [], deltaBbs: [] },
      'Murmur / Edema': { cases: 0, zscores: [], deltaBbs: [] },
      'Organomegali / Limfadenopati': { cases: 0, zscores: [], deltaBbs: [] },
      'Tanpa Red Flag (Nutrisional)': { cases: 0, zscores: [], deltaBbs: [] },
    };

    let totalRedFlagCount = 0; // track for scorecard reconciliation

    (balitaRaw || []).forEach((b) => {
      const kohortIds = (kohortRaw || []).filter((k) => k.balita_id === b.id).map((k) => k.id);
      const antros = (antroRaw || []).filter((a) => kohortIds.includes(a.kohort_id));
      const zsArr = antros.map((a) => Number(a.zs_tbu)).filter((z) => !isNaN(z));
      const deltaArr = antros.filter((a) => a.delta_bb_kg != null && Number(a.delta_bb_kg) > 0)
        .map((a) => Number(a.delta_bb_kg) * 1000 / 7);
      const meanZ = zsArr.length > 0 ? zsArr.reduce((a, c) => a + c, 0) / zsArr.length : 0;
      const meanDelta = deltaArr.length > 0 ? deltaArr.reduce((a, c) => a + c, 0) / deltaArr.length : 0;

      // Check each flag — a balita can contribute to multiple categories
      let hasAnyFlag = false;

      if (b.bb_tidak_adekuat === 'ya') {
        redFlagStats['BB Tidak Adekuat'].cases++;
        redFlagStats['BB Tidak Adekuat'].zscores.push(meanZ);
        redFlagStats['BB Tidak Adekuat'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }
      if (b.ispa_cystitis === 'ya') {
        redFlagStats['ISPA / Cystitis'].cases++;
        redFlagStats['ISPA / Cystitis'].zscores.push(meanZ);
        redFlagStats['ISPA / Cystitis'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }
      if (b.delayed_development === 'ya') {
        redFlagStats['Delayed Development'].cases++;
        redFlagStats['Delayed Development'].zscores.push(meanZ);
        redFlagStats['Delayed Development'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }
      if (b.muntah_diare_berulang === 'ya') {
        redFlagStats['Diare / Muntah Berulang'].cases++;
        redFlagStats['Diare / Muntah Berulang'].zscores.push(meanZ);
        redFlagStats['Diare / Muntah Berulang'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }
      if (b.wajah_dismorfik === 'ya') {
        redFlagStats['Wajah Dismorfik'].cases++;
        redFlagStats['Wajah Dismorfik'].zscores.push(meanZ);
        redFlagStats['Wajah Dismorfik'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }
      if (b.murmur_edema === 'ya') {
        redFlagStats['Murmur / Edema'].cases++;
        redFlagStats['Murmur / Edema'].zscores.push(meanZ);
        redFlagStats['Murmur / Edema'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }
      if (b.organomegali_limfadenopati === 'ya') {
        redFlagStats['Organomegali / Limfadenopati'].cases++;
        redFlagStats['Organomegali / Limfadenopati'].zscores.push(meanZ);
        redFlagStats['Organomegali / Limfadenopati'].deltaBbs.push(meanDelta);
        hasAnyFlag = true;
      }

      if (hasAnyFlag) {
        totalRedFlagCount++;
      } else {
        redFlagStats['Tanpa Red Flag (Nutrisional)'].cases++;
        redFlagStats['Tanpa Red Flag (Nutrisional)'].zscores.push(meanZ);
        redFlagStats['Tanpa Red Flag (Nutrisional)'].deltaBbs.push(meanDelta);
      }
    });

    const redFlagMatrix = Object.entries(redFlagStats)
      .filter(([, v]) => v.cases > 0)
      .map(([factor, v]) => {
        const meanZ = v.zscores.length > 0 ? v.zscores.reduce((a, c) => a + c, 0) / v.zscores.length : 0;
        const meanVelocity = v.deltaBbs.length > 0 ? v.deltaBbs.reduce((a, c) => a + c, 0) / v.deltaBbs.length : 0;
        const riskLevel = factor.includes('Organomegali') ? 'Critical'
          : factor.includes('Murmur') ? 'Critical'
          : factor.includes('Wajah') ? 'Critical'
          : factor.includes('Diare') ? 'High'
          : factor.includes('ISPA') ? 'High'
          : factor.includes('Delayed') ? 'Medium'
          : factor.includes('BB Tidak') ? 'Medium'
          : 'Low';
        return {
          factor,
          cases: v.cases,
          avg_zscore_tbu: Math.round(meanZ * 100) / 100,
          avg_velocity_gday: meanVelocity > 0 ? `+${Math.round(meanVelocity)} g/hari` : `${Math.round(meanVelocity)} g/hari`,
          velocity_raw: Math.round(meanVelocity),
          risk_level: riskLevel,
        };
      })
      .sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return (order[a.risk_level as keyof typeof order] || 3) - (order[b.risk_level as keyof typeof order] || 3);
      });


    // === ANALYSIS 4: Sex-Stratified Growth Analysis ===
    const sexBuckets = {
      L: { zs_tbu: [] as number[], count: 0 },
      P: { zs_tbu: [] as number[], count: 0 },
    };

    latestByKohort.forEach((a) => {
      const balitaId = kohortToBalita.get(a.kohort_id);
      if (!balitaId) return;
      const balita = balitaMap.get(balitaId);
      if (!balita || a.zs_tbu == null) return;
      const sex = balita.jk as 'L' | 'P';
      if (sex === 'L' || sex === 'P') {
        sexBuckets[sex].zs_tbu.push(Number(a.zs_tbu));
        sexBuckets[sex].count++;
      }
    });

    const sexAnalysis = ['L', 'P'].map((sex) => {
      const arr = sexBuckets[sex as 'L' | 'P'].zs_tbu;
      const mean = arr.length > 0 ? arr.reduce((a, c) => a + c, 0) / arr.length : 0;
      const severe = arr.filter((z) => z < -3.0).length;
      const stunted = arr.filter((z) => z >= -3.0 && z < -2.0).length;
      const normal = arr.filter((z) => z >= -2.0).length;
      return {
        label: sex === 'L' ? 'Laki-laki' : 'Perempuan',
        sex,
        count: arr.length,
        mean_zscore: Math.round(mean * 100) / 100,
        severe_count: severe,
        stunted_count: stunted,
        normal_count: normal,
        severe_pct: arr.length > 0 ? Math.round((severe / arr.length) * 100) : 0,
        stunted_pct: arr.length > 0 ? Math.round((stunted / arr.length) * 100) : 0,
      };
    });

    // === ANALYSIS 5: Age Cohort Z-Score (SDIDTK-aligned brackets) ===
    const ageBrackets: Record<string, number[]> = {
      '0-5 Bln': [],
      '6-11 Bln': [],
      '12-17 Bln': [],
      '18-23 Bln': [],
      '24-35 Bln': [],
      '36-59 Bln': [],
    };

    latestByKohort.forEach((a) => {
      const usia = Number(a.usia_bulan);
      const z = Number(a.zs_tbu);
      if (isNaN(usia) || isNaN(z)) return;
      if (usia < 6) ageBrackets['0-5 Bln'].push(z);
      else if (usia < 12) ageBrackets['6-11 Bln'].push(z);
      else if (usia < 18) ageBrackets['12-17 Bln'].push(z);
      else if (usia < 24) ageBrackets['18-23 Bln'].push(z);
      else if (usia < 36) ageBrackets['24-35 Bln'].push(z);
      else ageBrackets['36-59 Bln'].push(z);
    });

    const ageCohortData = Object.entries(ageBrackets)
      .filter(([, arr]) => arr.length > 0)
      .map(([bracket, arr]) => ({
        usia_group: bracket,
        count: arr.length,
        mean_zscore: Math.round((arr.reduce((a, c) => a + c, 0) / arr.length) * 100) / 100,
        severe_pct: Math.round((arr.filter((z) => z < -3.0).length / arr.length) * 100),
        stunted_pct: Math.round((arr.filter((z) => z >= -3.0 && z < -2.0).length / arr.length) * 100),
        normal_pct: Math.round((arr.filter((z) => z >= -2.0).length / arr.length) * 100),
      }));

    // === ANALYSIS 6: SDIDTK Summary ===
    const sdidtkSummary = {
      total: sdidtkRaw?.length || 0,
      sesuai: (sdidtkRaw || []).filter((s) => s.kpsp_status === 'SESUAI_UMUR').length,
      meragukan: (sdidtkRaw || []).filter((s) => s.kpsp_status === 'MERAGUKAN').length,
      penyimpangan: (sdidtkRaw || []).filter((s) => s.kpsp_status === 'PENYIMPANGAN').length,
      referral_needed: (sdidtkRaw || []).filter((s) => s.referral_required).length,
    };

    // === SUMMARY METRICS ===
    const allZ = [...latestByKohort.values()].map((a) => Number(a.zs_tbu)).filter((z) => !isNaN(z));
    const meanZ = allZ.length > 0 ? allZ.reduce((a, c) => a + c, 0) / allZ.length : 0;

    // Velocity: only positive delta (weight gain episodes)
    const positiveVelocities = (antroRaw || [])
      .filter((a) => a.delta_bb_kg != null && Number(a.delta_bb_kg) > 0 && Number(a.minggu_ke) <= 12)
      .map((a) => Number(a.delta_bb_kg) * 1000 / 7); // convert kg/week to g/day
    const meanVelocity = positiveVelocities.length > 0 
      ? positiveVelocities.reduce((a, c) => a + c, 0) / positiveVelocities.length 
      : 0;


    // TPG: count balita with both parent heights
    const tpgAvailable = (balitaRaw || []).filter((b) => b.tb_ayah_cm != null && b.tb_ibu_cm != null).length;
    const dischargeMinggu = 10.4; // based on data: most balita have 1 monitoring record (minggu 1)

    return NextResponse.json({
      role: appUser?.role || 'superadmin',
      puskesmasId: userPuskesmasId,
      puskesmasName,
      summary: {
        totalMonitoringRecords: antroRaw?.length || 0,
        totalBalita: balitaRaw?.length || 0,
        meanZScoreTbu: Math.round(meanZ * 100) / 100,
        meanWeightVelocityGDay: Math.round(meanVelocity * 10) / 10,
        tpgDataAvailable: tpgAvailable,
        sdidtkTotal: sdidtkSummary.total,
        redFlagCases: totalRedFlagCount, // balita dengan minimal 1 flag spesifik (konsisten dengan matrix)
        noRedFlagCases: redFlagStats['Tanpa Red Flag (Nutrisional)'].cases,
      },

      trajectoryData,
      distributionData,
      redFlagMatrix,
      sexAnalysis,
      ageCohortData,
      sdidtkSummary,
    });

  } catch (err: any) {

    console.error("[GET /api/analytical/insights] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
