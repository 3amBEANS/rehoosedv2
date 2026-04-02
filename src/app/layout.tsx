import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "ReHoosed — UVA Course Resource Marketplace",
  description:
    "Find or upload textbooks, study material, and more for any UVA course.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
