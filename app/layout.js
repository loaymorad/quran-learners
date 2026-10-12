import { Amiri_Quran, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const quran = Amiri_Quran({ subsets: ["arabic"], weight: "400", variable: "--font-quran" });
const ui = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-ui" });

export const metadata = { title: "تعلّم القراءة — المنشاوي", description: "كرّر الآيات بصوت الشيخ المنشاوي لتتعلم القراءة" };

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${quran.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
