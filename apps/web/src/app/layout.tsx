import type { Metadata, Viewport } from "next";
import { AppProviders } from "./app-providers";
import { Header } from "@/shared/layout/header";
import { Footer } from "@/shared/layout/footer";
import "./globals.css";
export const metadata: Metadata = {
  title: "BrewLite | Đặt nước thật dễ",
  description:
    "BrewLite – đặt cà phê, trà và thức uống yêu thích, thanh toán không tiền mặt và nhận tại quầy.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#7b452f" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>
          <Header />
          <main className="main-content">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
