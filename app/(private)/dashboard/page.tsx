import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();
  const appUser = await getAppUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let q = supabase.from("balita").select("id", { head: true, count: "exact" });
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    // @ts-ignore - match not needed for head count; use eq to scope
    q = q.eq('puskesmas_id', appUser.puskesmas_id);
  }
  const { count } = await q;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Total Balita (akses RLS)</div>
              <div className="text-3xl font-bold mt-1 text-[var(--foreground)]">{count ?? 0}</div>
            </div>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
          </div>
        </div>

        <Link
          href="/balita"
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--primary)] hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--muted-foreground)]">Data</div>
              <div className="text-lg font-semibold text-[var(--foreground)]">Kelola Data Balita</div>
            </div>
            <span className="text-[var(--primary-700)]">?</span>
          </div>
        </Link>
      </div>
    </div>
  );
}




