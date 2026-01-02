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

          {/* Global Footer - matches login page style */}
          <footer className="mt-12 pt-6 pb-4" style={{ borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            {/* Copyright */}
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>
              © Dinkes Kab. Malang - Sistem Pelaporan PKMK
            </p>
            {/* Developer Credit with Version */}
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              Crafted with
              <span style={{ color: '#ef4444', animation: 'pulse 1s infinite' }}>♥</span>
              by{' '}
              <a
                href="https://dedik2urniawan.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)', fontWeight: 700 }}
              >
                DK
              </a>
              <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
              <span style={{ opacity: 0.8 }}>v1.2.0</span>
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}


