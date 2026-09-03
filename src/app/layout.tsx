import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBT PRO — Professional Computer-Based Testing Platform",
  description:
    "Create, manage and take secure computer-based examinations with real-time timing, automatic marking and detailed results.",
  keywords: "CBT, computer-based testing, examination, JAMB, Nigeria, online exam",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
