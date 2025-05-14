'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SessionAttendancePage({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionData, setSessionData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated and is a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session?.user?.role === 'teacher') {
      fetchData();
    }
  }, [status, session, router, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get session data
      const sessionResponse = await fetch(`/api/class-sessions/${id}`);
      const sessionResult = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(sessionResult.message || 'Error al obtener los datos de la sesión');
      }

      setSessionData(sessionResult);

      // Get attendance records for this session
      const attendanceResponse = await fetch(`/api/attendance?sessionId=${id}`);
      const attendanceData = await attendanceResponse.json();

      if (!attendanceResponse.ok) {
        throw new Error(attendanceData.message || 'Error al obtener los registros de asistencia');
      }

      setAttendanceRecords(attendanceData);

      // Get class details including all students
      if (sessionResult.class && sessionResult.class._id) {
        const classResponse = await fetch(`/api/classes/${sessionResult.class._id}`);
        const classData = await classResponse.json();

        if (!classResponse.ok) {
          throw new Error(classData.message || 'Error al obtener los datos de la clase');
        }

        setAllStudents(classData.students || []);
      }
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Error al cargar los datos de asistencia. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
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
        <button
          onClick={() => router.push('/admin-panel/sessions')}
          className="mt-4 text-primary hover:underline"
        >
          Volver a sesiones
        </button>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-primary">No se encontró la sesión</p>
        <button
          onClick={() => router.push('/admin-panel/sessions')}
          className="mt-4 text-primary hover:underline"
        >
          Volver a sesiones
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Asistencia a la Sesión</h1>
          <p className="text-gray-400 mt-1">
            {sessionData.class?.name} - {sessionData.title}
          </p>
          <p className="text-gray-500 text-sm">
            Fecha: {formatDate(sessionData.startTime)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin-panel/quick-qr/${sessionData.class?._id}`}
            className="bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="8" y="8" width="3" height="3"></rect>
              <rect x="13" y="8" width="3" height="3"></rect>
              <rect x="8" y="13" width="3" height="3"></rect>
              <rect x="13" y="13" width="3" height="3"></rect>
            </svg>
            Mostrar QR
          </Link>
          <Link
            href="/admin-panel/sessions"
            className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Lista de asistencia ({allStudents.length} alumnos)
          </h2>
          <div className="flex items-center text-gray-600">
            <span className={`inline-flex h-3 w-3 rounded-full mr-2 ${
              sessionData.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
            }`}></span>
            {sessionData.status === 'active' ? 'Sesión activa' : 'Sesión finalizada'}
          </div>
        </div>
        
        {allStudents.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p className="text-gray-500 mb-2">No hay alumnos inscritos en esta clase.</p>
            <p className="text-gray-400 text-sm">
              Añade alumnos a la clase para poder registrar su asistencia.
            </p>
            <Link
              href={`/admin-panel/class/${sessionData.class?._id}`}
              className="mt-4 inline-flex items-center bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Ver detalles de clase
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 text-blue-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Se muestra la lista completa de alumnos en esta clase. Han asistido {attendanceRecords.filter(r => r.present).length} de {allStudents.length} alumnos ({Math.round((attendanceRecords.filter(r => r.present).length / allStudents.length) * 100) || 0}%).
                  </p>
                </div>
              </div>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Hora de registro
                  </th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudents.map((student) => {
                  // Check if student has attendance record
                  const attendanceRecord = attendanceRecords.find(
                    record => record.student?._id === student._id
                  );
                  const hasAttended = !!attendanceRecord;
                  
                  return (
                    <tr key={student._id} className={`hover:bg-gray-50 ${hasAttended ? '' : 'bg-gray-50'}`}>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500 text-center">
                        {hasAttended ? formatDate(attendanceRecord.scanTime || attendanceRecord.date) : '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          hasAttended 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {hasAttended ? 'Presente' : 'Ausente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 