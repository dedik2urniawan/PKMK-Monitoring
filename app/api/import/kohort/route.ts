import { NextRequest, NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { rows, puskesmasId } = body;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "No data to import" }, { status: 400 });
        }

        const effectivePuskesmasId = user.role === "admin_puskesmas" ? user.puskesmas_id : puskesmasId;

        let success = 0;
        let failed = 0;
        const errors: { row: number; error: string }[] = [];

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
                    .select("id, puskesmas_id")
                    .eq("nik", nik);

                if (effectivePuskesmasId) {
                    balitaQuery = balitaQuery.eq("puskesmas_id", effectivePuskesmasId);
                }

                const { data: balita } = await balitaQuery.maybeSingle();

                if (!balita) {
                    errors.push({ row: rowNum, error: `NIK "${nik}" tidak ditemukan di database puskesmas ini` });
                    failed++;
                    continue;
                }

                const targetPuskesmasId = balita.puskesmas_id;

                // CONSTRAINT VALIDATION: Check for existing cohorts
                const { data: existingKohorts, error: kohortError } = await supabase
                    .from("kohort")
                    .select("id, periode_mulai")
                    .eq("balita_id", balita.id)
                    .order("periode_mulai", { ascending: false });

                if (kohortError) {
                    errors.push({ row: rowNum, error: "Error memeriksa cohort yang ada" });
                    failed++;
                    continue;
                }

                // Check if balita has completed Week 12 of latest cohort
                if (existingKohorts && existingKohorts.length > 0) {
                    const latestKohort = existingKohorts[0];

                    const { data: monitoringRecords } = await supabase
                        .from("monitoring_antropometri")
                        .select("minggu_ke") // Note: The schema actually uses minggu_ke for monitoring
                        .eq("kohort_id", latestKohort.id)
                        .order("minggu_ke", { ascending: false })
                        .limit(1);

                    if (monitoringRecords && monitoringRecords.length > 0) {
                        const currentWeek = monitoringRecords[0].minggu_ke || 0;

                        if (currentWeek < 12) {
                            errors.push({ row: rowNum, error: `Balita masih dalam intervensi aktif (minggu ke-${currentWeek}). SKIP.` });
                            failed++;
                            continue;
                        }
                    } else {
                        errors.push({ row: rowNum, error: "Balita sudah memiliki kohort yang sedang berjalan. SKIP." });
                        failed++;
                        continue;
                    }
                }

                // All constraints passed, proceed with cohort creation
                const { error: insertError } = await supabase.from("kohort").insert({
                    balita_id: balita.id,
                    puskesmas_id: targetPuskesmasId,
                    periode_mulai: row.tanggal_mulai,
                });

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

        console.log(`[Import Kohort] Success: ${success}, Failed: ${failed}`);

        return NextResponse.json({ success, failed, errors });
    } catch (err: any) {
        console.error("[Import Kohort] Error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
