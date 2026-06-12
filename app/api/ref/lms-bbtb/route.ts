import { NextRequest, NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const jk = Number(req.nextUrl.searchParams.get("jk"));
  const length = req.nextUrl.searchParams.get("length");
  const minLength = req.nextUrl.searchParams.get("min_length");
  const maxLength = req.nextUrl.searchParams.get("max_length");

  if (!jk) return new Response("jk required", { status: 400 });

  // Helper to calculate X for a given Z-score
  const calcX = (l: number, m: number, s: number, z: number) => {
    if (l === 0) return m * Math.exp(s * z);
    return m * Math.pow(1 + l * s * z, 1 / l);
  };

  // Using 'ref_lms_bbtb' and 'Length' as per old working code
  let query = supabase
    .from("ref_lms_bbtb")
    .select("Length, L, M, S");

  let data: any[] | null = [];
  let error = null;

  if (minLength !== null && maxLength !== null) {
    const res = await query
      .eq("jk", jk)
      .gte("Length", Number(minLength))
      .lte("Length", Number(maxLength))
      .order("Length", { ascending: true });
    data = res.data;
    error = res.error;
  } else if (length !== null) {
    const rounded = Math.round(Number(length) * 10) / 10;
    const res = await query
      .eq("jk", jk)
      .eq("Length", rounded)
      .maybeSingle();
    data = res.data ? [res.data] : [];
    error = res.error;
  } else {
    return new Response("length or min_length/max_length required", { status: 400 });
  }

  if (error) return new Response(error.message, { status: 400 });

  const items = data?.map((item: any) => ({
    tb_cm: item.Length,
    L: item.L, M: item.M, S: item.S,
    sd3neg: calcX(item.L, item.M, item.S, -3),
    sd2neg: calcX(item.L, item.M, item.S, -2),
    sd1neg: calcX(item.L, item.M, item.S, -1),
    sd0: calcX(item.L, item.M, item.S, 0),
    sd1pos: calcX(item.L, item.M, item.S, 1),
    sd2pos: calcX(item.L, item.M, item.S, 2),
    sd3pos: calcX(item.L, item.M, item.S, 3),
  })) ?? [];

  if (length !== null && items.length > 0) {
    return NextResponse.json({ item: items[0] });
  }
  return NextResponse.json({ items });
}

