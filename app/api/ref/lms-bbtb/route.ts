import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const jk = Number(req.nextUrl.searchParams.get("jk"));
  const length = Number(req.nextUrl.searchParams.get("length"));
  if (!jk || isNaN(length)) return new Response("jk and length required", { status: 400 });
  const rounded = Math.round(length * 10) / 10; // 1 decimal place
  const { data, error } = await supabase
    .from("ref_lms_bbtb")
    .select("L,M,S")
    .eq("jk", jk)
    .eq("Length", rounded)
    .maybeSingle();
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ item: data ?? null });
}

