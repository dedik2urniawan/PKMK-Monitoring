import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { rows, puskesmasId, desaKel, kec } = body;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "No data to import" }, { status: 400 });
        }

        // Determine puskesmas_id
        const effectivePuskesmasId = user.role === "admin_puskesmas" ? user.puskesmas_id : puskesmasId;

        if (!effectivePuskesmasId) {
            return NextResponse.json({ error: "Puskesmas ID is required" }, { status: 400 });
        }

        let success = 0;
        let failed = 0;
        const errors: { row: number; error: string }[] = [];

        for (const item of rows) {
            const row = item.data;
            const rowNum = item.rowNum;

            try {
                // Check for duplicate NIK
                if (row.nik) {
                    const { data: existing } = await supabase
                        .from("balita")
                        .select("id")
                        .eq("nik", row.nik)
                        .maybeSingle();

                    if (existing) {
                        errors.push({ row: rowNum, error: "NIK sudah terdaftar" });
                        failed++;
                        continue;
                    }
                }

                // Prepare data
                const insertData = {
                    nik: row.nik || null,
                    nama_balita: row.nama_balita,
                    jk: row.jk?.toUpperCase() === "L" ? "L" : "P",
                    tgl_lahir: row.tgl_lahir,
                    nama_ortu: row.nama_ortu || null,
                    posyandu: row.posyandu || null,
                    rt: row.rt || null,
                    rw: row.rw || null,
                    alamat: row.alamat || null,
                    bb_lahir_kg: row.bb_lahir_kg ? parseFloat(row.bb_lahir_kg) : null,
                    tb_lahir_cm: row.tb_lahir_cm ? parseFloat(row.tb_lahir_cm) : null,
                    puskesmas_id: effectivePuskesmasId,
                    desa_kel: desaKel || row.desa_kel || null,
                    kec: kec || null,
                    kab_kota: "MALANG",
                    sumber_data: "excel",
                    // Optional redflag fields
                    bb_tidak_adekuat: row.bb_tidak_adekuat || null,
                    murmur_edema: row.murmur_edema || null,
                    delayed_development: row.delayed_development || null,
                    wajah_dismorfik: row.wajah_dismorfik || null,
                    organomegali_limfadenopati: row.organomegali_limfadenopati || null,
                    ispa_cystitis: row.ispa_cystitis || null,
                    muntah_diare_berulang: row.muntah_diare_berulang || null,
                    diagnosa_penyakit_penyerta: row.diagnosa_penyakit_penyerta || null,
                    keterangan_redflag: row.keterangan_redflag || null,
                };

                const { error: insertError } = await supabase.from("balita").insert(insertData);

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

        console.log(`[Import Balita] Success: ${success}, Failed: ${failed}`);

        return NextResponse.json({ success, failed, errors });
    } catch (err: any) {
        console.error("[Import Balita] Error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
