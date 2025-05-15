'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";
import { useSession, signOut } from 'next-auth/react';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "HicApp - Seguimiento de Asistencia",
  description: "Aplicación para seguimiento de asistencia mediante códigos QR",
};

export default function RootLayout({ children }) {
  const { data: session, status } = useSession();
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
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
                
                {status === 'authenticated' && (
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 hidden sm:inline-block">
                      {session.user.name}
                    </span>
                    <button 
                      onClick={handleSignOut}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Salir
                    </button>
                  </div>
                )}
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
