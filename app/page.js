'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redireccionar automáticamente si hay una sesión activa
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role === 'teacher') {
        router.push('/admin-panel');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'student') {
      router.push('/auth/register');
    } else if (role === 'teacher') {
      router.push('/auth/login');
    }
  };

  // Si el estado está cargando, mostrar un loader
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-primary">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex-grow flex flex-col justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">Bienvenido a HicApp</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Sistema inteligente de seguimiento de asistencia mediante códigos QR para entornos educativos
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto bg-black rounded shadow-lg overflow-hidden border border-gray-800 p-6">
        <h2 className="text-2xl font-bold mb-8 text-center text-white">Selecciona cómo deseas acceder</h2>
        
        <div className="grid grid-cols-1 gap-8 md-grid-cols-2 mb-8">
          <div 
            onClick={() => handleRoleSelect('student')}
            className={`p-8 border rounded shadow-md cursor-pointer transition-all flex flex-col items-center ${
              selectedRole === 'student'
                ? 'bg-primary bg-opacity-10 border-primary'
                : 'border-gray-800 hover-bg-gray-900'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-primary">Estudiante</h3>
            <p className="text-gray-400 text-center">Únete a clases y registra tu asistencia mediante códigos QR personalizados</p>
            
            <button 
              className="mt-6 py-2 px-6 bg-primary text-white rounded hover-bg-green-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRoleSelect('student');
              }}
            >
              Registrate como estudiante
            </button>
          </div>

          <div 
            onClick={() => handleRoleSelect('teacher')}
            className={`p-8 border rounded shadow-md cursor-pointer transition-all flex flex-col items-center ${
              selectedRole === 'teacher'
                ? 'bg-primary bg-opacity-10 border-primary'
                : 'border-gray-800 hover-bg-gray-900'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"></path>
                <circle cx="12" cy="10" r="2"></circle>
                <path d="M12 14v4"></path>
                <path d="M12 4v4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-primary">Profesor</h3>
            <p className="text-gray-400 text-center">Crea y gestiona clases, monitorea la asistencia de tus estudiantes en tiempo real</p>

            <button 
              className="mt-6 py-2 px-6 bg-primary text-white rounded hover-bg-green-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleRoleSelect('teacher');
              }}
            >
              Ingresar como profesor
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-primary hover-underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
