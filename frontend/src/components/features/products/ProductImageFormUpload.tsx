// frontend/src/components/features/products/ProductImageFormUpload.tsx - VERSIÓN FINAL CORREGIDA
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ProductImage } from '@/hooks/useProducts';

// Interfaces
interface ImageWithMetadata {
  file: File;
  preview: string;
  isPrimary: boolean;
  displayOrder: number;
  fileName: string;
}

interface ProductImageFormUploadProps {
  productId?: string;
  onImagesChange: (images: ImageWithMetadata[]) => void;
  existingImages?: ProductImage[];
  onDeleteExistingImage?: (imageId: string) => void;
  onSetPrimaryImage?: (imageId: string) => void;
  mode?: 'create' | 'edit';
}

export const ProductImageFormUpload = ({ 
  productId, 
  onImagesChange,
  existingImages = [],
  onDeleteExistingImage,
  onSetPrimaryImage,
  mode = 'create'
}: ProductImageFormUploadProps) => {
  const [selectedImages, setSelectedImages] = useState<ImageWithMetadata[]>([]);
  const [currentExistingImages, setCurrentExistingImages] = useState<ProductImage[]>(existingImages);
  
  // Refs para el Drag & Drop
  const dragItem = useRef<{ index: number } | null>(null);
  const dragOverItem = useRef<{ index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ CORRECCIÓN: Usar URLs relativas para que funcione con next.config.ts
  const getImageUrl = (path: string) => {
    if (!path) return '';
    // Si ya es una URL completa, dejarla como está
    if (path.startsWith('http')) return path;
    // Si empieza con /, usar como ruta relativa (para next.config.ts)
    if (path.startsWith('/')) return path;
    // Si no, agregar / al inicio
    return `/${path}`;
  };

  // Actualizar imágenes existentes cuando cambia la prop
  useEffect(() => {
    console.log('🔄 ProductImageFormUpload - existingImages actualizadas:', existingImages.length);
    setCurrentExistingImages(existingImages);
  }, [existingImages]);

  // Notificar cambios en las imágenes seleccionadas
  useEffect(() => {
    onImagesChange(selectedImages);
  }, [selectedImages, onImagesChange]);

  // Manejar selección de archivos
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const currentImages = selectedImages;
    const baseOrder = currentImages.length;

    const newImages: ImageWithMetadata[] = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: currentImages.length === 0 && currentExistingImages.length === 0 && index === 0,
      displayOrder: baseOrder + index,
      fileName: file.name
    }));

    const updatedImages = [...currentImages, ...newImages];
    setSelectedImages(updatedImages);
  };

  // Establecer imagen principal
  const handleSetPrimary = (fileName: string) => {
    setSelectedImages(prev => 
      prev.map(img => ({
        ...img,
        isPrimary: img.fileName === fileName
      }))
    );
  };

  // Eliminar imagen seleccionada
  const handleRemoveSelectedImage = (fileName: string) => {
    setSelectedImages(prev => {
      const newImages = prev.filter(img => img.fileName !== fileName);
      // Si eliminamos la imagen principal, hacer principal la primera de las restantes
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  // Eliminar imagen existente
  const handleDeleteExistingImage = async (imageId: string) => {
    if (!onDeleteExistingImage) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      try {
        await onDeleteExistingImage(imageId);
        // Actualizar estado local
        setCurrentExistingImages(prev => prev.filter(img => img.id !== imageId));
      } catch (error) {
        console.error('Error eliminando imagen:', error);
      }
    }
  };

  // Establecer imagen principal existente
  const handleSetPrimaryExistingImage = async (imageId: string) => {
    if (!onSetPrimaryImage) return;
    
    try {
      await onSetPrimaryImage(imageId);
      // Actualizar estado local
      setCurrentExistingImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );
    } catch (error) {
      console.error('Error estableciendo imagen principal:', error);
    }
  };

  // Drag & Drop para reordenar
  const handleSort = () => {
    const currentList = [...selectedImages];
    const dragIndex = dragItem.current?.index;
    const hoverIndex = dragOverItem.current?.index;

    if (dragIndex === undefined || hoverIndex === undefined || dragIndex === null || hoverIndex === null) return;
    if (dragIndex === hoverIndex) return;

    const draggedItemContent = currentList[dragIndex];
    currentList.splice(dragIndex, 1);
    currentList.splice(hoverIndex, 0, draggedItemContent);

    // Recalcular displayOrder
    const reorderedList = currentList.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setSelectedImages(reorderedList);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Limpiar todas las imágenes seleccionadas
  const handleRemoveAllSelectedImages = () => {
    setSelectedImages([]);
  };

  // Renderizado de imágenes seleccionadas (por subir)
  const SelectedImagesManager = ({ images }: { images: ImageWithMetadata[] }) => {
    if (images.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span>📸 Nuevas imágenes para subir</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{images.length}</span>
          </h4>
          <button 
            type="button"
            onClick={handleRemoveAllSelectedImages}
            className="text-xs text-red-500 hover:text-red-700 hover:underline"
          >
            Limpiar todo
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          👋 <span className="font-medium">Arrastra y suelta</span> las imágenes para ordenarlas. La imagen marcada con <span className="text-yellow-500">★</span> será la portada.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div 
              key={image.fileName}
              draggable
              onDragStart={() => { dragItem.current = { index }; }}
              onDragEnter={() => { dragOverItem.current = { index }; }}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move"
            >
              <img
                src={image.preview}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />

              {/* Botón Principal (Estrella) */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSetPrimary(image.fileName); }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                  image.isPrimary 
                    ? 'bg-yellow-400 text-white shadow-sm' 
                    : 'bg-white/70 text-gray-400 hover:bg-white hover:text-yellow-400'
                }`}
                title={image.isPrimary ? "Es la imagen principal" : "Hacer principal"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Badge de Orden */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                #{index + 1}
              </div>

              {/* Botón Eliminar */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemoveSelectedImage(image.fileName); }}
                className="absolute bottom-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ CORREGIDO: Usar URLs relativas para que funcione con next.config.ts
  const ExistingImagesManager = ({ images }: { images: ProductImage[] }) => {
    console.log('🖼️ ExistingImagesManager - Renderizando imágenes:', images.length);
    
    if (images.length === 0) {
      return (
        <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No hay imágenes existentes para este producto.</p>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span>🖼️ Imágenes existentes</span>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{images.length}</span>
          </h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
              {/* ✅ CORRECCIÓN: Usar URLs relativas para que funcione con next.config.ts */}
              <img 
                src={getImageUrl(image.image_url)} 
                alt="Producto" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.error('❌ Error cargando imagen:', image.image_url);
                  console.log('🔗 URL intentada:', getImageUrl(image.image_url));
                  // Fallback si la imagen no carga
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f1f5f9/475569?text=Imagen+no+disponible';
                }}
                onLoad={() => console.log('✅ Imagen cargada correctamente:', image.image_url)}
              />
              
              {/* Badge de Imagen Principal */}
              {image.is_primary && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">
                  ★ PORTADA
                </div>
              )}

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                
                {/* Botón para establecer como principal (solo si no es principal) */}
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryExistingImage(image.id)}
                    className="p-2 bg-white rounded-full text-yellow-500 hover:bg-yellow-50 transition transform hover:scale-110"
                    title="Hacer portada"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}

                {/* Botón para eliminar */}
                <button
                  type="button"
                  onClick={() => handleDeleteExistingImage(image.id)}
                  className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition transform hover:scale-110"
                  title="Eliminar imagen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>

              {/* Indicador de orden (si existe) */}
              {image.display_order !== undefined && (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{image.display_order + 1}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          💡 Puedes eliminar imágenes existentes o cambiar cuál es la imagen principal
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mostrar imágenes existentes en modo edición */}
      {mode === 'edit' && currentExistingImages.length > 0 && (
        <ExistingImagesManager images={currentExistingImages} />
      )}

      {/* Zona de Drop e Input para nuevas imágenes */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*"
          multiple
          className="hidden"
        />

        {selectedImages.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-all group flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-gray-700 font-medium">Click para agregar nuevas imágenes</span>
            <span className="text-gray-400 text-sm mt-1">Soporta JPG, PNG (Max 5MB)</span>
          </button>
        ) : (
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Agregar más fotos
            </button>
          </div>
        )}

        <SelectedImagesManager images={selectedImages} />
      </div>
    </div>
  );
};