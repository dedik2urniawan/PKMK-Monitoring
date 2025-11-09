import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const jk = Number(req.nextUrl.searchParams.get("jk"));
  const month = Number(req.nextUrl.searchParams.get("month"));
  if (!jk || isNaN(month)) return new Response("jk and month required", { status: 400 });
  const { data, error } = await supabase
    .from("stage_ref_lms_tbu")
    .select("L,M,S")
    .eq("jk", jk)
    .eq("Month", month)
    .maybeSingle();
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ item: data ?? null });
}

