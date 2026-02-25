// frontend/src/components/features/products/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CreateProductData, UpdateProductData, useProducts, ProductImage } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useManufacturers } from '@/hooks/useManufacturers';
import { ProductImageFormUpload } from './ProductImageFormUpload';

interface ImageWithMetadata {
  file: File;
  preview: string;
  isPrimary: boolean;
  displayOrder: number;
  fileName: string;
}

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductData | UpdateProductData) => Promise<any>;
  isSubmitting?: boolean;
  submitError?: string | null;
  mode?: 'create' | 'edit';
}

export const ProductForm = ({ 
  product, 
  onSubmit, 
  isSubmitting = false, 
  submitError = null,
  mode = 'create'
}: ProductFormProps) => {
  const router = useRouter();
  const { categories } = useCategories();
  const { manufacturers } = useManufacturers();
  const { uploadImagesWithMetadata, getProductImages, deleteImage, setPrimaryImage } = useProducts();
  
  const [formData, setFormData] = useState({
    description: '',
    global_sku: '',
    manufacturer_id: '',
    notes: '',
    category_ids: [] as string[],
  });

  const [selectedImages, setSelectedImages] = useState<ImageWithMetadata[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // ✅ EFECTO UNIFICADO: Carga de datos y disparo de carga de imágenes
  useEffect(() => {
    if (product) {
      setFormData({
        description: product.description || '',
        global_sku: product.global_sku || '',
        manufacturer_id: product.manufacturer_id || '',
        notes: product.notes || '',
        category_ids: product.category_ids || [],
      });
      
      if (mode === 'edit' && product.id) {
        loadExistingImages(product.id);
      }
    }
  }, [product, mode]);

  const loadExistingImages = async (productId: string) => {
    console.log('🔄 ProductForm - Fetching images for:', productId);
    try {
      const images = await getProductImages(productId);
      setExistingImages(images || []);
    } catch (error) {
      console.error('❌ Error loading existing images:', error);
      setExistingImages([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 500) newErrors.description = 'Maximum 500 characters';
    if (formData.global_sku && formData.global_sku.length > 100) newErrors.global_sku = 'SKU is too long';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!product?.id) return;
    try {
      await deleteImage(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!product?.id) return;
    try {
      await setPrimaryImage(imageId);
      // Actualización optimista del estado local
      setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })));
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert("Error setting primary image. Check your connection.");
    }
  };

  const prepareFormData = () => {
    const data: any = {
      description: formData.description,
      global_sku: formData.global_sku || null,
      notes: formData.notes || null,
      category_ids: formData.category_ids.length > 0 ? formData.category_ids : [],
    };

    // Validación robusta para manufacturer_id
    if (formData.manufacturer_id && formData.manufacturer_id !== 'null') {
      data.manufacturer_id = formData.manufacturer_id;
    } else {
      data.manufacturer_id = null;
    }
    return data;
  };

  const uploadProductImages = async (productId: string) => {
    if (selectedImages.length === 0) return;
    try {
      setIsUploadingImages(true);
      const uploadData = new FormData();
      uploadData.append('productId', productId);
      
      const imagesMetadata = selectedImages.map(img => ({
        fileName: img.fileName,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder
      }));
      
      uploadData.append('imagesMetadata', JSON.stringify(imagesMetadata));
      selectedImages.forEach(img => uploadData.append('images', img.file));

      await uploadImagesWithMetadata(productId, uploadData);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const dataToSubmit = prepareFormData();
      const result = await onSubmit(dataToSubmit);
      
      // Intentamos obtener el ID del producto de la respuesta o del prop original
      const productId = result?.product?.id || result?.id || product?.id;
      
      if (!productId) {
         console.error("Server response details:", result);
         throw new Error('Critical error: Could not verify Product ID for upload.');
      }

      if (selectedImages.length > 0) {
        await uploadProductImages(productId);
      }
      
      router.push('/dashboard/products');
      
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const isSubmittingForm = isSubmitting || isUploadingImages;
  const inputClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400";
  const errorClasses = "border-red-300 ring-red-50";
  const normalClasses = "border-gray-300";

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            General Information
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`${inputClasses} ${errors.description ? errorClasses : normalClasses}`}
                placeholder="Detailed product name or commercial description..."
              />
              {errors.description && <p className="text-xs text-red-600 mt-1 font-bold">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Global SKU</label>
                <input
                  type="text"
                  value={formData.global_sku}
                  onChange={(e) => handleInputChange('global_sku', e.target.value)}
                  className={inputClasses}
                  placeholder="e.g.: MED-102938"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Manufacturer</label>
                <select
                  value={formData.manufacturer_id || ''}
                  onChange={(e) => handleInputChange('manufacturer_id', e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Select a manufacturer...</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id} className="text-gray-900">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Internal Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className={inputClasses}
                  placeholder="Private details for admins only..."
                />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
            Visual Catalog
          </h3>
          <ProductImageFormUpload
            productId={product?.id}
            onImagesChange={setSelectedImages}
            existingImages={existingImages}
            onDeleteExistingImage={handleDeleteExistingImage}
            onSetPrimaryImage={handleSetPrimaryImage}
            mode={mode}
          />
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-600 rounded-full"></span>
              Classification
            </h3>
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {categories.filter(c => formData.category_ids.includes(c.id)).map(cat => (
                        <span key={cat.id} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-bold uppercase tracking-wider">
                            {cat.name}
                            <button type="button" onClick={() => handleInputChange('category_ids', formData.category_ids.filter(id => id !== cat.id))} className="hover:text-emerald-900 transition-colors">
                                <XCircleIcon className="w-4 h-4" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="relative">
                  <select
                      onChange={(e) => {
                          if(e.target.value && !formData.category_ids.includes(e.target.value)) 
                              handleInputChange('category_ids', [...formData.category_ids, e.target.value]);
                          e.target.value = '';
                      }}
                      className={`${inputClasses} pr-10`}
                  >
                      <option value="">+ Add category to product...</option>
                      {categories.filter(c => !formData.category_ids.includes(c.id)).map(c => (
                          <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
                      ))}
                  </select>
                </div>
            </div>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold flex items-center gap-3">
            <AlertCircleIcon className="w-5 h-5" />
            Error: {submitError}
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 bg-white font-bold text-sm uppercase tracking-widest transition-all"
            disabled={isSubmittingForm}
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isSubmittingForm}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 disabled:bg-slate-400 flex items-center gap-2 font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-slate-200"
          >
            {isSubmittingForm ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            {mode === 'create' ? 'Publish Product' : 'Apply Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Simple internal icons for consistency
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);