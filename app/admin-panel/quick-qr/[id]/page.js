'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import QRCode from 'qrcode.react';
import Link from 'next/link';

export default function QuickQRPage({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrSize, setQrSize] = useState(260);
  const [countdown, setCountdown] = useState(null);

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

  useEffect(() => {
    // Set QR size based on window width
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setQrSize(260);
      } else {
        setQrSize(320);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Countdown timer for QR expiration
    if (!sessionData || !sessionData.qrExpiration) return;

    const intervalId = setInterval(() => {
      const expDate = new Date(sessionData.qrExpiration);
      const now = new Date();
      const diff = expDate - now;

      if (diff <= 0) {
        setCountdown('QR expirado');
        clearInterval(intervalId);
        // Regenerate QR when expired
        createOrUpdateSession();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdown(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sessionData]);

  const fetchClassData = async () => {
    try {
      // Get class data
      const classResponse = await fetch(`/api/classes/${id}`);
      const classResult = await classResponse.json();

      if (!classResponse.ok) {
        throw new Error(classResult.message || 'Error al obtener los datos de la clase');
      }

      setClassData(classResult);
      
      // Now find or create an active session
      await createOrUpdateSession();
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error al cargar los datos de la clase. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const createOrUpdateSession = async () => {
    try {
      setLoading(true);
      
      // First, check if there's already an active session for this class
      const sessionsResponse = await fetch(`/api/class-sessions?classId=${id}&status=active`);
      const activeSessions = await sessionsResponse.json();
      
      if (activeSessions.length > 0) {
        // Use the most recent active session
        const latestSession = activeSessions[0];
        
        // Check if it has a valid QR code
        if (latestSession.qrCode && latestSession.qrExpiration && new Date(latestSession.qrExpiration) > new Date()) {
          setSessionData(latestSession);
          setLoading(false);
          return;
        }
        
        // If not valid, update the session with a new QR
        const updateResponse = await fetch(`/api/class-sessions/${latestSession._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            regenerateQR: true
          }),
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          throw new Error(updateData.message || 'Error al regenerar el código QR');
        }

        setSessionData(updateData.session);
      } else {
        // Create a new session
        const now = new Date();
        const sessionTitle = `Clase del ${now.toLocaleDateString()}`;
        
        const createResponse = await fetch('/api/class-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classId: id,
            title: sessionTitle,
            status: 'active',
            startTime: now,
            date: now
          }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          throw new Error(createData.message || 'Error al crear la sesión');
        }

        setSessionData(createData.session);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating/updating session:', error);
      setError('Error al generar el código QR. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const regenerateQR = async () => {
    try {
      setLoading(true);
      
      if (!sessionData || !sessionData._id) {
        await createOrUpdateSession();
        return;
      }
      
      const response = await fetch(`/api/class-sessions/${sessionData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regenerateQR: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al regenerar el código QR');
      }

      // Update the session data with the new QR
      setSessionData(data.session);
      setLoading(false);
    } catch (error) {
      console.error('Error regenerating QR:', error);
      setError('Error al regenerar el código QR. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const generateQRData = () => {
    if (!sessionData?._id || !sessionData?.qrCode) return '';
    
    // Crear un objeto que contenga la información necesaria
    const qrData = {
      sessionId: sessionData._id,
      qrCode: sessionData.qrCode,
      classId: sessionData.class || id,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-primary">
        <p>Generando código QR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="p-4 bg-red-900 border border-red-600 text-red-300 rounded">
          {error}
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/admin-panel')}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
          >
            Volver al panel
          </button>
          <button
            onClick={createOrUpdateSession}
            className="bg-primary text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!classData || !sessionData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-primary">No se encontró la clase o no se pudo generar una sesión</p>
        <button
          onClick={() => router.push('/admin-panel')}
          className="mt-4 text-primary hover:underline"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">{classData.name}</h2>
          <h3 className="text-xl">{sessionData.title || 'Sesión actual'}</h3>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg font-medium mb-2">
              QR de asistencia para escanear
            </p>
            <p className="text-gray-500 mb-2">
              Muestre este código QR a sus estudiantes para que lo escaneen
            </p>
            <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded mb-3">
              <strong>Instrucciones:</strong> Los estudiantes deben usar la opción "Escanear QR de asistencia" en su dashboard
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm font-medium">
                Expira en: <span className="text-primary">{countdown}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
            <QRCode
              value={generateQRData()}
              size={qrSize}
              level="H"
              includeMargin={true}
              renderAs="svg"
              imageSettings={{
                src: "/logo.png",
                excavate: true,
                width: 40,
                height: 40,
              }}
              fgColor="#3b82f6"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={regenerateQR}
              className="bg-primary text-white py-2 px-6 rounded shadow-md hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              Generar nuevo QR
            </button>
            
            <Link
              href={`/admin-panel/class/${id}`}
              className="bg-blue-600 text-white py-2 px-6 rounded shadow-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Ver detalles de clase
            </Link>
            
            {sessionData && (
              <Link
                href={`/admin-panel/sessions/${sessionData._id}/attendance`}
                className="bg-green-700 text-white py-2 px-6 rounded shadow-md hover:bg-green-800 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14l2 2 4-4"></path>
                </svg>
                Ver asistencia
              </Link>
            )}
            
            <Link
              href="/admin-panel"
              className="bg-gray-700 text-white py-2 px-6 rounded shadow-md hover:bg-gray-800 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 