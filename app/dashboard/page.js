'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated and is a student
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'student') {
      router.push('/admin-panel');
    } else if (status === 'authenticated' && session?.user?.role === 'student') {
      fetchClasses();
    }
  }, [status, session, router]);

  const fetchClasses = async () => {
    try {
      // Fetch enrolled classes
      const enrolledResponse = await fetch('/api/classes/student');
      const enrolledData = await enrolledResponse.json();

      if (!enrolledResponse.ok) {
        throw new Error(enrolledData.message || 'Error al obtener las clases inscritas');
      }

      // Fetch available classes that student can join
      const availableResponse = await fetch('/api/classes/available');
      const availableData = await availableResponse.json();

      if (!availableResponse.ok) {
        throw new Error(availableData.message || 'Error al obtener las clases disponibles');
      }

      setEnrolledClasses(enrolledData);
      setAvailableClasses(availableData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Error al cargar las clases. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (classId) => {
    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al unirse a la clase');
      }

      // Refresh the class lists
      fetchClasses();
    } catch (error) {
      console.error('Error joining class:', error);
      setError(error.message || 'Error al unirse a la clase');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-green-400">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-green-400">Mis Clases</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border border-red-600 text-red-300 rounded">
          {error}
        </div>
      )}

      <div className="bg-black rounded-lg shadow-lg p-6 mb-8 border border-green-800">
        <h2 className="text-xl font-semibold mb-4 text-green-400">Clases Inscritas</h2>

        {enrolledClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No estás inscrito en ninguna clase todavía. Únete a una clase de la lista de disponibles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {enrolledClasses.map((classItem) => (
              <div key={classItem._id} className="border border-green-900 bg-gray-900 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium mb-2 text-green-400">{classItem.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{classItem.description}</p>
                <div className="mt-4 pt-3 border-t border-green-900">
                  <Link
                    href={`/dashboard/class/${classItem._id}`}
                    className="text-green-400 hover:underline"
                  >
                    Generar código QR de asistencia
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-black rounded-lg shadow-lg p-6 border border-green-800">
        <h2 className="text-xl font-semibold mb-4 text-green-400">Clases Disponibles</h2>

        {availableClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No hay clases disponibles para unirse en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {availableClasses.map((classItem) => (
              <div key={classItem._id} className="border border-green-900 bg-gray-900 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium mb-2 text-green-400">{classItem.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{classItem.description}</p>
                <div className="mt-4 pt-3 border-t border-green-900">
                  <button
                    onClick={() => handleJoinClass(classItem._id)}
                    className="text-green-400 hover:underline"
                  >
                    Unirse a esta clase
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 