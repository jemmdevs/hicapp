'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AttendanceScanner({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    // Check if user is authenticated and is a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session?.user?.role === 'teacher') {
      fetchClassData();
    }

    // Cleanup scanner on unmount
    return () => {
      if (html5QrcodeScannerRef.current) {
        try {
          html5QrcodeScannerRef.current.clear();
        } catch (error) {
          console.error('Error clearing scanner:', error);
        }
      }
    };
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

      // Get today's attendance
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const attendanceResponse = await fetch(
        `/api/attendance?classId=${id}&startDate=${todayStr}&endDate=${todayStr}`
      );
      
      const attendanceData = await attendanceResponse.json();

      if (!attendanceResponse.ok) {
        throw new Error('Error al obtener los datos de asistencia');
      }

      setAttendanceList(attendanceData);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error al cargar los datos de la clase. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const initScanner = () => {
    if (!scannerRef.current || scannerStarted) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    try {
      const scanner = new Html5QrcodeScanner('qr-reader', config, false);
      
      const successCallback = async (decodedText) => {
        try {
          const qrData = JSON.parse(decodedText);
          
          // Validate QR data
          if (!qrData.studentId || !qrData.classId || qrData.classId !== id) {
            setScannerError('QR inválido. No corresponde a esta clase.');
            setTimeout(() => setScannerError(''), 3000);
            return;
          }

          // Check if the student is in this class
          const student = classData.students.find(s => s._id === qrData.studentId);
          if (!student) {
            setScannerError('El estudiante no está inscrito en esta clase.');
            setTimeout(() => setScannerError(''), 3000);
            return;
          }

          // Check if attendance already registered
          const alreadyRegistered = attendanceList.some(a => 
            a.student._id === qrData.studentId && a.present
          );

          if (alreadyRegistered) {
            setScannerError(`${student.name} ya registró su asistencia hoy.`);
            setTimeout(() => setScannerError(''), 3000);
            return;
          }

          // Register attendance
          const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              classId: id,
              studentId: qrData.studentId,
              date: new Date(),
              present: true,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al registrar asistencia');
          }

          // Add to local list
          setAttendanceList(prev => [...prev, {
            ...data.attendance,
            student: student,
          }]);

          // Show success message
          setSuccessMessage(`¡${student.name} registrado con éxito!`);
          setTimeout(() => setSuccessMessage(''), 3000);
          
        } catch (error) {
          console.error('Error processing QR code:', error);
          setScannerError('Error al procesar el código QR.');
          setTimeout(() => setScannerError(''), 3000);
        }
      };

      const errorCallback = (error) => {
        console.error('QR scan error:', error);
        // We don't need to show every scan error to the user
      };

      scanner.render(successCallback, errorCallback);
      html5QrcodeScannerRef.current = scanner;
      setScannerStarted(true);

    } catch (error) {
      console.error('Error initializing scanner:', error);
      setScannerError('Error al inicializar el escáner QR. Por favor, verifica que tu dispositivo tiene acceso a la cámara.');
    }
  };

  useEffect(() => {
    if (classData && !scannerStarted && !loading) {
      initScanner();
    }
  }, [classData, scannerStarted, loading]);

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
          <h1 className="text-3xl font-bold text-green-400">Registrar Asistencia</h1>
          <p className="text-gray-400 mt-1">{classData.name}</p>
        </div>
        <div>
          <Link
            href={`/admin-panel/class/${id}`}
            className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Volver a detalles de clase
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* QR Scanner */}
        <div className="bg-black rounded-lg shadow-lg p-6 border border-green-800">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Escanear Código QR</h2>
          
          <div className="text-center">
            {scannerError && (
              <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-300 rounded">
                {scannerError}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900 border border-green-600 text-green-300 rounded">
                {successMessage}
              </div>
            )}
            
            <div 
              id="qr-reader" 
              ref={scannerRef} 
              className="mx-auto max-w-[500px]"
            ></div>
            
            <p className="text-sm text-gray-400 mt-4">
              Pide a los estudiantes que muestren su código QR para registrar su asistencia.
            </p>
          </div>
        </div>
        
        {/* Attendance List */}
        <div className="bg-black rounded-lg shadow-lg p-6 border border-green-800">
          <h2 className="text-xl font-semibold mb-4 text-green-400">
            Asistencia de Hoy ({attendanceList.length} estudiantes)
          </h2>
          
          {attendanceList.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400">Ningún estudiante ha registrado asistencia aún.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-green-400 uppercase tracking-wider">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {attendanceList.map((attendance) => (
                    <tr key={attendance._id}>
                      <td className="px-4 py-3 whitespace-nowrap text-white">
                        {attendance.student.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white">
                        {attendance.student.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-white">
                        {new Date(attendance.createdAt || attendance.date).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 