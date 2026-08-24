import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: balitaId } = await params;
  if (!balitaId) {
    return NextResponse.json({ error: "Balita ID diperlukan" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Fetch Balita Profile
    const { data: balita, error: balitaErr } = await supabase
      .from("balita")
      .select("*")
      .eq("id", balitaId)
      .single();

    if (balitaErr || !balita) {
      return NextResponse.json({ error: "Data balita tidak ditemukan" }, { status: 404 });
    }

    // 2. Fetch Puskesmas Info
    let puskesmasName = "Puskesmas Kabupaten Malang";
    if (balita.puskesmas_id) {
      const { data: pkm } = await supabase
        .from("ref_puskesmas")
        .select("nama")
        .eq("id", balita.puskesmas_id)
        .single();
      if (pkm?.nama) puskesmasName = pkm.nama;
    }

    // 3. Fetch Kohort Records
    const { data: kohortList } = await supabase
      .from("kohort")
      .select("id, status, periode_mulai, periode_selesai, catatan")
      .eq("balita_id", balitaId)
      .order("periode_mulai", { ascending: true });

    const kohortIds = (kohortList || []).map((k) => k.id);

    // Fetch Monitoring Antropometri
    let allAntro: any[] = [];
    let allKonsumsi: any[] = [];
    let allPemberian: any[] = [];

    if (kohortIds.length > 0) {
      const { data: antroData } = await supabase
        .from("monitoring_antropometri")
        .select("id, kohort_id, minggu_ke, tanggal, usia_bulan, bb_kg, tb_cm, lila_cm, zs_bbu, zs_tbu, zs_bbtb, klas_bbu, klas_tbu, klas_bbtb, delta_bb_kg, redflag_any, ispa_cystitis, muntah_diare_berulang")
        .in("kohort_id", kohortIds)
        .order("minggu_ke", { ascending: true });

      const { data: konsumsiData } = await supabase
        .from("monitoring_pkmk_konsumsi")
        .select("id, kohort_id, minggu_ke, tanggal, porsi_habis_pct, efek_samping, catatan")
        .in("kohort_id", kohortIds)
        .order("minggu_ke", { ascending: true });

      const { data: pemberianData } = await supabase
        .from("monitoring_pkmk_pemberian")
        .select("id, kohort_id, minggu_ke, tanggal, jenis_pkmk, jumlah_diberikan, tanggal_expired, catatan")
        .in("kohort_id", kohortIds)
        .order("minggu_ke", { ascending: true });

      allAntro = antroData || [];
      allKonsumsi = konsumsiData || [];
      allPemberian = pemberianData || [];
    }

    // 4. Fetch SDIDTK Assessment
    const { data: sdidtkList } = await supabase
      .from("sdidtk_assessments")
      .select("*")
      .eq("balita_id", balitaId)
      .order("assessment_date", { ascending: false });


    const latestAntro = allAntro.length > 0 ? allAntro[allAntro.length - 1] : null;
    const initialAntro = allAntro.length > 0 ? allAntro[0] : null;

    // Calculate TPG if parent heights exist
    let tpgAnalysis = null;
    if (balita.tb_ayah_cm && balita.tb_ibu_cm) {
      const isMale = balita.jk === "L";
      const tpgMid = isMale
        ? (Number(balita.tb_ayah_cm) + Number(balita.tb_ibu_cm) + 13) / 2
        : (Number(balita.tb_ayah_cm) + Number(balita.tb_ibu_cm) - 13) / 2;
      tpgAnalysis = {
        tpgMid: Math.round(tpgMid * 10) / 10,
        tpgMin: Math.round((tpgMid - 8.5) * 10) / 10,
        tpgMax: Math.round((tpgMid + 8.5) * 10) / 10,
        ayah_cm: balita.tb_ayah_cm,
        ibu_cm: balita.tb_ibu_cm,
      };
    }

    return NextResponse.json({
      success: true,
      balita: {
        id: balita.id,
        nama_balita: balita.nama_balita,
        nik: balita.nik,
        jk: balita.jk,
        tgl_lahir: balita.tgl_lahir,
        nama_ortu: balita.nama_ortu,
        desa_kel: balita.desa_kel,
        kec: balita.kec,
        kab_kota: balita.kab_kota || "Kabupaten Malang",
        posyandu: balita.posyandu,
        alamat: balita.alamat,
        bb_lahir_kg: balita.bb_lahir_kg,
        tb_lahir_cm: balita.tb_lahir_cm,
        puskesmasName,
        redflag_any: balita.redflag_any,
        tpgAnalysis,
      },
      latestAntro,
      initialAntro,
      growthTrajectory: allAntro.map((a) => ({
        minggu_ke: a.minggu_ke,
        tanggal: a.tanggal,
        usia_bulan: a.usia_bulan,
        bb_kg: a.bb_kg,
        tb_cm: a.tb_cm,
        lila_cm: a.lila_cm,
        zs_tbu: a.zs_tbu,
        zs_bbu: a.zs_bbu,
        zs_bbtb: a.zs_bbtb,
        klas_tbu: a.klas_tbu,
        delta_bb_kg: a.delta_bb_kg,
      })),
      complianceTimeline: allKonsumsi.map((c) => ({
        minggu_ke: c.minggu_ke,
        tanggal: c.tanggal,
        porsi_habis_pct: c.porsi_habis_pct,
        efek_samping: c.efek_samping,
        catatan: c.catatan,
      })),
      distributionHistory: allPemberian.map((p) => ({
        minggu_ke: p.minggu_ke,
        tanggal: p.tanggal,
        jenis_pkmk: p.jenis_pkmk,
        jumlah_diberikan: p.jumlah_diberikan,
        tanggal_expired: p.tanggal_expired,
        catatan: p.catatan,
      })),
      sdidtkAssessment: sdidtkList && sdidtkList.length > 0 ? sdidtkList[0] : null,
      totalSiklus: kohortList?.length || 1,
      currentCohortStatus: kohortList && kohortList.length > 0 ? kohortList[kohortList.length - 1].status : "berjalan",
    });
  } catch (err: any) {
    console.error("[GET /api/rapor/[id]] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
