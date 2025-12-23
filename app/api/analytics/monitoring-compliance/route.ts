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
        const weekParam = searchParams.get("week");
        const week = weekParam && weekParam !== "all" ? parseInt(weekParam) : null;

        // Calculate period
        const yearStr = year.toString();
        const monthStr = month.toString().padStart(2, '0');
        const lastDay = new Date(year, month, 0).getDate();

        const periodStartStr = `${yearStr}-${monthStr}-01`;
        const periodEndStr = `${yearStr}-${monthStr}-${lastDay}`;

        // For total balita count (cumulative up to end of selected month)
        const cumulativeEndStr = periodEndStr;

        console.log(`[Monitoring Compliance API] Period End: ${periodEndStr}, Week: ${week || 'All (Cumulative)'}, User: ${appUser.role}`);

        // 0. Get ref_desa mapping (correct desa -> puskesmas relationship)
        const { data: refDesaData, error: refDesaError } = await supabase
            .from("ref_desa")
            .select("id, desa_kel, puskesmas_id");

        if (refDesaError) {
            console.error("[Monitoring Compliance API] ref_desa error:", refDesaError);
        }

        // Build lookup: desa_kel (lowercase) -> puskesmas_id (from ref_desa)
        const desaToPuskesmasMap = new Map<string, string>();
        refDesaData?.forEach((d: any) => {
            if (d.desa_kel && d.puskesmas_id) {
                desaToPuskesmasMap.set(d.desa_kel.toLowerCase().trim(), d.puskesmas_id);
            }
        });

        console.log(`[Monitoring Compliance API] ref_desa mapping loaded: ${desaToPuskesmasMap.size} entries`);

        // Also fetch puskesmas names for lookup
        const { data: puskesmasData, error: puskError } = await supabase
            .from("ref_puskesmas")
            .select("id, nama");

        if (puskError) {
            console.error("[Monitoring Compliance API] ref_puskesmas error:", puskError);
        }
        console.log(`[Monitoring Compliance API] ref_puskesmas loaded: ${puskesmasData?.length || 0} entries`);

        const puskesmasNameMap = new Map<string, string>();
        puskesmasData?.forEach((p: any) => {
            if (p.id && p.nama) {
                puskesmasNameMap.set(p.id, p.nama);
            }
        });

        // 1. Get total balita count (created up to selected month)
        let balitaQuery = supabase
            .from("balita")
            .select("id, puskesmas_id, desa_kel, puskesmas:puskesmas_id(id, nama)", { count: 'exact' })
            .lte('created_at', `${cumulativeEndStr} 23:59:59`);

        if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
            balitaQuery = balitaQuery.eq('puskesmas_id', appUser.puskesmas_id);
        }

        const { data: balitaData, count: totalBalita, error: balitaError } = await balitaQuery;

        if (balitaError) {
            console.error("[Monitoring Compliance API] Balita error:", balitaError);
            return NextResponse.json({ error: balitaError.message }, { status: 500 });
        }

        console.log(`[Monitoring Compliance API] Total balita: ${totalBalita}`);

        // 2. Get monitoring records
        // LOGIC UPDATE:
        // If week is specific: Filter by Month AND Week (Strict)
        // If week is ALL: Filter by <= EndDate (Cumulative from beginning)

        const applyDateFilter = (query: any) => {
            if (week) {
                // Specific week: Strict monthly + weekly
                return query
                    .gte('tanggal', periodStartStr)
                    .lte('tanggal', periodEndStr)
                    .eq('minggu_ke', week);
            } else {
                // All weeks: Cumulative up to end of month
                return query.lte('tanggal', periodEndStr);
            }
        };


        // Antropometri monitoring
        let antropometriQuery = supabase
            .from("monitoring_antropometri")
            .select(`
        id,
        tanggal,
        minggu_ke,
        kohort:kohort_id (
          id,
          balita_id,
          puskesmas_id,
          balita:balita_id (
            id,
            puskesmas_id,
            desa_kel,
            puskesmas:puskesmas_id (id, nama)
          )
        )
      `);

        antropometriQuery = applyDateFilter(antropometriQuery);

        const { data: antropometriData, error: antropometriError } = await antropometriQuery;

        if (antropometriError) {
            console.error("[Monitoring Compliance API] Antropometri error:", antropometriError);
        } else {
            console.log(`[Monitoring Compliance API] Antropometri found: ${antropometriData?.length} records`);
        }

        // Konsumsi monitoring
        let konsumsiQuery = supabase
            .from("monitoring_pkmk_konsumsi")
            .select(`
        id,
        tanggal,
        minggu_ke,
        kohort:kohort_id (
          id,
          balita_id,
          puskesmas_id,
          balita:balita_id (
            id,
            puskesmas_id,
            desa_kel,
            puskesmas:puskesmas_id (id, nama)
          )
        )
      `);

        konsumsiQuery = applyDateFilter(konsumsiQuery);

        const { data: konsumsiData, error: konsumsiError } = await konsumsiQuery;

        if (konsumsiError) {
            console.error("[Monitoring Compliance API] Konsumsi error:", konsumsiError);
        } else {
            console.log(`[Monitoring Compliance API] Konsumsi found: ${konsumsiData?.length} records`);
        }

        // Pemberian monitoring
        let pemberianQuery = supabase
            .from("monitoring_pkmk_pemberian")
            .select(`
        id,
        tanggal,
        minggu_ke,
        kohort:kohort_id (
          id,
          balita_id,
          puskesmas_id,
          balita:balita_id (
            id,
            puskesmas_id,
            desa_kel,
            puskesmas:puskesmas_id (id, nama)
          )
        )
      `);

        pemberianQuery = applyDateFilter(pemberianQuery);

        const { data: pemberianData, error: pemberianError } = await pemberianQuery;

        if (pemberianError) {
            console.error("[Monitoring Compliance API] Pemberian error:", pemberianError);
        } else {
            console.log(`[Monitoring Compliance API] Pemberian found: ${pemberianData?.length} records`);
        }

        // Filter by puskesmas if admin
        const filterByPuskesmas = (data: any[]) => {
            if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
                return data.filter((item: any) => {
                    const balita = item.kohort?.balita;
                    return balita?.puskesmas_id === appUser.puskesmas_id;
                });
            }
            return data;
        };

        const filteredAntropometri = filterByPuskesmas(antropometriData || []);
        const filteredKonsumsi = filterByPuskesmas(konsumsiData || []);
        const filteredPemberian = filterByPuskesmas(pemberianData || []);

        // Get unique balita IDs for each monitoring type
        const balitaWithAntropometri = new Set(
            filteredAntropometri
                .map((item: any) => item.kohort?.balita_id)
                .filter(Boolean)
        );

        const balitaWithKonsumsi = new Set(
            filteredKonsumsi
                .map((item: any) => item.kohort?.balita_id)
                .filter(Boolean)
        );

        const balitaWithPemberian = new Set(
            filteredPemberian
                .map((item: any) => item.kohort?.balita_id)
                .filter(Boolean)
        );

        // Calculate overall compliance
        const overall = {
            antropometri: {
                monitored: balitaWithAntropometri.size,
                percentage: totalBalita && totalBalita > 0 ? (balitaWithAntropometri.size / totalBalita) * 100 : 0,
            },
            konsumsi: {
                monitored: balitaWithKonsumsi.size,
                percentage: totalBalita && totalBalita > 0 ? (balitaWithKonsumsi.size / totalBalita) * 100 : 0,
            },
            pemberian: {
                monitored: balitaWithPemberian.size,
                percentage: totalBalita && totalBalita > 0 ? (balitaWithPemberian.size / totalBalita) * 100 : 0,
            },
        };

        // Aggregate by location
        const locationMap = new Map();

        balitaData?.forEach((balita: any) => {
            const balitaId = balita.id;

            let locationKey = '';
            let locationName = '';
            let parentKey = '';
            let parentName = '';

            if (appUser.role === 'superadmin') {
                // Group by puskesmas, with desa children
                // FIX: Use ref_desa mapping to determine correct puskesmas for each desa
                const desaKey = balita.desa_kel?.toLowerCase().trim();
                const correctPuskesmasId = desaKey ? desaToPuskesmasMap.get(desaKey) : null;

                // Use the correct puskesmas_id from ref_desa mapping if available
                // Fall back to balita.puskesmas_id if desa not found in ref_desa
                const effectivePuskesmasId = correctPuskesmasId || balita.puskesmas_id;

                if (effectivePuskesmasId) {
                    parentKey = effectivePuskesmasId;
                    // Use puskesmasNameMap for correct name (especially when corrected)
                    parentName = puskesmasNameMap.get(effectivePuskesmasId) || `Puskesmas ${parentKey}`;

                    // Log mismatch for debugging
                    if (correctPuskesmasId && correctPuskesmasId !== balita.puskesmas_id) {
                        console.log(`[DEBUG] Desa "${balita.desa_kel}" corrected: ${balita.puskesmas_id} -> ${correctPuskesmasId}`);
                    }

                    if (balita.desa_kel) {
                        // Use the CORRECT puskesmas_id in the key (not balita.puskesmas_id)
                        locationKey = `${effectivePuskesmasId}__${balita.desa_kel.toLowerCase().trim()}`;
                        locationName = balita.desa_kel;
                    }
                }
            } else {
                // Admin puskesmas - group by desa only
                // Only include desa that belongs to this puskesmas according to ref_desa
                if (balita.desa_kel) {
                    const desaKey = balita.desa_kel.toLowerCase().trim();
                    const correctPuskesmasForDesa = desaToPuskesmasMap.get(desaKey);

                    // Skip if this desa doesn't belong to admin's puskesmas according to ref_desa
                    if (correctPuskesmasForDesa && correctPuskesmasForDesa !== appUser.puskesmas_id) {
                        // This desa belongs to a different puskesmas, skip it
                        return;
                    }

                    // Only include if desa is in ref_desa for this puskesmas OR not in ref_desa at all
                    locationKey = desaKey;
                    locationName = balita.desa_kel;
                }
            }

            if (!locationKey) return;

            // Initialize parent if superadmin
            if (appUser.role === 'superadmin' && parentKey) {
                if (!locationMap.has(parentKey)) {
                    locationMap.set(parentKey, {
                        id: parentKey,
                        name: parentName,
                        totalBalita: 0,
                        antropometri: new Set(),
                        konsumsi: new Set(),
                        pemberian: new Set(),
                        children: new Map(),
                    });
                }

                const parent = locationMap.get(parentKey);
                parent.totalBalita++;

                // Check if this balita has monitoring
                if (balitaWithAntropometri.has(balitaId)) parent.antropometri.add(balitaId);
                if (balitaWithKonsumsi.has(balitaId)) parent.konsumsi.add(balitaId);
                if (balitaWithPemberian.has(balitaId)) parent.pemberian.add(balitaId);

                // Initialize child
                if (!parent.children.has(locationKey)) {
                    parent.children.set(locationKey, {
                        id: locationKey,
                        name: locationName,
                        totalBalita: 0,
                        antropometri: new Set(),
                        konsumsi: new Set(),
                        pemberian: new Set(),
                    });
                }

                const child = parent.children.get(locationKey);
                child.totalBalita++;
                if (balitaWithAntropometri.has(balitaId)) child.antropometri.add(balitaId);
                if (balitaWithKonsumsi.has(balitaId)) child.konsumsi.add(balitaId);
                if (balitaWithPemberian.has(balitaId)) child.pemberian.add(balitaId);
            } else {
                // Admin puskesmas or no parent
                if (!locationMap.has(locationKey)) {
                    locationMap.set(locationKey, {
                        id: locationKey,
                        name: locationName,
                        totalBalita: 0,
                        antropometri: new Set(),
                        konsumsi: new Set(),
                        pemberian: new Set(),
                    });
                }

                const location = locationMap.get(locationKey);
                location.totalBalita++;
                if (balitaWithAntropometri.has(balitaId)) location.antropometri.add(balitaId);
                if (balitaWithKonsumsi.has(balitaId)) location.konsumsi.add(balitaId);
                if (balitaWithPemberian.has(balitaId)) location.pemberian.add(balitaId);
            }
        });

        // Build response array
        const byLocation: any[] = [];

        locationMap.forEach((loc) => {
            const children: any[] = [];
            if (loc.children) {
                loc.children.forEach((child: any) => {
                    children.push({
                        id: child.id,
                        name: child.name,
                        totalBalita: child.totalBalita,
                        antropometri: {
                            monitored: child.antropometri.size,
                            percentage: child.totalBalita > 0 ? (child.antropometri.size / child.totalBalita) * 100 : 0,
                        },
                        konsumsi: {
                            monitored: child.konsumsi.size,
                            percentage: child.totalBalita > 0 ? (child.konsumsi.size / child.totalBalita) * 100 : 0,
                        },
                        pemberian: {
                            monitored: child.pemberian.size,
                            percentage: child.totalBalita > 0 ? (child.pemberian.size / child.totalBalita) * 100 : 0,
                        },
                    });
                });
            }

            byLocation.push({
                id: loc.id,
                name: loc.name,
                totalBalita: loc.totalBalita,
                antropometri: {
                    monitored: loc.antropometri.size,
                    percentage: loc.totalBalita > 0 ? (loc.antropometri.size / loc.totalBalita) * 100 : 0,
                },
                konsumsi: {
                    monitored: loc.konsumsi.size,
                    percentage: loc.totalBalita > 0 ? (loc.konsumsi.size / loc.totalBalita) * 100 : 0,
                },
                pemberian: {
                    monitored: loc.pemberian.size,
                    percentage: loc.totalBalita > 0 ? (loc.pemberian.size / loc.totalBalita) * 100 : 0,
                },
                children: children.length > 0 ? children : undefined,
            });
        });

        console.log(`[Monitoring Compliance API] Overall - Antro: ${overall.antropometri.percentage.toFixed(1)}%, Kons: ${overall.konsumsi.percentage.toFixed(1)}%, Pemb: ${overall.pemberian.percentage.toFixed(1)}%`);

        return NextResponse.json({
            totalBalita: totalBalita || 0,
            overall,
            byLocation,
            level: appUser.role === 'superadmin' ? 'puskesmas' : 'desa',
        });
    } catch (error: any) {
        console.error("[Monitoring Compliance API] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
