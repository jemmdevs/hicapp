'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ClassDetails({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // Check if user is authenticated and is a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session?.user?.role === 'teacher') {
      fetchClassData();
    }
  }, [status, session, router, id]);

  const fetchClassData = async () => {
    try {
      // Get class data
      const classResponse = await fetch(`/api/classes/${id}`);
      const classResult = await classResponse.json();

      if (!classResponse.ok) {
        throw new Error(classResult.message || 'Error al obtener los datos de la clase');
      }

      setClassData(classResult);
      setStudents(classResult.students || []);

      // Get attendance stats
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
      
      const attendanceResponse = await fetch(`/api/attendance?classId=${id}&startDate=${startDate.toISOString()}`);
      const attendanceData = await attendanceResponse.json();

      if (!attendanceResponse.ok) {
        throw new Error('Error al obtener las estadísticas de asistencia');
      }

      // Calculate attendance statistics
      calculateAttendanceStats(attendanceData, classResult.students);
      
      // Get all attendance records to display history
      const allAttendanceResponse = await fetch(`/api/attendance?classId=${id}`);
      const allAttendanceData = await allAttendanceResponse.json();
      
      if (!allAttendanceResponse.ok) {
        throw new Error('Error al obtener el historial de asistencia');
      }
      
      // Group attendance by date
      const groupedAttendance = groupAttendanceByDate(allAttendanceData);
      setAttendanceHistory(groupedAttendance);
      
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error al cargar los datos de la clase. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (attendanceData, students) => {
    if (!attendanceData.length || !students.length) {
      setAttendanceStats({
        attendanceRate: 0,
        totalSessions: 0,
        studentStats: []
      });
      return;
    }

    // Get unique dates (class sessions)
    const sessions = [...new Set(attendanceData.map(record => 
      new Date(record.date).toDateString()
    ))];

    // Calculate stats per student
    const studentStats = students.map(student => {
      const studentId = student._id.toString();
      const studentAttendance = attendanceData.filter(record => 
        record.student._id === studentId && record.present
      );
      
      return {
        studentId,
        name: student.name,
        email: student.email,
        attendedSessions: studentAttendance.length,
        attendanceRate: sessions.length ? (studentAttendance.length / sessions.length) * 100 : 0
      };
    });

    // Calculate overall attendance rate
    const totalAttendances = attendanceData.filter(record => record.present).length;
    const totalPossibleAttendances = sessions.length * students.length;
    const attendanceRate = totalPossibleAttendances > 0 
      ? (totalAttendances / totalPossibleAttendances) * 100 
      : 0;

    setAttendanceStats({
      attendanceRate,
      totalSessions: sessions.length,
      studentStats
    });
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
        groupedData[date] = {
          date,
          records: [],
          presentCount: 0,
          totalCount: students.length
        };
      }
      
      groupedData[date].records.push(record);
      
      if (record.present) {
        groupedData[date].presentCount++;
      }
    });
    
    // Convert to array format for easier rendering
    return Object.values(groupedData);
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
  
  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };
  
  // Filter attendance history by date
  const filteredAttendanceHistory = dateFilter
    ? attendanceHistory.filter(group => group.date === dateFilter)
    : attendanceHistory;

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este estudiante de la clase?')) {
      return;
    }

    try {
      const response = await fetch(`/api/classes/${id}/students/${studentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar al estudiante');
      }

      // Update the local state
      setStudents(students.filter(student => student._id !== studentId));
      
      // Refresh class data
      fetchClassData();
    } catch (error) {
      console.error('Error removing student:', error);
      setError(error.message || 'Error al eliminar al estudiante');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-green-400">
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
          onClick={() => router.push('/admin-panel')}
          className="mt-4 text-green-400 hover:underline"
        >
          Volver al panel de administración
        </button>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-green-400">No se encontró la clase</p>
        <button
          onClick={() => router.push('/admin-panel')}
          className="mt-4 text-green-400 hover:underline"
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
          <h1 className="text-3xl font-bold text-green-400">{classData.name}</h1>
          {classData.description && (
            <p className="text-gray-400 mt-1">{classData.description}</p>
          )}
        </div>
        <div className="flex gap-4">
          <Link
            href={`/admin-panel/quick-qr/${id}`}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Generar QR de asistencia
          </Link>
          <Link
            href="/admin-panel"
            className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Class information */}
        <div className="bg-black rounded-lg shadow-lg p-6 border border-green-800">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Información de la Clase</h2>
          
          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Código de la clase:</span>
              <div className="text-lg font-semibold text-green-400">{classData.code}</div>
              <p className="text-sm text-gray-400">Comparte este código con los estudiantes para que puedan unirse a la clase.</p>
            </div>
            
            <div>
              <span className="text-gray-400">Creada el:</span>
              <div className="text-white">{new Date(classData.createdAt).toLocaleDateString()}</div>
            </div>
            
            {attendanceStats && (
              <div>
                <span className="text-gray-400">Tasa de asistencia:</span>
                <div className="flex items-center">
                  <div className="text-lg font-semibold text-green-400">
                    {attendanceStats.attendanceRate.toFixed(1)}%
                  </div>
                  <span className="text-sm text-gray-400 ml-2">
                    ({attendanceStats.totalSessions} sesiones este mes)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Students */}
        <div className="bg-black rounded-lg shadow-lg p-6 border border-green-800">
          <h2 className="text-xl font-semibold mb-4 text-green-400">
            Estudiantes ({students.length})
          </h2>
          
          {students.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400">No hay estudiantes inscritos en esta clase.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-green-400 uppercase tracking-wider">Asistencia</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-green-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map((student) => {
                    const stats = attendanceStats?.studentStats.find(s => s.studentId === student._id);
                    
                    return (
                      <tr key={student._id}>
                        <td className="px-4 py-3 whitespace-nowrap text-white">{student.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white">{student.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-white">
                          {stats ? `${stats.attendanceRate.toFixed(0)}%` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleRemoveStudent(student._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
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
      
      {/* Attendance History Section */}
      <div className="mt-8 bg-black rounded-lg shadow-lg p-6 border border-green-800">
        <h2 className="text-xl font-semibold mb-4 text-green-400">Historial de Asistencia</h2>
        
        {/* Date filter */}
        <div className="mb-6">
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-400 mb-2">
            Filtrar por fecha:
          </label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={handleDateFilterChange}
            className="bg-gray-900 text-white border border-green-800 rounded-md px-3 py-2 w-full max-w-xs"
          >
            <option value="">Todas las fechas</option>
            {attendanceHistory.map(group => (
              <option key={group.date} value={group.date}>
                {formatDate(group.date)} ({group.presentCount}/{group.totalCount} asistencias)
              </option>
            ))}
          </select>
        </div>
        
        {filteredAttendanceHistory.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400">No hay registros de asistencia para esta clase.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAttendanceHistory.map((dateGroup) => (
              <div key={dateGroup.date} className="border-b border-green-800 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-medium text-green-400 mb-4">
                  {formatDate(dateGroup.date)}
                  <span className="ml-2 text-sm text-gray-400">
                    ({dateGroup.presentCount}/{dateGroup.totalCount} asistencias)
                  </span>
                </h3>
                
                <div className="overflow-auto max-h-80">
                  <table className="min-w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Estudiante</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-green-400 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-green-400 uppercase tracking-wider">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {students.map((student) => {
                        // Find if student has an attendance record for this date
                        const record = dateGroup.records.find(r => 
                          r.student._id === student._id
                        );
                        const isPresent = !!record;
                        
                        return (
                          <tr key={student._id}>
                            <td className="px-4 py-3 whitespace-nowrap text-white">{student.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-white">{student.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                isPresent 
                                  ? 'bg-green-900 text-green-300' 
                                  : 'bg-red-900 text-red-300'
                              }`}>
                                {isPresent ? 'Presente' : 'Ausente'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-white">
                              {isPresent ? formatTime(record.scanTime || record.date) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-right">
                  <Link
                    href={`/admin-panel/attendance/${id}?date=${dateGroup.date}`}
                    className="inline-flex items-center text-green-400 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Gestionar asistencia
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