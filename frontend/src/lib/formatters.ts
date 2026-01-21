// frontend/src/lib/formatters.ts

// ✅ DEFINIMOS EL DOMINIO DEL BACKEND
const API_DOMAIN = "https://api.medbaysupply.com";

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

// ✅ CORRECCIÓN DE IMÁGENES
export const getImageUrl = (path?: string | null) => {
  if (!path) return "https://placehold.co/400x400/f3f4f6/9ca3af?text=Sin+Imagen"; 
  
  // Si ya viene con http (ej. S3 o enlace externo), lo dejamos igual
  if (path.startsWith("http")) return path;
  
  // Normalizamos las barras (Windows a Unix)
  const cleanPath = path.replace(/\\/g, "/");
  
  // Aseguramos que empiece con /
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  // 🔥 AQUÍ ESTÁ LA SOLUCIÓN:
  // Devolvemos la URL absoluta apuntando al Backend, no relativa.
  return `${API_DOMAIN}${normalizedPath}`;
};

// ✅ CORRECCIÓN DE LÓGICA DE NEGOCIO:
export const getLotStatusConfig = (status: string, expiryDate?: string) => {
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
  
  return { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    label: 'En Fecha', 
    hex: '#22c55e' 
  };
};