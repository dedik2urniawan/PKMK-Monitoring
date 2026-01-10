import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const jk = Number(req.nextUrl.searchParams.get("jk"));
  const month = req.nextUrl.searchParams.get("month");
  const minMonth = req.nextUrl.searchParams.get("min_month");
  const maxMonth = req.nextUrl.searchParams.get("max_month");

  if (!jk) return new Response("jk required", { status: 400 });

  // Helper to calculate X for a given Z-score
  const calcX = (l: number, m: number, s: number, z: number) => {
    if (l === 0) return m * Math.exp(s * z);
    return m * Math.pow(1 + l * s * z, 1 / l);
  };

  // Using 'stage_ref_lms_tbu' and 'Month' as per old working code
  let query = supabase
    .from("stage_ref_lms_tbu")
    .select("Month, L, M, S");

  let data: any[] | null = [];
  let error = null;

  if (minMonth !== null && maxMonth !== null) {
    const res = await query
      .eq("jk", jk)
      .gte("Month", Number(minMonth))
      .lte("Month", Number(maxMonth))
      .order("Month", { ascending: true });
    data = res.data;
    error = res.error;
  } else if (month !== null) {
    const res = await query
      .eq("jk", jk)
      .eq("Month", Number(month))
      .maybeSingle();
    data = res.data ? [res.data] : [];
    error = res.error;
  } else {
    return new Response("month or min_month/max_month required", { status: 400 });
  }

  if (error) return new Response(error.message, { status: 400 });

  const items = data?.map((item: any) => ({
    umur_bulan: item.Month,
    L: item.L, M: item.M, S: item.S,
    sd3neg: calcX(item.L, item.M, item.S, -3),
    sd2neg: calcX(item.L, item.M, item.S, -2),
    sd1neg: calcX(item.L, item.M, item.S, -1),
    sd0: calcX(item.L, item.M, item.S, 0),
    sd1pos: calcX(item.L, item.M, item.S, 1),
    sd2pos: calcX(item.L, item.M, item.S, 2),
    sd3pos: calcX(item.L, item.M, item.S, 3),
  })) ?? [];

  if (month !== null && items.length > 0) {
    return NextResponse.json({ item: items[0] });
  }
  return NextResponse.json({ items });
}

