"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard",              label: "Overview",    icon: "▦" },
  { href: "/dashboard/income",       label: "Income",      icon: "₪" },
  { href: "/dashboard/properties",   label: "Properties",  icon: "🏠" },
  { href: "/dashboard/renovations",  label: "Renovations", icon: "🔨" },
  { href: "/dashboard/payments",     label: "Payments",    icon: "💳" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex h-screen w-56 flex-col border-r border-gray-800 bg-gray-950 text-gray-300">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <span className="text-brand-400 text-xl">◈</span>
        <span className="font-bold text-white tracking-wide">ICONIC</span>
        <span className="ml-auto text-[10px] text-gray-600 font-mono">v1</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
              ].join(" ")}
            >
              <span className="w-4 text-center text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-800 p-3 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span className="w-4 text-center">↖</span> Home
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors text-left"
        >
          <span className="w-4 text-center">⇥</span> Sign out
        </button>
      </div>
    </aside>
  );
}
