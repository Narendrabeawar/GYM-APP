import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const satoshi = localFont({
  src: [
    {
      path: "../../public/Fonts/TTF/Satoshi-Variable.ttf",
      style: "normal",
    },
    {
      path: "../../public/Fonts/TTF/Satoshi-VariableItalic.ttf",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gymzi - Modern Gym Management System",
  description: "Manage your gym with ease using Gymzi - Complete gym management solution with member tracking, payments, and analytics.",
  keywords: ["gym management", "fitness", "gym software", "member management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
