// frontend/src/lib/formatters.ts

// ✅ DEFINIMOS EL DOMINIO DEL BACKEND (Fuente única de verdad)
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

// ✅ FUNCIÓN MAESTRA PARA RECURSOS (Imágenes y Documentos)
export const getImageUrl = (path?: string | null) => {
  if (!path) return "https://placehold.co/400x400/f3f4f6/9ca3af?text=Sin+Imagen"; 
  
  // 1. Si ya es una URL completa (S3, Cloudinary, Externo), se devuelve tal cual
  if (path.startsWith("http")) return path;
  
  // 2. Normalización de barras para evitar errores en diferentes OS
  let cleanPath = path.replace(/\\/g, "/");
  
  // 3. Evitar duplicidad de prefijos si el path ya trae la URL de la API por error
  if (cleanPath.includes('medbaysupply.com')) {
      const parts = cleanPath.split('medbaysupply.com');
      cleanPath = parts[parts.length - 1];
  }

  // 4. Aseguramos que empiece con una sola barra
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  // 5. Construcción de URL Absoluta con el dominio certificado
  return `${API_DOMAIN}${normalizedPath}`;
};

// ✅ CONFIGURACIÓN DE ESTADOS DE LOTES
export const getLotStatusConfig = (status: string, expiryDate?: string) => {
  const s = status?.toLowerCase() || '';

  if (s === 'equipment') {
    return { 
      color: 'bg-blue-100 text-blue-700 border-blue-200', 
      label: 'Equipment', 
      hex: '#3b82f6' 
    };
  }
  if (s === 'expired') {
    return { 
      color: 'bg-red-100 text-red-700 border-red-200', 
      label: 'Expired', 
      hex: '#ef4444' 
    };
  }
  if (s === 'near_expiry') {
    return { 
      color: 'bg-amber-100 text-amber-700 border-amber-200', 
      label: 'Near Expiry', 
      hex: '#f59e0b' 
    };
  }
  
  return { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    label: 'In date', // ✅ CAMBIO APLICADO AQUÍ
    hex: '#22c55e' 
  };
};