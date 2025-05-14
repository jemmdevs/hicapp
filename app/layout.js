import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
            <header className="bg-black text-green-400 p-4 border-b border-green-500">
              <div className="container flex justify-between items-center">
                <h1 className="text-2xl font-bold">HicApp</h1>
              </div>
            </header>
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-black p-4 text-center text-green-400 border-t border-green-900">
              <p>© {new Date().getFullYear()} HicApp - Aplicación de Seguimiento de Asistencia</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
