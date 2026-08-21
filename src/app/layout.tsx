import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KREDENS - Sistem Tata Kelola Kredensial Tenaga Medis",
  description: "Sistem Tata Kelola Kredensial Tenaga Medis dan Tenaga Kesehatan - Dinas Kesehatan Kabupaten Kutai Kartanegara",
  keywords: [
    "KREDENS",
    "Kredensial",
    "Tenaga Medis",
    "Tenaga Kesehatan",
    "Dinkes",
    "Kutai Kartanegara",
    "STR",
    "SIP",
    "Kompetensi",
    "Kewenangan Klinis",
  ],
  authors: [{ name: "Dinas Kesehatan Kabupaten Kutai Kartanegara" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "KREDENS - Sistem Tata Kelola Kredensial",
    description:
      "Formulir Pengajuan Kredensial Online untuk Tenaga Medis dan Tenaga Kesehatan",
    siteName: "KREDENS Dinkes KK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
