'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Si las credenciales coinciden con la cuenta del profesor, redirigir directamente
        if (formData.email === 'monroyprofesor@gmail.com') {
          router.push('/admin-panel');
        } else {
          // Para otros usuarios, verificar rol y redirigir
          const response = await fetch('/api/user/me');
          const userData = await response.json();
          
          if (userData.role === 'teacher') {
            router.push('/admin-panel');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      setError('Error al iniciar sesión');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-black rounded shadow-lg overflow-hidden border border-green-500">
        <div className="bg-black text-green-400 p-6 text-center border-b border-green-900">
          <h2 className="text-2xl font-bold mb-2">Iniciar Sesión</h2>
          <p className="text-green-300">Accede a tu cuenta de HicApp</p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="my-4 p-3 bg-red-900 border border-red-600 text-red-300 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-green-400 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded focus-outline-none focus-ring-2 focus-ring-green-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-green-400 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded focus-outline-none focus-ring-2 focus-ring-green-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white py-2 px-4 rounded hover-bg-green-700 transition-colors disabled-opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-400">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link href="/auth/register" className="text-green-400 hover-underline">
                Regístrate aquí
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/" className="text-green-400 hover-underline">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 