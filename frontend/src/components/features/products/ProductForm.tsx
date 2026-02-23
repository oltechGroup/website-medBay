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

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        description: product.description || '',
        global_sku: product.global_sku || '',
        manufacturer_id: product.manufacturer_id || '',
        notes: product.notes || '',
        category_ids: product.category_ids || [],
      });
      loadExistingImages(product.id);
    }
  }, [product, mode]);

const loadExistingImages = async (productId: string) => {
  console.log('🔄 Loading images for product:', productId);
  try {
    const images = await getProductImages(productId);
    console.log('📸 Images obtained from backend:', images);
    setExistingImages(images || []);
    console.log('✅ existingImages state updated');
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
      category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
    };
    if (formData.manufacturer_id && formData.manufacturer_id.length > 10) {
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
      const formData = new FormData();
      formData.append('productId', productId);
      
      const imagesMetadata = selectedImages.map(img => ({
        fileName: img.fileName,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder
      }));
      
      formData.append('imagesMetadata', JSON.stringify(imagesMetadata));
      selectedImages.forEach(img => formData.append('images', img.file));

      await uploadImagesWithMetadata(productId, formData);
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
      const productId = result?.product?.id || result?.id || product?.id;
      
      if (!productId) {
         console.error("Server response:", result);
         throw new Error('Critical error: Could not obtain product ID.');
      }

      if (selectedImages.length > 0) {
        await uploadProductImages(productId);
      }
      
      router.push('/dashboard/products');
      
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const isSubmittingForm = isSubmitting || isUploadingImages;

  // Common classes for inputs to ensure visibility
  const inputClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400";
  const errorClasses = "border-red-300";
  const normalClasses = "border-gray-300";

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`${inputClasses} ${errors.description ? errorClasses : normalClasses}`}
                placeholder="Type the name or description of the product..."
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Global SKU</label>
                <input
                  type="text"
                  value={formData.global_sku}
                  onChange={(e) => handleInputChange('global_sku', e.target.value)}
                  className={inputClasses}
                  placeholder="e.g.: SKU-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <select
                  value={formData.manufacturer_id}
                  onChange={(e) => handleInputChange('manufacturer_id', e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Select manufacturer...</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id} className="text-gray-900">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                  className={inputClasses}
                  placeholder="Additional details..."
                />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Image Gallery</h3>
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {categories.filter(c => formData.category_ids.includes(c.id)).map(cat => (
                        <span key={cat.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                            {cat.name}
                            <button type="button" onClick={() => handleInputChange('category_ids', formData.category_ids.filter(id => id !== cat.id))} className="hover:text-blue-900 font-bold ml-1">×</button>
                        </span>
                    ))}
                </div>
                <select
                    onChange={(e) => {
                        if(e.target.value && !formData.category_ids.includes(e.target.value)) 
                            handleInputChange('category_ids', [...formData.category_ids, e.target.value]);
                        e.target.value = '';
                    }}
                    className={inputClasses}
                >
                    <option value="">+ Add category</option>
                    {categories.filter(c => !formData.category_ids.includes(c.id)).map(c => (
                        <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
            Error: {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white font-medium"
            disabled={isSubmittingForm}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmittingForm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2 font-medium shadow-sm"
          >
            {isSubmittingForm && (
                 <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            )}
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};