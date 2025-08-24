import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Recruito",
  description: "Recruito – Revolutionize Your Hiring Process with Recruito AI. Your fully automated hiring assistant that sources, screens, and interviews candidates effortlessly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* <SupabaseProvider> */}
        {children}
        {/* </SupabaseProvider> */}
      </body>
    </html>
  );
}
