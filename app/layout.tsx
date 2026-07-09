import type { Metadata } from "next";
import { Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  title: "BurryApp — See your real Hard Rock P&L",
  description:
    "Drop in your Hard Rock Bet export and instantly see your all-time betting stats: total wagered, profit/loss, records, and charts. Graded instantly in your browser — no account needed.",
  openGraph: {
    title: "BurryApp — See your real Hard Rock P&L",
    description:
      "Drop in your Hard Rock Bet export and instantly see your all-time betting stats. No account needed.",
    type: "website",
    siteName: "BurryApp",
  },
  twitter: {
    card: "summary_large_image",
    title: "BurryApp — See your real Hard Rock P&L",
    description:
      "Drop in your Hard Rock Bet export and instantly see your all-time betting stats. No account needed.",
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
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
