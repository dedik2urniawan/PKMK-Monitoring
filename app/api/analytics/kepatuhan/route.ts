import { createAdminClient as createClient } from "@/lib/supabase/server";
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

        // Calculate period (CUMULATIVE until end of selected month)
        const periodEnd = new Date(year, month, 0);
        const periodEndStr = periodEnd.toISOString().split('T')[0];

        console.log(`[Kepatuhan API] Period: up to ${periodEndStr}, User: ${appUser.role}`);

        // Query monitoring_pkmk_konsumsi
        let query = supabase
            .from("monitoring_pkmk_konsumsi")
            .select(`
        id,
        tanggal,
        kepatuhan_pct,
        catatan,
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
      `)
            .lte('tanggal', periodEndStr);

        const { data: konsumsiData, error: konsumsiError } = await query;

        if (konsumsiError) {
            console.error("[Kepatuhan API] Error:", konsumsiError);
            return NextResponse.json({ error: konsumsiError.message }, { status: 500 });
        }

        // Filter by puskesmas if admin_puskesmas
        let filteredData = konsumsiData || [];
        if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
            filteredData = filteredData.filter((item: any) => {
                const balita = item.kohort?.balita;
                return balita?.puskesmas_id === appUser.puskesmas_id;
            });
            console.log(`[Kepatuhan API] Filtered to ${filteredData.length} rows for puskesmas ${appUser.puskesmas_id}`);
        }

        // Calculate overall averages
        let totalKepatuhan = 0;
        let countKepatuhan = 0;
        let sehatCount = 0;
        let sakitCount = 0;

        filteredData.forEach((entry: any) => {
            if (entry.kepatuhan_pct !== null && entry.kepatuhan_pct !== undefined) {
                totalKepatuhan += entry.kepatuhan_pct;
                countKepatuhan++;
            }

            if (entry.catatan) {
                const catatan = entry.catatan.toLowerCase().trim();
                if (catatan.includes('sehat')) {
                    sehatCount++;
                } else if (catatan.includes('sakit')) {
                    sakitCount++;
                }
            }
        });

        const avgKepatuhan = countKepatuhan > 0 ? totalKepatuhan / countKepatuhan : 0;
        const totalHealth = sehatCount + sakitCount;
        const sehatPercentage = totalHealth > 0 ? (sehatCount / totalHealth) * 100 : 0;
        const sakitPercentage = totalHealth > 0 ? (sakitCount / totalHealth) * 100 : 0;

        // Group by location
        const locationMap = new Map();

        filteredData.forEach((entry: any) => {
            const balita = entry.kohort?.balita;
            if (!balita) return;

            let locationKey = '';
            let locationName = '';
            let parentKey = '';
            let parentName = '';

            if (appUser.role === 'superadmin') {
                // Group by puskesmas, with desa children
                if (balita.puskesmas_id) {
                    parentKey = balita.puskesmas_id;
                    const puskData = Array.isArray(balita.puskesmas) ? balita.puskesmas[0] : balita.puskesmas;
                    parentName = puskData?.nama || `Puskesmas ${parentKey}`;

                    if (balita.desa_kel) {
                        locationKey = `${parentKey}__${balita.desa_kel.toLowerCase().trim()}`;
                        locationName = balita.desa_kel;
                    }
                }
            } else {
                // Admin puskesmas - group by desa only
                if (balita.desa_kel) {
                    locationKey = balita.desa_kel.toLowerCase().trim();
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
                        kepatuhan: [],
                        sehat: 0,
                        sakit: 0,
                        children: new Map(),
                    });
                }

                const parent = locationMap.get(parentKey);
                if (!parent.children.has(locationKey)) {
                    parent.children.set(locationKey, {
                        id: locationKey,
                        name: locationName,
                        kepatuhan: [],
                        sehat: 0,
                        sakit: 0,
                    });
                }

                const child = parent.children.get(locationKey);

                // Add to child
                if (entry.kepatuhan_pct !== null) child.kepatuhan.push(entry.kepatuhan_pct);
                if (entry.catatan) {
                    const catatan = entry.catatan.toLowerCase().trim();
                    if (catatan.includes('sehat')) child.sehat++;
                    else if (catatan.includes('sakit')) child.sakit++;
                }

                // Also add to parent
                if (entry.kepatuhan_pct !== null) parent.kepatuhan.push(entry.kepatuhan_pct);
                if (entry.catatan) {
                    const catatan = entry.catatan.toLowerCase().trim();
                    if (catatan.includes('sehat')) parent.sehat++;
                    else if (catatan.includes('sakit')) parent.sakit++;
                }
            } else {
                // Admin puskesmas or no parent
                if (!locationMap.has(locationKey)) {
                    locationMap.set(locationKey, {
                        id: locationKey,
                        name: locationName,
                        kepatuhan: [],
                        sehat: 0,
                        sakit: 0,
                    });
                }

                const location = locationMap.get(locationKey);
                if (entry.kepatuhan_pct !== null) location.kepatuhan.push(entry.kepatuhan_pct);
                if (entry.catatan) {
                    const catatan = entry.catatan.toLowerCase().trim();
                    if (catatan.includes('sehat')) location.sehat++;
                    else if (catatan.includes('sakit')) location.sakit++;
                }
            }
        });

        // Build response arrays
        const kepatuhanByLocation: any[] = [];
        const healthByLocation: any[] = [];

        locationMap.forEach((loc) => {
            const avgKepatuhanLoc = loc.kepatuhan.length > 0
                ? loc.kepatuhan.reduce((sum: number, val: number) => sum + val, 0) / loc.kepatuhan.length
                : 0;

            const totalHealthLoc = loc.sehat + loc.sakit;
            const sehatPctLoc = totalHealthLoc > 0 ? (loc.sehat / totalHealthLoc) * 100 : 0;
            const sakitPctLoc = totalHealthLoc > 0 ? (loc.sakit / totalHealthLoc) * 100 : 0;

            const children: any[] = [];
            if (loc.children) {
                loc.children.forEach((child: any) => {
                    const avgKepatuhanChild = child.kepatuhan.length > 0
                        ? child.kepatuhan.reduce((sum: number, val: number) => sum + val, 0) / child.kepatuhan.length
                        : 0;

                    const totalHealthChild = child.sehat + child.sakit;
                    const sehatPctChild = totalHealthChild > 0 ? (child.sehat / totalHealthChild) * 100 : 0;
                    const sakitPctChild = totalHealthChild > 0 ? (child.sakit / totalHealthChild) * 100 : 0;

                    children.push({
                        id: child.id,
                        name: child.name,
                        avgKepatuhan: parseFloat(avgKepatuhanChild.toFixed(1)),
                        sehat: child.sehat,
                        sakit: child.sakit,
                        sehatPercentage: parseFloat(sehatPctChild.toFixed(1)),
                        sakitPercentage: parseFloat(sakitPctChild.toFixed(1)),
                    });
                });
            }

            kepatuhanByLocation.push({
                id: loc.id,
                name: loc.name,
                avgKepatuhan: parseFloat(avgKepatuhanLoc.toFixed(1)),
                children: children.length > 0 ? children : undefined,
            });

            healthByLocation.push({
                id: loc.id,
                name: loc.name,
                sehat: loc.sehat,
                sakit: loc.sakit,
                sehatPercentage: parseFloat(sehatPctLoc.toFixed(1)),
                sakitPercentage: parseFloat(sakitPctLoc.toFixed(1)),
                children: children.length > 0 ? children : undefined,
            });
        });

        console.log(`[Kepatuhan API] Avg: ${avgKepatuhan.toFixed(1)}%, Sehat: ${sehatCount}, Sakit: ${sakitCount}`);

        return NextResponse.json({
            avgKepatuhan: parseFloat(avgKepatuhan.toFixed(1)),
            kepatuhanByLocation,
            healthStatus: {
                sehat: sehatCount,
                sakit: sakitCount,
                sehatPercentage: parseFloat(sehatPercentage.toFixed(1)),
                sakitPercentage: parseFloat(sakitPercentage.toFixed(1)),
            },
            healthByLocation,
            level: appUser.role === 'superadmin' ? 'puskesmas' : 'desa',
        });
    } catch (error: any) {
        console.error("[Kepatuhan API] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
