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
    <div className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Crear una cuenta</h1>
          <p className="text-gray-400 mt-2">Regístrate como estudiante para unirte a clases y registrar tu asistencia</p>
        </div>
      
        <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden border border-gray-300">
          {error && (
            <div className="px-6 pt-6">
              <div className="p-4 bg-red-900 border border-red-600 text-red-300 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            </div>
          )}
            
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                Nombre completo
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus-outline-none focus-ring-2 focus-ring-primary"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>
              
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                Correo electrónico
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus-outline-none focus-ring-2 focus-ring-primary"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>
              
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus-outline-none focus-ring-2 focus-ring-primary"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Mínimo 8 caracteres
              </p>
            </div>
              
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-2">
                Confirmar contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 px-3 py-3 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus-outline-none focus-ring-2 focus-ring-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
              
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 px-6 rounded-md shadow-md hover-bg-green-700 transition-colors disabled-opacity-50 font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : 'Crear cuenta'}
              </button>
            </div>
          </form>
            
          <div className="px-6 pb-6 pt-2 text-center">
            <div className="flex items-center justify-center my-4">
              <div className="border-t border-gray-300 flex-grow"></div>
              <span className="mx-4 text-sm text-gray-500">O</span>
              <div className="border-t border-gray-300 flex-grow"></div>
            </div>
            <p className="text-gray-700 mb-4">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-primary hover-underline font-medium">
                Inicia sesión
              </Link>
            </p>
            <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover-text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 