import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "HicApp - Seguimiento de Asistencia",
  description: "Aplicación para seguimiento de asistencia mediante códigos QR",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} bg-black text-white`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
