import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const appUser = await getAppUser();

        if (!appUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Calculate period end date (CUMULATIVE until end of selected month)
        const periodEnd = new Date(year, month, 0); // Last day of selected month
        const periodEndStr = periodEnd.toISOString().split('T')[0];

        console.log(`[Compliance API] Period: up to ${periodEndStr}, User: ${appUser.role}, Puskesmas: ${appUser.puskesmas_id}`);

        // 0. Get ref_desa mapping (correct desa -> puskesmas relationship)
        const { data: refDesaData } = await supabase
            .from("ref_desa")
            .select("id, desa_kel, puskesmas_id");

        const desaToPuskesmasMap = new Map<string, string>();
        refDesaData?.forEach((d: any) => {
            if (d.desa_kel && d.puskesmas_id) {
                desaToPuskesmasMap.set(d.desa_kel.toLowerCase().trim(), d.puskesmas_id);
            }
        });

        // Get ref_puskesmas names
        const { data: refPuskesmasData } = await supabase
            .from("ref_puskesmas")
            .select("id, nama");

        const puskesmasNameMap = new Map<string, string>();
        refPuskesmasData?.forEach((p: any) => {
            if (p.id && p.nama) {
                puskesmasNameMap.set(p.id, p.nama);
            }
        });

        console.log(`[Compliance API] ref_desa: ${desaToPuskesmasMap.size}, ref_puskesmas: ${puskesmasNameMap.size}`);

        // 1. COUNT TOTAL BALITA (created_at <= periodEnd)
        let balitaQuery = supabase
            .from("balita")
            .select("id, puskesmas_id, desa_kel, puskesmas:puskesmas_id(id, nama)", { count: 'exact' })
            .lte('created_at', periodEndStr);

        // Filter by puskesmas if admin_puskesmas
        if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
            balitaQuery = balitaQuery.eq('puskesmas_id', appUser.puskesmas_id);
        }

        const { data: balitaData, error: balitaError, count: balitaCount } = await balitaQuery;

        console.log(`[Compliance API] Balita count: ${balitaCount}, rows: ${balitaData?.length}`);

        if (balitaError) {
            console.error("[Compliance API] Balita error:", balitaError);
            return NextResponse.json({ error: balitaError.message }, { status: 500 });
        }

        // 2. COUNT KOHORT (periode_mulai <= periodEnd)
        let kohortQuery = supabase
            .from("kohort")
            .select(`
        id,
        balita_id,
        puskesmas_id,
        periode_mulai
      `)
            .lte('periode_mulai', periodEndStr);

        if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
            kohortQuery = kohortQuery.eq('puskesmas_id', appUser.puskesmas_id);
        }

        const { data: kohortData, error: kohortError } = await kohortQuery;

        console.log(`[Compliance API] Kohort rows: ${kohortData?.length}`);

        if (kohortError) {
            console.error("[Compliance API] Kohort error:", kohortError);
            return NextResponse.json({ error: kohortError.message }, { status: 500 });
        }

        // Calculate metrics
        const totalBalita = balitaCount || 0;
        const uniqueBalitaWithKohort = new Set(kohortData?.map((k: any) => k.balita_id)).size;
        const compliancePercentage = totalBalita > 0 ? (uniqueBalitaWithKohort / totalBalita) * 100 : 0;

        console.log(`[Compliance API] Total: ${totalBalita}, Kohort: ${uniqueBalitaWithKohort}, %: ${compliancePercentage.toFixed(2)}`);

        // Group by location
        const groupedData: any[] = [];

        if (appUser.role === 'superadmin') {
            // Group by Puskesmas
            const puskesmasMap = new Map();

            balitaData?.forEach((balita: any) => {
                // FIX: Use ref_desa mapping for correct puskesmas assignment
                const desaKey = balita.desa_kel?.toLowerCase().trim();
                const correctPuskesmasId = desaKey ? desaToPuskesmasMap.get(desaKey) : null;

                // Use correct puskesmas_id from ref_desa, fallback to balita.puskesmas_id
                const effectivePuskesmasId = correctPuskesmasId || balita.puskesmas_id;

                if (!effectivePuskesmasId) return;

                const puskId = effectivePuskesmasId;
                if (!puskesmasMap.has(puskId)) {
                    puskesmasMap.set(puskId, {
                        id: puskId,
                        name: puskesmasNameMap.get(puskId) || `Puskesmas ${puskId}`,
                        total: 0,
                        kohort: 0,
                        balitaIds: new Set(),
                        children: new Map(),
                    });
                }
                const pusk = puskesmasMap.get(puskId);
                pusk.total++;
                pusk.balitaIds.add(balita.id);

                // Add desa children under the CORRECT puskesmas
                if (balita.desa_kel) {
                    const childDesaKey = balita.desa_kel.toLowerCase().trim();
                    if (!pusk.children.has(childDesaKey)) {
                        pusk.children.set(childDesaKey, {
                            id: childDesaKey,
                            name: balita.desa_kel,
                            total: 0,
                            kohort: 0,
                            balitaIds: new Set(),
                        });
                    }
                    const desa = pusk.children.get(childDesaKey);
                    desa.total++;
                    desa.balitaIds.add(balita.id);
                }
            });

            // Count kohort entries
            kohortData?.forEach((kohort: any) => {
                // Find the balita to get their desa_kel
                const balita = balitaData?.find((b: any) => b.id === kohort.balita_id);
                if (!balita) return;

                // Determine the correct puskesmas using ref_desa mapping
                const desaKey = balita.desa_kel?.toLowerCase().trim();
                const correctPuskesmasId = desaKey ? desaToPuskesmasMap.get(desaKey) : null;
                const effectivePuskesmasId = correctPuskesmasId || balita.puskesmas_id;

                if (puskesmasMap.has(effectivePuskesmasId)) {
                    const pusk = puskesmasMap.get(effectivePuskesmasId);
                    if (pusk.balitaIds.has(kohort.balita_id)) {
                        pusk.kohort++;
                    }

                    // Count for desa children
                    if (balita.desa_kel) {
                        const childDesaKey = balita.desa_kel.toLowerCase().trim();
                        const desa = pusk.children.get(childDesaKey);
                        if (desa && desa.balitaIds.has(kohort.balita_id)) {
                            desa.kohort++;
                        }
                    }
                }
            });

            // Convert to array
            puskesmasMap.forEach(pusk => {
                const children: any[] = [];
                pusk.children.forEach((desa: any) => {
                    children.push({
                        id: desa.id,
                        name: desa.name,
                        total: desa.total,
                        kohort: desa.kohort,
                        percentage: desa.total > 0 ? (desa.kohort / desa.total) * 100 : 0,
                    });
                });

                groupedData.push({
                    id: pusk.id,
                    name: pusk.name,
                    total: pusk.total,
                    kohort: pusk.kohort,
                    percentage: pusk.total > 0 ? (pusk.kohort / pusk.total) * 100 : 0,
                    children: children.length > 0 ? children : undefined,
                });
            });
        } else {
            // Admin Puskesmas - Group by Desa (using desa_kel)
            const desaMap = new Map();

            balitaData?.forEach((balita: any) => {
                if (!balita.desa_kel) return;

                const desaKey = balita.desa_kel.toLowerCase().trim();
                if (!desaMap.has(desaKey)) {
                    desaMap.set(desaKey, {
                        id: desaKey,
                        name: balita.desa_kel,
                        total: 0,
                        kohort: 0,
                        balitaIds: new Set(),
                    });
                }
                const desa = desaMap.get(desaKey);
                desa.total++;
                desa.balitaIds.add(balita.id);
            });

            // Count kohort entries
            kohortData?.forEach((kohort: any) => {
                const balita = balitaData?.find((b: any) => b.id === kohort.balita_id);
                if (!balita || !balita.desa_kel) return;

                const desaKey = balita.desa_kel.toLowerCase().trim();
                if (desaMap.has(desaKey)) {
                    const desa = desaMap.get(desaKey);
                    if (desa.balitaIds.has(kohort.balita_id)) {
                        desa.kohort++;
                    }
                }
            });

            // Convert to array
            desaMap.forEach(desa => {
                groupedData.push({
                    id: desa.id,
                    name: desa.name,
                    total: desa.total,
                    kohort: desa.kohort,
                    percentage: desa.total > 0 ? (desa.kohort / desa.total) * 100 : 0,
                });
            });
        }

        return NextResponse.json({
            totalBalita,
            kohortInput: uniqueBalitaWithKohort,
            compliancePercentage,
            groupedData,
            level: appUser.role === 'superadmin' ? 'puskesmas' : 'desa',
        });
    } catch (error: any) {
        console.error("[Compliance API] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
