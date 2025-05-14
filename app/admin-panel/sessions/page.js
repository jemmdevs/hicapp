'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    classId: '',
    status: ''
  });

  useEffect(() => {
    // Check if user is authenticated and is a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session?.user?.role === 'teacher') {
      fetchClasses();
      fetchSessions();
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
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let url = '/api/class-sessions';
      const params = new URLSearchParams();
      
      if (filter.classId) params.append('classId', filter.classId);
      if (filter.status) params.append('status', filter.status);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener las sesiones');
      }

      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Error al cargar las sesiones. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchSessions();
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-gray-900 text-gray-300';
      case 'active': return 'bg-green-900 text-green-300';
      case 'ended': return 'bg-blue-900 text-blue-300';
      case 'cancelled': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'scheduled': return 'Programada';
      case 'active': return 'Activa';
      case 'ended': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (loading && status !== 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-primary">
        <p>Cargando sesiones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="p-4 bg-red-900 border border-red-600 text-red-300 rounded">
          {error}
        </div>
        <button
          onClick={() => router.push('/admin-panel')}
          className="mt-4 text-primary hover-underline"
        >
          Volver al panel de administración
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Sesiones de Clase</h1>
          <p className="text-gray-400 mt-1">Programa y gestiona las sesiones para tus clases</p>
        </div>
        <div>
          <Link
            href="/admin-panel/sessions/new"
            className="bg-primary text-white py-2 px-4 rounded hover-bg-green-700 transition-colors inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Nueva Sesión
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-100 rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="classId" className="block text-sm font-medium text-primary mb-2">
              Clase
            </label>
            <select
              id="classId"
              name="classId"
              value={filter.classId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded shadow-sm"
            >
              <option value="">Todas las clases</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="status" className="block text-sm font-medium text-primary mb-2">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded shadow-sm"
            >
              <option value="">Todos los estados</option>
              <option value="scheduled">Programadas</option>
              <option value="active">Activas</option>
              <option value="ended">Finalizadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="bg-primary text-white py-2 px-6 rounded hover-bg-green-700 transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Lista de sesiones */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h2 className="text-xl font-semibold mb-2 text-gray-700">No hay sesiones</h2>
          <p className="text-gray-500 mb-4">No se encontraron sesiones con los filtros seleccionados.</p>
          <Link 
            href="/admin-panel/sessions/new" 
            className="bg-primary text-white py-2 px-4 rounded hover-bg-green-700 transition-colors inline-flex items-center"
          >
            Crear nueva sesión
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden shadow-md rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-6 text-left">Sesión</th>
                <th className="py-3 px-6 text-left">Clase</th>
                <th className="py-3 px-6 text-left">Fecha y hora</th>
                <th className="py-3 px-6 text-center">Estado</th>
                <th className="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white">
              {sessions.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{session.title}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {session.class.name}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {formatDate(session.startTime)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(session.status)}`}>
                      {getStatusText(session.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        href={`/admin-panel/sessions/${session._id}`}
                        className="text-primary hover:underline"
                        title="Ver detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </Link>
                      
                      {session.status === 'active' && (
                        <Link
                          href={`/admin-panel/sessions/${session._id}/qr`}
                          className="text-green-600 hover:underline"
                          title="Generar QR"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <rect x="8" y="8" width="3" height="3"></rect>
                            <rect x="13" y="8" width="3" height="3"></rect>
                            <rect x="8" y="13" width="3" height="3"></rect>
                            <rect x="13" y="13" width="3" height="3"></rect>
                          </svg>
                        </Link>
                      )}
                      
                      {session.status === 'active' && (
                        <Link
                          href={`/admin-panel/sessions/${session._id}/attendance`}
                          className="text-blue-600 hover:underline"
                          title="Ver asistencia"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            <path d="M9 14l2 2 4-4"></path>
                          </svg>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 