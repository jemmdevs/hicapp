'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CreateClass() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (!formData.name.trim()) {
      setError('El nombre de la clase es obligatorio');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la clase');
      }

      // Redirect to admin panel
      router.push('/admin-panel');
    } catch (error) {
      setError(error.message || 'Error al crear la clase');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-green-400">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-black rounded-lg shadow-lg overflow-hidden border border-green-500">
        <div className="bg-black text-green-400 p-6 border-b border-green-900">
          <h1 className="text-2xl font-bold">Crear Nueva Clase</h1>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-600 text-red-300 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-green-400 mb-1">
                Nombre de la clase *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-green-400 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/admin-panel"
                className="text-green-400 hover:underline"
              >
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Clase'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 