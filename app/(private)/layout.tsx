import Link from "next/link";
import Image from "next/image";
import SideNav from "@/components/SideNav";
import Header from "@/components/Header";
import IdleGuard from "@/components/IdleGuard";
import AuthSessionSync from "@/components/AuthSessionSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  // Auth is handled by:
  // 1. Middleware - for full page navigation with cookies
  // 2. AuthSessionSync - for client-side protection with localStorage


  return (
    <div className="grid grid-cols-[auto_1fr] min-h-screen max-h-screen overflow-hidden">
      {/* Sidebar - Full height with internal scroll */}
      <aside
        className="relative border-r border-gray-200 shadow-xl flex flex-col h-screen"
        style={{
          background: 'linear-gradient(to bottom right, #ecfdf5, #f0fdfa, #ecfeff)'
        }}
      >
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-white/40 backdrop-blur-sm flex-shrink-0">
          <Image src="/tindik-anting-logo.png" alt="PKMK" width={24} height={24} className="flex-shrink-0" />
          <span className="font-bold text-sm whitespace-nowrap text-gray-800">Sistem Pelaporan PKMK</span>
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

          {/* Global Footer - Developer Credit */}
          <footer className="mt-12 pt-6 pb-4 border-t border-gray-200">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                Crafted with
                <span className="text-red-500 animate-pulse inline-block">♥</span>
                by{' '}
                <a
                  href="https://dedik2urniawan.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  DK
                </a>
              </p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}


