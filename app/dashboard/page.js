'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session.user.role === 'teacher') {
        router.push('/admin-panel');
      } else {
        fetchClasses();
      }
    }
  }, [status, session, router]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
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
      <div className="container mx-auto px-4 py-12 text-center text-primary">
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="p-4 bg-red-900 border border-red-600 text-red-300 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bienvenido, {session?.user?.name}</p>
        </div>
        
        <div className="flex gap-4">
          <Link
            href="/dashboard/join-class"
            className="bg-green-600 text-white py-3 px-6 rounded shadow-md hover:bg-green-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              <line x1="9" y1="7" x2="9" y2="7" stroke-width="3"></line>
              <line x1="6" y1="7" x2="12" y2="7" stroke-width="3"></line>
            </svg>
            Unirse a clase
          </Link>
          
          <Link
            href="/dashboard/scan"
            className="bg-primary text-white py-3 px-6 rounded shadow-md hover:bg-blue-600 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="8" y="8" width="3" height="3"></rect>
              <rect x="13" y="8" width="3" height="3"></rect>
              <rect x="8" y="13" width="3" height="3"></rect>
              <rect x="13" y="13" width="3" height="3"></rect>
            </svg>
            Escanear QR
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Mis clases</h2>
        
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p className="text-gray-500 mb-2">No estás inscrito en ninguna clase todavía.</p>
            <p className="text-gray-400 text-sm mb-4">
              Puedes unirte a una clase existente utilizando el código proporcionado por tu profesor.
            </p>
            <Link
              href="/dashboard/join-class"
              className="inline-flex items-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="16" y1="11" x2="22" y2="11"></line>
              </svg>
              Unirse a una clase
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem._id} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">{classItem.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-2">
                    Profesor: {classItem.teacher?.name || 'No asignado'}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    {classItem.description || 'Sin descripción'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {classItem.students?.length || 0} estudiantes
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/scan?classId=${classItem._id}`}
                        className="text-primary hover:underline flex items-center text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <rect x="8" y="8" width="3" height="3"></rect>
                          <rect x="13" y="8" width="3" height="3"></rect>
                          <rect x="8" y="13" width="3" height="3"></rect>
                          <rect x="13" y="13" width="3" height="3"></rect>
                        </svg>
                        Escanear
                      </Link>
                      <Link
                        href={`/dashboard/attendance/${classItem._id}`}
                        className="text-primary hover:underline flex items-center text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Asistencias
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Asistencia reciente</h2>
        
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M9 14l2 2 4-4"></path>
          </svg>
          <p className="text-gray-500 mb-2">
            Para registrar tu asistencia, usa el botón "Escanear QR de asistencia"
          </p>
          <p className="text-gray-400 text-sm">
            Escanea el código QR que tu profesor muestra en clase para registrar tu asistencia
          </p>
          
          <Link
            href="/dashboard/scan"
            className="mt-6 inline-flex items-center bg-primary text-white py-2 px-6 rounded shadow-md hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="8" y="8" width="3" height="3"></rect>
              <rect x="13" y="8" width="3" height="3"></rect>
              <rect x="8" y="13" width="3" height="3"></rect>
              <rect x="13" y="13" width="3" height="3"></rect>
            </svg>
            Ir a escanear QR
          </Link>
        </div>
      </div>
    </div>
  );
} 