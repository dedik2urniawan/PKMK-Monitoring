import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function PrivateShell({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-[var(--primary-700)]">
            <Image src="/tindik-anting-logo.png" alt="PKMK" width={28} height={28} />
            <span className="hidden sm:inline">PKMK</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="hover:underline text-[var(--muted-foreground)] hover:text-[var(--primary-700)]">Dashboard</Link>
            <Link href="/balita" className="hover:underline text-[var(--muted-foreground)] hover:text-[var(--primary-700)]">Balita</Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="px-4 py-6 sm:px-6">
        {title ? (
          <h1 className="text-2xl font-semibold mb-4 text-[var(--foreground)]">{title}</h1>
        ) : null}
        {children}
      </main>
    </div>
  );
}
