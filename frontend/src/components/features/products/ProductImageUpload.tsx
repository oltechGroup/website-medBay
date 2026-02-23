// frontend/src/components/features/products/ProductImageUpload.tsx

import { useState, useRef, useCallback, useEffect } from 'react';
import { Product, ProductImage, useProducts } from '@/hooks/useProducts';

// 🌎 URL CONFIGURATION
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.medbaysupply.com';

interface ProductImageUploadProps {
  productsWithoutImages: Product[];
  onUploadComplete?: () => void;
}

interface ImageWithMetadata {
  file: File;
  preview: string;
  isPrimary: boolean;
  displayOrder: number;
  fileName: string;
}

export const ProductImageUpload = ({ productsWithoutImages, onUploadComplete }: ProductImageUploadProps) => {
  const { 
    getProductImages, 
    setPrimaryImage, 
    deleteImage,
    uploadImagesWithMetadata,
    isUploadingImagesWithMetadata 
  } = useProducts();
  
  // Main states
  const [selectedImages, setSelectedImages] = useState<{ [productId: string]: ImageWithMetadata[] }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [productId: string]: 'idle' | 'uploading' | 'success' | 'error' }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [productId: string]: string }>({});
  const [existingImages, setExistingImages] = useState<{ [productId: string]: ProductImage[] }>({});
  const [loadingImages, setLoadingImages] = useState<{ [productId: string]: boolean }>({});
  
  // State for Drag & Drop visualization (external file)
  const [dragActive, setDragActive] = useState<{ [productId: string]: boolean }>({});

  // Refs for internal reordering
  const dragItem = useRef<{ index: number, productId: string } | null>(null);
  const dragOverItem = useRef<{ index: number, productId: string } | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const setFileInputRef = useCallback((productId: string) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[productId] = el;
  }, []);

  // 👇 URL HELPER
  const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_URL}/${cleanPath}`;
  };

  // Initial load of existing images (if any)
  useEffect(() => {
    let isMounted = true;
    const loadExistingImages = async () => {
      if (!isMounted) return;
      const imagesMap: { [productId: string]: ProductImage[] } = {};
      const loadingMap: { [productId: string]: boolean } = {};

      for (const product of productsWithoutImages) {
        if (!isMounted) break;
        loadingMap[product.id] = true;
        try {
          const images = await getProductImages(product.id);
          if (isMounted) imagesMap[product.id] = images || [];
        } catch (error) {
          console.error(`Error loading images:`, error);
          if (isMounted) imagesMap[product.id] = [];
        } finally {
          if (isMounted) loadingMap[product.id] = false;
        }
      }
      if (isMounted) {
        setExistingImages(imagesMap);
        setLoadingImages(loadingMap);
      }
    };
    if (productsWithoutImages.length > 0) loadExistingImages();
    return () => { isMounted = false; };
  }, [productsWithoutImages]);

  // --- FILE PROCESSING LOGIC ---
  const processFiles = (productId: string, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    // Validate type and size (Max 5MB)
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) return;

    const currentImages = selectedImages[productId] || [];
    const baseOrder = currentImages.length; 

    const newImages: ImageWithMetadata[] = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: currentImages.length === 0 && index === 0, 
      displayOrder: baseOrder + index,
      fileName: file.name
    }));

    setSelectedImages(prev => ({ ...prev, [productId]: [...currentImages, ...newImages] }));
    setUploadStatus(prev => ({ ...prev, [productId]: 'idle' }));
    setUploadErrors(prev => ({ ...prev, [productId]: '' }));
    
    // Reset input value to allow uploading the same file if deleted
    if (fileInputRefs.current[productId]) fileInputRefs.current[productId]!.value = '';
  };

  // --- DRAG & DROP EVENT HANDLERS (EXTERNAL FILES) ---
  const handleDragEnter = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [productId]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [productId]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [productId]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(productId, e.dataTransfer.files);
    }
  };

  // --- EXISTING HANDLERS ---
  const handleFileSelect = (productId: string, files: FileList | null) => {
    processFiles(productId, files);
  };

  const handleSetPrimaryBeforeUpload = (productId: string, fileName: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [productId]: prev[productId]?.map(img => ({
        ...img,
        isPrimary: img.fileName === fileName
      })) || []
    }));
  };

  const handleRemoveSelectedImage = (productId: string, fileName: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [productId]: prev[productId]?.filter(img => img.fileName !== fileName) || []
    }));
  };

  const handleRemoveAllSelectedImages = (productId: string) => {
    setSelectedImages(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Visual reordering (Internal Drag & Drop)
  const handleSort = (productId: string) => {
    const currentList = [...(selectedImages[productId] || [])];
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

    setSelectedImages(prev => ({ ...prev, [productId]: reorderedList }));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Server upload
  const handleUploadWithMetadata = async (productId: string) => {
    const imagesToUpload = selectedImages[productId];
    if (!imagesToUpload || imagesToUpload.length === 0) return;

    setUploadStatus(prev => ({ ...prev, [productId]: 'uploading' }));

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      
      const imagesMetadata = imagesToUpload.map(img => ({
        fileName: img.fileName,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder
      }));
      
      formData.append('imagesMetadata', JSON.stringify(imagesMetadata));
      imagesToUpload.forEach(img => formData.append('images', img.file));

      await uploadImagesWithMetadata(productId, formData);

      setUploadStatus(prev => ({ ...prev, [productId]: 'success' }));
      setUploadErrors(prev => ({ ...prev, [productId]: '' }));

      const updatedImages = await getProductImages(productId);
      setExistingImages(prev => ({ ...prev, [productId]: updatedImages || [] }));
      handleRemoveAllSelectedImages(productId);
      onUploadComplete?.();

      setTimeout(() => setUploadStatus(prev => ({ ...prev, [productId]: 'idle' })), 3000);

    } catch (error: any) {
      console.error('Error uploading:', error);
      setUploadStatus(prev => ({ ...prev, [productId]: 'error' }));
      setUploadErrors(prev => ({ ...prev, [productId]: error.response?.data?.error || 'Upload error.' }));
    }
  };

  const handleSetPrimaryAfterUpload = async (productId: string, imageId: string) => {
    try {
      await setPrimaryImage(imageId);
      setExistingImages(prev => ({
        ...prev,
        [productId]: prev[productId]?.map(img => ({ ...img, is_primary: img.id === imageId })) || []
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteImage = async (productId: string, imageId: string) => {
    if (!confirm('Delete image?')) return;
    try {
      await deleteImage(imageId);
      setExistingImages(prev => ({
        ...prev,
        [productId]: prev[productId]?.filter(img => img.id !== imageId) || []
      }));
    } catch (error) {
      console.error(error);
    }
  };

  // --- SUBCOMPONENT: New Images (Selected) ---
  const SelectedImagesManager = ({ productId, images }: { productId: string; images: ImageWithMetadata[] }) => {
    if (images.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
            <span>📸 Ready to upload</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{images.length}</span>
          </h4>
          <button onClick={() => handleRemoveAllSelectedImages(productId)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
            Clear selection
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div 
              key={image.fileName}
              draggable
              onDragStart={() => { dragItem.current = { index, productId }; }}
              onDragEnter={() => { dragOverItem.current = { index, productId }; }}
              onDragEnd={() => handleSort(productId)}
              onDragOver={(e) => e.preventDefault()}
              className="group relative aspect-square bg-blue-50 rounded-lg overflow-hidden border border-blue-200 shadow-sm cursor-move hover:shadow-md transition-all"
            >
              <img src={image.preview} alt="preview" className="w-full h-full object-cover" />
              
              <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 rounded shadow-sm">NEW</div>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleSetPrimaryBeforeUpload(productId, image.fileName); }}
                className={`absolute top-1 right-1 p-1 rounded-full backdrop-blur-sm shadow-sm transition-all ${
                  image.isPrimary ? 'bg-yellow-400 text-white' : 'bg-white/70 text-gray-400 hover:bg-white hover:text-yellow-400'
                }`}
                title="Mark as primary"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleRemoveSelectedImage(productId, image.fileName); }}
                className="absolute bottom-1 right-1 p-1 bg-white text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- SUBCOMPONENT: Existing Images ---
  const ExistingImagesManager = ({ productId, images }: { productId: string; images: ProductImage[] }) => {
    if (loadingImages[productId]) return <div className="mt-4 flex gap-2 animate-pulse"><div className="w-16 h-16 bg-gray-200 rounded-lg"/><div className="w-16 h-16 bg-gray-200 rounded-lg"/></div>;
    if (images.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Saved gallery</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img 
                src={getFullImageUrl(image.image_url)} 
                alt="Product" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/400x400/f1f5f9/475569?text=No+Image"; }}
              />
              
              {image.is_primary && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl shadow-sm z-10">★</div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <button onClick={() => handleSetPrimaryAfterUpload(productId, image.id)} className="p-1.5 bg-white rounded-full text-yellow-500 hover:scale-110 transition" title="Set as cover">
                   <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </button>
                )}
                <button onClick={() => handleDeleteImage(productId, image.id)} className="p-1.5 bg-white rounded-full text-red-500 hover:scale-110 transition" title="Delete image">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  if (productsWithoutImages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">All set!</h3>
        <p className="mt-2 text-gray-500">All visible products have their images.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {productsWithoutImages.map((product) => {
        const productSelectedImages = selectedImages[product.id] || [];
        const productStatus = uploadStatus[product.id] || 'idle';
        const productError = uploadErrors[product.id];
        const isActive = dragActive[product.id];
        
        return (
          <div key={product.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{product.description}</h3>
                    <p className="text-sm text-gray-500 mt-1">SKU: {product.global_sku || 'N/A'}</p>
                </div>
            </div>

            <ExistingImagesManager productId={product.id} images={existingImages[product.id] || []} />

            <div className="mt-6">
              <input
                type="file"
                ref={setFileInputRef(product.id)}
                onChange={(e) => handleFileSelect(product.id, e.target.files)}
                accept="image/*"
                multiple
                className="hidden"
              />

              {productSelectedImages.length === 0 ? (
                  <div
                    onDragEnter={(e) => handleDragEnter(e, product.id)}
                    onDragLeave={(e) => handleDragLeave(e, product.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, product.id)}
                    onClick={() => fileInputRefs.current[product.id]?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-8 transition-all group flex flex-col items-center justify-center text-center cursor-pointer 
                      ${isActive 
                        ? 'border-blue-600 bg-blue-50 scale-[1.01]' 
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                  >
                    <div className={`p-3 rounded-full mb-3 transition-colors ${isActive ? 'bg-blue-200' : 'bg-blue-50 group-hover:bg-blue-200'}`}>
                        <svg className={`w-6 h-6 ${isActive ? 'text-blue-700' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className={`font-medium text-sm ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                      {isActive ? 'Drop images here!' : 'Click or Drag images here'}
                    </span>
                  </div>
              ) : (
                  <div className="flex justify-end">
                      <button 
                        onClick={() => fileInputRefs.current[product.id]?.click()}
                        className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
                      >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                          Add more
                      </button>
                  </div>
              )}

              <SelectedImagesManager productId={product.id} images={productSelectedImages} />

              {productSelectedImages.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-between">
                  {productError ? (
                    <div className="text-red-600 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {productError}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                        {productSelectedImages.length} new
                    </div>
                  )}

                  <button
                      onClick={() => handleUploadWithMetadata(product.id)}
                      disabled={productStatus === 'uploading' || isUploadingImagesWithMetadata}
                      className={`
                          px-5 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2
                          ${productStatus === 'uploading' ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}
                          ${productStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
                      `}
                  >
                      {productStatus === 'uploading' ? 'Uploading...' : productStatus === 'success' ? 'Done!' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};