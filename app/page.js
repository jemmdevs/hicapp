'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState(null);
  const router = useRouter();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'student') {
      router.push('/auth/register');
    } else if (role === 'teacher') {
      router.push('/auth/login');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-black rounded shadow-lg overflow-hidden border border-green-500">
        <div className="bg-black text-green-400 p-6 text-center">
          <h2 className="text-3xl font-bold mb-2">Bienvenido a HicApp</h2>
          <p className="text-green-300">Sistema de seguimiento de asistencia mediante códigos QR</p>
        </div>
        
        <div className="p-6 bg-black text-white">
          <h3 className="text-xl font-semibold mb-4 text-center text-green-400">Selecciona tu rol</h3>
          
          <div className="grid grid-cols-1 gap-6 md-grid-cols-2">
            <button
              onClick={() => handleRoleSelect('student')}
              className={`p-6 border rounded text-center transition-all ${
                selectedRole === 'student'
                  ? 'bg-green-900 border-green-500'
                  : 'hover-bg-gray-900 border-gray-800'
              }`}
            >
              <div className="text-4xl mb-2">👨‍🎓</div>
              <h4 className="text-lg font-medium mb-1 text-green-400">Estudiante</h4>
              <p className="text-sm text-gray-300">Unirse a clases y registrar asistencia</p>
            </button>

            <button
              onClick={() => handleRoleSelect('teacher')}
              className={`p-6 border rounded text-center transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-green-900 border-green-500'
                  : 'hover-bg-gray-900 border-gray-800'
              }`}
            >
              <div className="text-4xl mb-2">👨‍🏫</div>
              <h4 className="text-lg font-medium mb-1 text-green-400">Profesor</h4>
              <p className="text-sm text-gray-300">Crear clases y ver asistencia</p>
            </button>
          </div>

          <div className="mt-8 text-center text-gray-300 text-sm">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-green-400 hover-underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
