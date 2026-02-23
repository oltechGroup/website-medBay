//frontend/src/components/features/manufacturers/ManufacturerForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Manufacturer } from '@/hooks/useManufacturers';

// Definimos las interfaces aquí para evitar el error de importación
interface ManufacturerFormData {
  name: string;
  website?: string | null;
  contact_info?: {
    email?: string;
    phone?: string;
    contact_person?: string;
    address?: string;
  };
}

interface ManufacturerFormProps {
  manufacturer?: Manufacturer | null;
  onSubmit: (data: ManufacturerFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const ManufacturerForm = ({ manufacturer, onSubmit, isSubmitting }: ManufacturerFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    contact_info: {
      email: '',
      phone: '',
      contact_person: '',
      address: ''
    },
    website: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form with existing data if editing
  useEffect(() => {
    if (manufacturer) {
      setFormData({
        name: manufacturer.name || '',
        contact_info: {
          email: manufacturer.contact_info?.email || '',
          phone: manufacturer.contact_info?.phone || '',
          contact_person: manufacturer.contact_info?.contact_person || '',
          address: manufacturer.contact_info?.address || ''
        },
        website: manufacturer.website || ''
      });
    }
  }, [manufacturer]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('contact_info.')) {
      const contactField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Manufacturer name is required';
    }

    if (formData.contact_info.email && !/\S+@\S+\.\S+/.test(formData.contact_info.email)) {
      newErrors['contact_info.email'] = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData: ManufacturerFormData = {
        name: formData.name.trim(),
        website: formData.website.trim() || null
      };

      const contactInfo = { ...formData.contact_info };
      Object.keys(contactInfo).forEach(key => {
        if (!contactInfo[key as keyof typeof contactInfo]) {
          delete contactInfo[key as keyof typeof contactInfo];
        }
      });

      if (Object.keys(contactInfo).length > 0) {
        submitData.contact_info = contactInfo;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/manufacturers');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to manufacturers</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {manufacturer ? 'Edit Manufacturer' : 'Create New Manufacturer'}
        </h1>
        <p className="text-gray-600 mt-2">
          {manufacturer 
            ? 'Update the manufacturer information.' 
            : 'Fill in the information to add a new manufacturer to the system.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g.: Pfizer, Roche, Bayer"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
                placeholder="e.g.: https://www.example.com"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.contact_info.email}
                onChange={(e) => handleInputChange('contact_info.email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white ${
                  errors['contact_info.email'] ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="example@company.com"
              />
              {errors['contact_info.email'] && (
                <p className="mt-1 text-sm text-red-600">{errors['contact_info.email']}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.contact_info.phone}
                onChange={(e) => handleInputChange('contact_info.phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                id="contact_person"
                value={formData.contact_info.contact_person}
                onChange={(e) => handleInputChange('contact_info.contact_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
                placeholder="Main contact name"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                value={formData.contact_info.address}
                onChange={(e) => handleInputChange('contact_info.address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none text-gray-900 bg-white"
                placeholder="Manufacturer's full address"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{manufacturer ? 'Update' : 'Create'} Manufacturer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};