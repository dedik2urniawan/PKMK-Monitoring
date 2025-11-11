import Link from "next/link";
import Image from "next/image";
import SideNav from "@/components/SideNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import IdleGuard from "@/components/IdleGuard";
import AuthSessionSync from "@/components/AuthSessionSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  // Auth gate for all /(private) pages
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="grid grid-cols-[240px_1fr] gap-0 min-h-[100svh]">
      {/* Sidebar desktop */}
      <aside className="border-r border-black/10 bg-[var(--primary-700)] text-white min-h-[100svh] overflow-y-auto">
        <div className="flex items-center gap-2 p-4 border-b border-white/15">
          <Image src="/tindik-anting-logo.png" alt="PKMK" width={24} height={24} />
          <span className="font-bold">Sistem Pelaporan PKMK</span>
        </div>
        <SideNav />
      </aside>

      {/* Content */}
      <section className="p-4 md:p-6 bg-[var(--background)]">
        {/* Auto sign-out on 5 minutes idle */}
        <IdleGuard />
        {/* Sync Supabase session cookie for server APIs */}
        <AuthSessionSync />
        {children}
      </section>
    </div>
  );
}


