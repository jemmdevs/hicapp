'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import QRCode from 'qrcode.react';

export default function ClassQRCode({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated and is a student
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'student') {
      router.push('/admin-panel');
    } else if (status === 'authenticated' && session?.user?.role === 'student') {
      fetchClassData();
    }
  }, [status, session, router, id]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener los datos de la clase');
      }

      setClassData(data);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error al cargar los datos de la clase. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    if (!session?.user?.id || !classData?._id) return '';
    
    // Include student ID, class ID, and current timestamp to make QR code unique
    const qrData = {
      studentId: session.user.id,
      classId: classData._id,
      name: session.user.name,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(qrData);
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
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-green-400 hover:underline"
        >
          Volver al dashboard
        </button>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-green-400">No se encontró la clase</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 text-green-400 hover:underline"
        >
          Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-black rounded-lg shadow-lg overflow-hidden border border-green-500">
        <div className="bg-black text-green-400 p-6 text-center border-b border-green-900">
          <h2 className="text-2xl font-bold mb-2">{classData.name}</h2>
          <p className="text-green-300">Código QR de asistencia</p>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-6">
            <p className="text-gray-300 mb-2">
              Muestra este código QR al profesor para registrar tu asistencia
            </p>
            <p className="text-sm text-gray-400">
              Este código es personal y válido solo para esta clase
            </p>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg shadow-md mb-6 border border-green-800">
            <QRCode
              value={generateQRData()}
              size={200}
              level="H"
              includeMargin={true}
              renderAs="svg"
              fgColor="#10B981"
              bgColor="#111111"
            />
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Fecha: {new Date().toLocaleDateString()}
          </p>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            Volver a mis clases
          </button>
        </div>
      </div>
    </div>
  );
}