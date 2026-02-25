// frontend/src/components/features/products/ProductImageFormUpload.tsx

import { useState, useRef, useEffect } from 'react';
import { ProductImage } from '@/hooks/useProducts';
// ✅ IMPORTACIÓN CLAVE: Usamos la lógica unificada que ya funciona en el Home y la Tabla
import { getImageUrl } from '@/lib/formatters';

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
  
  // Refs for Drag & Drop
  const dragItem = useRef<{ index: number } | null>(null);
  const dragOverItem = useRef<{ index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ LOCAL getImageUrl ELIMINADA para usar la de @/lib/formatters

  // Update existing images when prop changes
  useEffect(() => {
    setCurrentExistingImages(existingImages);
  }, [existingImages]);

  // Notify changes in selected images
  useEffect(() => {
    onImagesChange(selectedImages);
  }, [selectedImages, onImagesChange]);

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 5 * 1024 * 1024) return false;
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

    setSelectedImages([...currentImages, ...newImages]);
  };

  // Set primary image
  const handleSetPrimary = (fileName: string) => {
    setSelectedImages(prev => 
      prev.map(img => ({
        ...img,
        isPrimary: img.fileName === fileName
      }))
    );
  };

  // Remove selected image
  const handleRemoveSelectedImage = (fileName: string) => {
    setSelectedImages(prev => {
      const newImages = prev.filter(img => img.fileName !== fileName);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  // Delete existing image
  const handleDeleteExistingImage = async (imageId: string) => {
    if (!onDeleteExistingImage) return;
    if (confirm('Permanently delete this image from the server?')) {
      try {
        await onDeleteExistingImage(imageId);
        setCurrentExistingImages(prev => prev.filter(img => img.id !== imageId));
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  // Set existing primary image
  const handleSetPrimaryExistingImage = async (imageId: string) => {
    if (!onSetPrimaryImage) return;
    try {
      await onSetPrimaryImage(imageId);
      setCurrentExistingImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );
    } catch (error) {
      console.error('Error setting primary image:', error);
    }
  };

  // Drag & Drop to reorder
  const handleSort = () => {
    const currentList = [...selectedImages];
    const dragIndex = dragItem.current?.index;
    const hoverIndex = dragOverItem.current?.index;

    if (dragIndex === undefined || hoverIndex === undefined || dragIndex === null || hoverIndex === null) return;
    if (dragIndex === hoverIndex) return;

    const draggedItemContent = currentList[dragIndex];
    currentList.splice(dragIndex, 1);
    currentList.splice(hoverIndex, 0, draggedItemContent);

    const reorderedList = currentList.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setSelectedImages(reorderedList);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleRemoveAllSelectedImages = () => {
    setSelectedImages([]);
  };

  // Renderers
  const SelectedImagesManager = ({ images }: { images: ImageWithMetadata[] }) => {
    if (images.length === 0) return null;

    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <span>New images queue</span>
            <span className="bg-blue-100 px-2 py-0.5 rounded-full text-[10px]">{images.length}</span>
          </h4>
          <button 
            type="button"
            onClick={handleRemoveAllSelectedImages}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
          >
            Cancel all
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div 
              key={image.fileName}
              draggable
              onDragStart={() => { dragItem.current = { index }; }}
              onDragEnter={() => { dragOverItem.current = { index }; }}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="group relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-blue-200 hover:border-blue-400 transition-all cursor-move shadow-sm"
            >
              <img
                src={image.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              
              {/* Order Badge */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                NEW #{index + 1}
              </div>

              {/* Primary Star */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSetPrimary(image.fileName); }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                  image.isPrimary 
                    ? 'bg-yellow-400 text-white shadow-lg' 
                    : 'bg-white/80 text-gray-400 hover:text-yellow-500'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemoveSelectedImage(image.fileName); }}
                className="absolute bottom-2 right-2 p-2 bg-white/90 text-red-500 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
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

  const ExistingImagesManager = ({ images }: { images: ProductImage[] }) => {
    if (images.length === 0) return null;

    return (
      <div className="mb-8">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Current Gallery</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
              {/* ✅ APLICANDO getImageUrl MAESTRA */}
              <img 
                src={getImageUrl(image.image_url)} 
                alt="Product" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f1f5f9/475569?text=Image+Unavailable';
                }}
              />
              
              {image.is_primary && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm z-10">
                  COVER
                </div>
              )}

              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryExistingImage(image.id)}
                    className="p-2 bg-white rounded-full text-yellow-500 hover:scale-110 transition shadow-lg"
                    title="Set as cover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteExistingImage(image.id)}
                  className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition shadow-lg"
                  title="Delete image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {mode === 'edit' && currentExistingImages.length > 0 && (
        <ExistingImagesManager images={currentExistingImages} />
      )}

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
            className="w-full border-2 border-dashed border-gray-200 rounded-3xl p-12 hover:border-blue-500 hover:bg-blue-50 transition-all group flex flex-col items-center justify-center text-center cursor-pointer shadow-sm"
          >
            <div className="bg-blue-50 p-4 rounded-2xl mb-4 group-hover:bg-blue-100 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-slate-900 font-black text-sm uppercase tracking-widest">Click to upload new photos</span>
            <span className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-tighter">JPG, PNG, WEBP (MAX 5MB PER FILE)</span>
          </button>
        ) : (
          <div className="flex justify-end mb-4">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Add more
            </button>
          </div>
        )}

        <SelectedImagesManager images={selectedImages} />
      </div>
    </div>
  );
};