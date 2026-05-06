import Navbar from "@/components/Navbar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-4rem)] bg-white">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ICONIC Group. Built with Next.js & Supabase.
      </footer>
    </>
  );
}
