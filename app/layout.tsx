import type { Metadata } from "next";
import { Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BetLedger — See your real Hard Rock P&L",
  description:
    "Drop in your Hard Rock Bet export and instantly see your all-time betting stats: total wagered, profit/loss, records, and charts. Everything runs in your browser — your file never leaves your device.",
  openGraph: {
    title: "BetLedger — See your real Hard Rock P&L",
    description:
      "Drop in your Hard Rock Bet export and instantly see your all-time betting stats. Nothing gets uploaded.",
    type: "website",
    siteName: "BetLedger",
  },
  twitter: {
    card: "summary_large_image",
    title: "BetLedger — See your real Hard Rock P&L",
    description:
      "Drop in your Hard Rock Bet export and instantly see your all-time betting stats. Nothing gets uploaded.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${saira.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
