import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Flightdip — ค้นหาตั๋วเครื่องบินราคาถูก",
  description: "เปรียบเทียบราคาตั๋วเครื่องบินไป-กลับ หาวันและปลายทางที่ราคาดีที่สุดสำหรับคุณ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className={`min-h-full flex flex-col font-sans`}>
        {children}
        <Script
          id="travelpayouts-drive"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.src = 'https://emrld.ltd/NTM4Mjk5.js?t=538299';
  document.head.appendChild(script);
})();`
          }}
        />
      </body>
    </html>
  );
}
