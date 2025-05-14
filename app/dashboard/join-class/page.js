'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function JoinClassPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classCode, setClassCode] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [joinMessage, setJoinMessage] = useState({ text: '', type: '' });

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

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(
        classItem => 
          classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (classItem.description && classItem.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (classItem.teacher && classItem.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClasses(filtered);
    }
  }, [searchTerm, classes]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener las clases');
      }

      // Filter out classes the student is already in
      const notJoinedClasses = data.filter(classItem => 
        !classItem.students.some(student => student === session.user.id)
      );
      
      setClasses(notJoinedClasses);
      setFilteredClasses(notJoinedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Error al cargar las clases. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    setJoinMessage({ text: '', type: '' });
    setClassCode('');
  };

  const handleJoinClass = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass._id,
          code: classCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setJoinMessage({ text: data.message, type: 'error' });
        setLoading(false);
        return;
      }

      setJoinMessage({ text: 'Te has unido a la clase exitosamente', type: 'success' });
      
      // Refresh the class list after joining
      await fetchClasses();
      setSelectedClass(null);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error joining class:', error);
      setJoinMessage({ text: 'Error al unirse a la clase. Por favor, intenta de nuevo.', type: 'error' });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Unirse a una clase</h1>
          <p className="text-gray-400 mt-1">Encuentra y únete a las clases disponibles</p>
        </div>
        <Link
          href="/dashboard"
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
        >
          Volver al dashboard
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Class list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar clases
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, descripción o profesor..."
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {filteredClasses.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <p className="text-gray-500 mb-2">
                  {searchTerm ? 'No se encontraron clases con esos términos.' : 'No hay clases disponibles para unirse.'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Contacta con tu profesor para obtener acceso a sus clases.'}
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <ul className="divide-y divide-gray-200">
                  {filteredClasses.map(classItem => (
                    <li 
                      key={classItem._id} 
                      className={`py-4 px-2 hover:bg-gray-50 cursor-pointer rounded transition-colors ${selectedClass?._id === classItem._id ? 'bg-blue-50 border border-blue-200' : ''}`}
                      onClick={() => handleClassSelect(classItem)}
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{classItem.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Profesor: {classItem.teacher?.name || 'No asignado'}
                      </p>
                      {classItem.description && (
                        <p className="text-sm text-gray-500">{classItem.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Join form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedClass ? 'Unirse a la clase' : 'Selecciona una clase'}
            </h2>
            
            {!selectedClass ? (
              <div className="text-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p className="text-gray-500">Selecciona una clase de la lista para unirte</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="font-semibold text-lg text-gray-800">{selectedClass.name}</h3>
                  <p className="text-sm text-gray-600">
                    Profesor: {selectedClass.teacher?.name || 'No asignado'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Código de la clase
                  </label>
                  <input
                    id="classCode"
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="Introduce el código de la clase"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    * El código de la clase lo proporciona el profesor
                  </p>
                </div>
                
                {joinMessage.text && (
                  <div className={`p-3 rounded mb-4 ${
                    joinMessage.type === 'error' 
                      ? 'bg-red-100 border border-red-400 text-red-700' 
                      : 'bg-green-100 border border-green-400 text-green-700'
                  }`}>
                    {joinMessage.text}
                  </div>
                )}
                
                <button
                  onClick={handleJoinClass}
                  disabled={loading}
                  className="w-full bg-primary text-white py-2 px-4 rounded shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uniéndose...' : 'Unirse a la clase'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 