'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScanQRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [recentAttendances, setRecentAttendances] = useState([]);
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    // Check if user is authenticated and is a student
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'student') {
      router.push('/admin-panel');
    } else if (status === 'authenticated' && session?.user?.role === 'student') {
      fetchRecentAttendances();
      setLoading(false);
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
  }, [status, session, router]);

  const fetchRecentAttendances = async () => {
    try {
      // Get today's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get attendances for today
      const response = await fetch(`/api/attendance?startDate=${todayStr}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Error al obtener los registros de asistencia');
      }

      setRecentAttendances(data);
    } catch (error) {
      console.error('Error fetching recent attendances:', error);
      setError('Error al cargar los registros de asistencia recientes.');
    }
  };

  useEffect(() => {
    if (!loading && session && !scannerStarted) {
      initScanner();
    }
  }, [loading, session, scannerStarted]);

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
          // Parse QR data
          const qrData = JSON.parse(decodedText);
          
          // Validate QR data has required fields
          if (!qrData.sessionId || !qrData.qrCode || !qrData.classId) {
            setScannerError('QR inválido. Formato incorrecto.');
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
              sessionId: qrData.sessionId,
              qrCode: qrData.qrCode,
              // Optional: send location data for validation
              location: getCurrentLocation()
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al registrar asistencia');
          }

          // Show success message
          setSuccess('¡Asistencia registrada con éxito!');
          
          // Refresh attendance list
          fetchRecentAttendances();
          
          // Hide success message after 5 seconds
          setTimeout(() => setSuccess(''), 5000);
          
        } catch (error) {
          console.error('Error processing QR code:', error);
          setScannerError(error.message || 'Error al procesar el código QR.');
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
  
  // Helper function to get current location (if available)
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        },
        (error) => {
          console.error('Error getting location:', error);
          return null;
        }
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-primary">
        <p>Cargando escáner...</p>
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
          <h1 className="text-3xl font-bold text-primary">Escanear código QR</h1>
          <p className="text-gray-400 mt-1">Registra tu asistencia a clase escaneando el código QR del profesor</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* QR Scanner */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Escanear Código QR</h2>
          
          <div className="text-center">
            {scannerError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {scannerError}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {success}
              </div>
            )}
            
            <div 
              id="qr-reader" 
              ref={scannerRef} 
              className="mx-auto max-w-[500px]"
            ></div>
            
            <p className="text-sm text-gray-500 mt-4">
              Apunta la cámara al código QR mostrado por tu profesor para registrar tu asistencia.
            </p>
          </div>
        </div>
        
        {/* Recent Attendances */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Asistencias Recientes ({recentAttendances.length})
          </h2>
          
          {recentAttendances.length === 0 ? (
            <div className="text-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p className="text-gray-500">No hay registros de asistencia hoy.</p>
              <p className="text-gray-400 text-sm mt-2">Escanea un código QR para registrar tu asistencia.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Clase</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sesión</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentAttendances.map((attendance) => (
                    <tr key={attendance._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {attendance.class.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {attendance.session?.title || 'Sesión normal'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatDate(attendance.scanTime || attendance.date)}
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