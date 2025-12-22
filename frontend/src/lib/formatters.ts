// frontend/src/lib/formatters.ts

export const formatCurrency = (amount?: number | string | null) => {
  if (amount === null || amount === undefined || amount === 0 || amount === "0") {
    return "Consultar"; 
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return "No especificada";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Pendiente";
  
  return new Intl.DateTimeFormat("es-MX", {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const getImageUrl = (path?: string | null) => {
  if (!path) return "https://placehold.co/400x400/f3f4f6/9ca3af?text=Sin+Imagen"; 
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/");
  if (cleanPath.startsWith("/")) return cleanPath;
  return `/${cleanPath}`;
};

// ✅ CORRECCIÓN DE LÓGICA DE NEGOCIO:
// Respetamos estrictamente el status que viene de la BD. 
// No calculamos fechas manualmente.
export const getLotStatusConfig = (status: string, expiryDate?: string) => {
  // Normalizamos a minúsculas por seguridad
  const s = status?.toLowerCase() || '';

  if (s === 'expired') {
    return { 
      color: 'bg-red-100 text-red-700 border-red-200', 
      label: 'Caducado', 
      hex: '#ef4444' 
    };
  }
  if (s === 'near_expiry') {
    return { 
      color: 'bg-amber-100 text-amber-700 border-amber-200', 
      label: 'Fecha Corta', 
      hex: '#f59e0b' 
    };
  }
  
  // Default: available o cualquier otro status positivo
  return { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    label: 'En Fecha', 
    hex: '#22c55e' 
  };
};