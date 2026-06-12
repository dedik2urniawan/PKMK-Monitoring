import { NextRequest, NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

// Z-score calculation helper
function calcZS(value: number, L: number, M: number, S: number): number {
    if (!L || !M || !S) return 0;
    if (L === 0) {
        return Math.log(value / M) / S;
    }
    return (Math.pow(value / M, L) - 1) / (L * S);
}

function classifyZScore(zs: number): string {
    if (zs < -3) return "Severely Low";
    if (zs < -2) return "Low";
    if (zs <= 2) return "Normal";
    if (zs <= 3) return "High";
    return "Severely High";
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { rows, type, puskesmasId } = body;
        // type: "antropometri" | "konsumsi" | "pemberian"

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "No data to import" }, { status: 400 });
        }

        if (!["antropometri", "konsumsi", "pemberian"].includes(type)) {
            return NextResponse.json({ error: "Invalid monitoring type" }, { status: 400 });
        }

        const effectivePuskesmasId = user.role === "admin_puskesmas" ? user.puskesmas_id : puskesmasId;

        let success = 0;
        let failed = 0;
        const errors: { row: number; error: string }[] = [];

        // Pre-fetch LMS data for antropometri
        let lmsBbu: any[] = [];
        let lmsTbu: any[] = [];
        let lmsBbtb: any[] = [];

        if (type === "antropometri") {
            const [bbuRes, tbuRes, bbtbRes] = await Promise.all([
                supabase.from("ref_lms_bbu").select("*"),
                supabase.from("ref_lms_tbu").select("*"),
                supabase.from("ref_lms_bbtb").select("*"),
            ]);
            lmsBbu = bbuRes.data || [];
            lmsTbu = tbuRes.data || [];
            lmsBbtb = bbtbRes.data || [];
        }

        for (const item of rows) {
            const row = item.data;
            const rowNum = item.rowNum;

            try {
                // Lookup balita by NIK
                const nik = row.nik?.toString().trim();
                if (!nik) {
                    errors.push({ row: rowNum, error: "NIK wajib diisi" });
                    failed++;
                    continue;
                }

                let balitaQuery = supabase
                    .from("balita")
                    .select("id, jk, tgl_lahir, puskesmas_id")
                    .eq("nik", nik);

                // Filter by puskesmas if specified
                if (effectivePuskesmasId) {
                    balitaQuery = balitaQuery.eq("puskesmas_id", effectivePuskesmasId);
                }

                const { data: balita } = await balitaQuery.maybeSingle();

                if (!balita) {
                    console.log(`[Import Monitoring] Row ${rowNum}: NIK ${nik} NOT FOUND for puskesmas ${effectivePuskesmasId}`);
                    errors.push({ row: rowNum, error: `NIK "${nik}" tidak ditemukan di database puskesmas ini` });
                    failed++;
                    continue;
                }

                console.log(`[Import Monitoring] Row ${rowNum}: Found balita ${balita.id} for NIK ${nik}`);

                // Get kohort for balita
                const { data: kohort } = await supabase
                    .from("kohort")
                    .select("id")
                    .eq("balita_id", balita.id)
                    .order("periode_mulai", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!kohort) {
                    console.log(`[Import Monitoring] Row ${rowNum}: Balita ${balita.id} has NO KOHORT`);
                    errors.push({ row: rowNum, error: `Balita NIK "${nik}" belum didaftarkan ke Kohort. Silakan daftarkan kohort terlebih dahulu.` });
                    failed++;
                    continue;
                }

                const kohortId = kohort.id;
                const mingguKe = parseInt(row.minggu_ke);

                if (isNaN(mingguKe) || mingguKe < 1 || mingguKe > 12) {
                    errors.push({ row: rowNum, error: "minggu_ke harus 1-12" });
                    failed++;
                    continue;
                }

                // Check duplicate
                let tableName = "";
                if (type === "antropometri") tableName = "monitoring_antropometri";
                else if (type === "konsumsi") tableName = "monitoring_pkmk_konsumsi";
                else if (type === "pemberian") tableName = "monitoring_pkmk_pemberian";

                const { data: existing } = await supabase
                    .from(tableName)
                    .select("id")
                    .eq("kohort_id", kohortId)
                    .eq("minggu_ke", mingguKe)
                    .maybeSingle();

                if (existing) {
                    errors.push({ row: rowNum, error: `Data minggu ke-${mingguKe} sudah ada (SKIP)` });
                    failed++;
                    continue;
                }

                // Prepare insert data based on type
                let insertData: any = {
                    kohort_id: kohortId,
                    minggu_ke: mingguKe,
                    tanggal: row.tanggal,
                };

                if (type === "antropometri") {
                    const bbKg = parseFloat(row.bb_kg) || 0;
                    const tbCm = parseFloat(row.tb_cm) || 0;
                    const caraUkur = row.cara_ukur?.toLowerCase() === "berdiri" ? "berdiri" : "terlentang";
                    const lilaCm = parseFloat(row.lila_cm) || null;

                    // Calculate age in months
                    const tglLahir = new Date(balita.tgl_lahir);
                    const tglMonitoring = new Date(row.tanggal);
                    const usiaBulan = Math.floor(
                        (tglMonitoring.getTime() - tglLahir.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                    );

                    // Corrected TB
                    let tbCorrCm = tbCm;
                    if (usiaBulan < 24 && caraUkur === "berdiri") {
                        tbCorrCm = tbCm + 0.7;
                    } else if (usiaBulan >= 24 && caraUkur === "terlentang") {
                        tbCorrCm = tbCm - 0.7;
                    }

                    // Calculate Z-scores
                    // LMS tables use: jk (1=L, 2=P), Month, L, M, S (uppercase)
                    const jk = balita.jk === "L" ? 1 : 2;

                    // BBU - lookup by jk and Month
                    const lmsBbuRow = lmsBbu.find((r) => r.jk === jk && r.Month === usiaBulan);
                    const zsBbu = lmsBbuRow ? calcZS(bbKg, lmsBbuRow.L, lmsBbuRow.M, lmsBbuRow.S) : null;

                    // TBU - lookup by jk and Month
                    const lmsTbuRow = lmsTbu.find((r) => r.jk === jk && r.Month === usiaBulan);
                    const zsTbu = lmsTbuRow ? calcZS(tbCorrCm, lmsTbuRow.L, lmsTbuRow.M, lmsTbuRow.S) : null;

                    // BBTB - lookup by jk and Length (capital L as per table schema)
                    // Round TB to 0.5 increments as per WHO LMS tables
                    const tbRounded = Math.round(tbCorrCm * 2) / 2; // Round to nearest 0.5
                    console.log(`  BBTB lookup: tbCorrCm=${tbCorrCm}, tbRounded=${tbRounded}`);

                    // Find matching row - BBTB table uses "Length" field
                    const lmsBbtbRow = lmsBbtb.find((r) => {
                        const rowLength = r.Length ?? r.length ?? r.height ?? r.Height;
                        return r.jk === jk && Math.abs(rowLength - tbRounded) < 0.3;
                    });

                    const zsBbtb = lmsBbtbRow ? calcZS(bbKg, lmsBbtbRow.L, lmsBbtbRow.M, lmsBbtbRow.S) : null;

                    // Debug log
                    console.log(`[Import Z-Score] NIK: ${nik}, Age: ${usiaBulan}mo, JK: ${jk}, BB: ${bbKg}, TB: ${tbCorrCm}`);
                    console.log(`  BBU Row found: ${!!lmsBbuRow}, ZS_BBU: ${zsBbu}`);
                    console.log(`  TBU Row found: ${!!lmsTbuRow}, ZS_TBU: ${zsTbu}`);
                    console.log(`  BBTB Row found: ${!!lmsBbtbRow}, Length in row: ${lmsBbtbRow?.Length}, ZS_BBTB: ${zsBbtb}`);

                    insertData = {
                        ...insertData,
                        cara_ukur: caraUkur,
                        usia_bulan: usiaBulan,
                        bb_kg: bbKg,
                        tb_cm: tbCm,
                        tb_corr_cm: tbCorrCm,
                        lila_cm: lilaCm,
                        zs_bbu: zsBbu ? Math.round(zsBbu * 1000) / 1000 : null,
                        zs_tbu: zsTbu ? Math.round(zsTbu * 1000) / 1000 : null,
                        zs_bbtb: zsBbtb ? Math.round(zsBbtb * 1000) / 1000 : null,
                        klas_bbu: zsBbu ? classifyZScore(zsBbu) : null,
                        klas_tbu: zsTbu ? classifyZScore(zsTbu) : null,
                        klas_bbtb: zsBbtb ? classifyZScore(zsBbtb) : null,
                    };
                } else if (type === "konsumsi") {
                    insertData = {
                        ...insertData,
                        kepatuhan_pct: row.kepatuhan_pct ? parseFloat(row.kepatuhan_pct) : null,
                        catatan: row.catatan || null,
                    };
                } else if (type === "pemberian") {
                    insertData = {
                        ...insertData,
                        jumlah_unit: parseInt(row.jumlah_unit) || 0,
                        jenis_formulasi: row.jenis_formulasi || "",
                        keterangan: row.keterangan || null,
                    };
                }

                const { error: insertError } = await supabase.from(tableName).insert(insertData);

                if (insertError) {
                    errors.push({ row: rowNum, error: insertError.message });
                    failed++;
                } else {
                    success++;
                }
            } catch (err: any) {
                errors.push({ row: rowNum, error: err.message || "Unknown error" });
                failed++;
            }
        }

        console.log(`[Import Monitoring ${type}] Success: ${success}, Failed: ${failed}`);

        return NextResponse.json({ success, failed, errors });
    } catch (err: any) {
        console.error("[Import Monitoring] Error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
