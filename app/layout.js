import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";

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
            <header className="bg-black p-4 border-b border-gray-800 shadow-md">
              <div className="container flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-primary rounded-full p-2 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-primary">HicApp</h1>
                </Link>
              </div>
            </header>
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <footer className="bg-gray-900 p-6 text-center border-t border-gray-800">
              <div className="container mx-auto">
                <div className="flex flex-col items-center mb-4">
                  <Link href="/" className="flex items-center gap-2 mb-4">
                    <div className="bg-primary rounded-full p-2 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-primary">HicApp</span>
                  </Link>
                  <p className="text-gray-400 mb-2">Sistema de seguimiento de asistencia mediante códigos QR</p>
                </div>
                <p className="text-gray-500">© {new Date().getFullYear()} HicApp - Todos los derechos reservados</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
