'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TestApi() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get('/health');
        setData(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) return <div>Probando conexión...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test de Conexión API</h1>
      {error ? (
        <div className="text-red-600">
          <p>Error: {error}</p>
          <p className="mt-2">Verifica que:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>El backend esté corriendo en puerto 3001</li>
            <li>La variable NEXT_PUBLIC_API_URL esté configurada</li>
            <li>No haya errores de CORS</li>
          </ul>
        </div>
      ) : (
        <div className="text-green-600">
          <p>✅ Conexión exitosa con el backend!</p>
          <pre className="mt-4 bg-gray-100 p-4 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}