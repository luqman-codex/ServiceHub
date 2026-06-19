// src/components/layout/Footer.tsx — public site footer (04 Part B shell).
import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>© {year} ServiceHub. All rights reserved.</p>
        <nav className="flex items-center gap-4" aria-label="Footer">
          <Link href="/" className="hover:text-slate-700">
            Home
          </Link>
          <Link href="/categories" className="hover:text-slate-700">
            Categories
          </Link>
          <Link href="/services" className="hover:text-slate-700">
            Services
          </Link>
        </nav>
      </div>
    </footer>
  );
}
