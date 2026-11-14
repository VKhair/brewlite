
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewLite | Coffee & Tea",
  description: "Đặt cà phê và trà trực tuyến cùng BrewLite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
