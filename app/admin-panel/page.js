'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated and is a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session?.user?.role === 'teacher') {
      // Fetch classes created by this teacher
      fetchClasses();
    }
  }, [status, session, router]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes/teacher');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener las clases');
      }

      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Error al cargar las clases. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container text-center p-6 text-green-400">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container p-4 my-4">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold text-green-400">Panel de Profesor</h1>
        <Link
          href="/admin-panel/create-class"
          className="bg-green-600 hover-bg-green-700 text-white py-2 px-4 rounded transition-colors"
        >
          Crear nueva clase
        </Link>
      </div>

      {error && (
        <div className="p-4 my-4 rounded bg-red-900 text-red-300 border border-red-600">
          {error}
        </div>
      )}

      <div className="bg-black border border-green-800 rounded shadow-lg p-6 my-4">
        <h2 className="text-xl font-bold my-2 text-green-400">Mis Clases</h2>

        {classes.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-400">
              No has creado ninguna clase todavía. Haz clic en "Crear nueva clase" para comenzar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 my-4">
            {classes.map((classItem) => (
              <div key={classItem._id} className="bg-gray-900 border border-green-900 rounded p-4">
                <h3 className="text-lg font-bold text-green-400">{classItem.name}</h3>
                <p className="my-2 text-gray-400">{classItem.description}</p>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Estudiantes: {classItem.students.length}</span>
                  <span>Código: {classItem.code}</span>
                </div>
                <div className="mt-4 pt-3 flex justify-between border-t border-green-900">
                  <Link
                    href={`/admin-panel/class/${classItem._id}`}
                    className="text-green-400 hover-underline"
                  >
                    Ver detalles
                  </Link>
                  <Link
                    href={`/admin-panel/quick-qr/${classItem._id}`}
                    className="text-green-400 hover-underline"
                  >
                    Generar QR
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 