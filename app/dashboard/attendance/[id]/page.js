'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AttendanceHistoryPage({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated and is a student
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'student') {
      router.push('/admin-panel');
    } else if (status === 'authenticated' && session?.user?.role === 'student') {
      fetchData();
    }
  }, [status, session, router, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get class data
      const classResponse = await fetch(`/api/classes/${id}`);
      const classResult = await classResponse.json();

      if (!classResponse.ok) {
        throw new Error(classResult.message || 'Error al obtener los datos de la clase');
      }

      setClassData(classResult);

      // Get all attendance records for this class (without date filtering)
      const attendanceResponse = await fetch(`/api/attendance?classId=${id}`);
      const attendanceData = await attendanceResponse.json();

      if (!attendanceResponse.ok) {
        throw new Error(attendanceData.message || 'Error al obtener los registros de asistencia');
      }

      // Group attendance records by date
      const groupedAttendance = groupAttendanceByDate(attendanceData);
      setAttendanceHistory(groupedAttendance);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Error al cargar los datos de asistencia. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Group attendance records by date
  const groupAttendanceByDate = (attendanceRecords) => {
    const groupedData = {};
    
    // Sort records by date (newest first)
    const sortedRecords = [...attendanceRecords].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Group by date
    sortedRecords.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      if (!groupedData[date]) {
        groupedData[date] = [];
      }
      
      groupedData[date].push(record);
    });
    
    // Convert to array format for easier rendering
    return Object.entries(groupedData).map(([date, records]) => ({
      date,
      records
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full'
    }).format(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
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
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-primary hover:underline"
        >
          Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Historial de Asistencia
          </h1>
          {classData && (
            <p className="text-gray-400 mt-1">{classData.name}</p>
          )}
        </div>
        <div>
          <Link
            href="/dashboard"
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        {attendanceHistory.length === 0 ? (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className="text-gray-500">No hay registros de asistencia en esta clase.</p>
            <p className="text-gray-400 text-sm mt-2">Escanea un código QR para registrar tu asistencia.</p>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-blue-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Has asistido a {attendanceHistory.length} {attendanceHistory.length === 1 ? 'clase' : 'clases'} en total.
                  </p>
                </div>
              </div>
            </div>

            {attendanceHistory.map((dateGroup) => (
              <div key={dateGroup.date} className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 pb-2 border-b border-gray-200 mb-4">
                  {formatDate(dateGroup.date)}
                </h3>
                <div className="space-y-4">
                  {dateGroup.records.map((record) => (
                    <div key={record._id} className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">
                          {record.session?.title || 'Sesión regular'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Profesor: {classData.teacher?.name || 'No asignado'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Presente
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatTime(record.scanTime || record.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 