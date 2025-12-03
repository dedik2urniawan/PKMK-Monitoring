import Link from "next/link";
import Image from "next/image";
import SideNav from "@/components/SideNav";
import Header from "@/components/Header";
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
    <div className="grid grid-cols-[auto_1fr] min-h-screen max-h-screen overflow-hidden">
      {/* Sidebar - Full height with internal scroll */}
      <aside className="relative border-r border-white/10 bg-gradient-to-b from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--primary-600)] text-white shadow-xl flex flex-col h-screen">
        <div className="flex items-center gap-2 p-4 border-b border-white/15 flex-shrink-0">
          <Image src="/tindik-anting-logo.png" alt="PKMK" width={24} height={24} className="flex-shrink-0" />
          <span className="font-bold text-sm whitespace-nowrap">Sistem Pelaporan PKMK</span>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SideNav />
        </div>
      </aside>

      {/* Main Content Area with Header */}
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header Bar - Fixed at top */}
        <Header />

        {/* Content - Scrollable */}
        <section className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--background)]">
          {/* Auto sign-out on 1 hour idle */}
          <IdleGuard />
          {/* Sync Supabase session cookie for server APIs */}
          <AuthSessionSync />
          {children}
        </section>
      </div>
    </div>
  );
}


