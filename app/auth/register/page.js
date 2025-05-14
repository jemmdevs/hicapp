'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'student', // By default, new registrations are students
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar');
      }

      // Automatically sign in the user
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult.error) {
        setError(signInResult.error);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Error al registrar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-black rounded-lg shadow-lg overflow-hidden border border-green-500">
        <div className="bg-black text-green-400 p-6 text-center border-b border-green-900">
          <h2 className="text-3xl font-bold mb-2">Registrarse</h2>
          <p className="text-green-300">Crea tu cuenta de estudiante en HicApp</p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-300 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-green-400 mb-1">
                Nombre completo
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
              <label htmlFor="email" className="block text-sm font-medium text-green-400 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-green-400 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-green-400 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-green-400 hover:underline">
                Inicia sesión
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/" className="text-green-400 hover:underline">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 