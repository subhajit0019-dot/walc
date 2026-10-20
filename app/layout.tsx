import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cursed Engine | Client Management Panel",
  description: "Next-generation remote runtime configuration & cryptographic killswitch platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
