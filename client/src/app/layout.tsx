import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProcastiNot - Stop Procrastinating with Money on the Line",
  description: "Stake money on your goals. Succeed and get rewards. Fail and lose your stake. No excuses. No delays. On Starknet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${dmSans.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
