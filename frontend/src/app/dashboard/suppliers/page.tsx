//fronend/src/app/dashboard/suppliers/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSuppliers } from '@/hooks/useSuppliers';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Plus, RefreshCw, Building } from 'lucide-react';
import SupplierStatsCards from '@/components/features/suppliers/SupplierStatsCards';
import SupplierTable from '@/components/features/suppliers/SupplierTable';
import SupplierFilters from '@/components/features/suppliers/SupplierFilters';

export default function SuppliersPage() {
  const { 
    suppliers = [], 
    isLoading, 
    error, 
    stats,
    deleteSupplier,
    isDeleting,
    refetch
  } = useSuppliers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_info?.persona_contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_info?.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = filters.country ? supplier.country_code === filters.country : true;
    const matchesStatus = filters.status 
      ? (filters.status === 'active' ? supplier.is_active : !supplier.is_active)
      : true;

    return matchesSearch && matchesCountry && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setFilters(prev => ({ ...prev, search }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading suppliers</h2>
          <p className="text-gray-600 mb-6">There was a problem loading the supplier information.</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-2">Manage your suppliers and their contact information</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="justify-center"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/suppliers/new" className="w-full sm:w-auto">
            <Button className="w-full justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <SupplierStatsCards stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <SupplierFilters
        filters={filters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {/* Suppliers table */}
      <SupplierTable
        suppliers={paginatedSuppliers}
        loading={isLoading}
        onDelete={deleteSupplier}
        isDeleting={isDeleting}
        pagination={{
          page: currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Pagination info */}
      {filteredSuppliers.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {paginatedSuppliers.length} out of {filteredSuppliers.length} suppliers
          {totalPages > 1 && ` - Page ${currentPage} of ${totalPages}`}
        </div>
      )}
    </div>
  );
}