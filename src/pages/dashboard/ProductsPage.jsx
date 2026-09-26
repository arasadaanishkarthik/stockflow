import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { AddProductModal } from '../../components/products/AddProductModal';
import { EditProductModal } from '../../components/products/EditProductModal';
import { ProductDetailModal } from '../../components/products/ProductDetailModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import {
  Package,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  Warehouse,
  Tags,
  Activity,
  Layers
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const ProductsPage = () => {
  const { products, categories, warehouses, deleteProduct } = useInventory();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Check URL query parameters (e.g. ?action=new or ?status=Low Stock)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setSelectedStatus(statusParam);
    const actionParam = searchParams.get('action');
    if (actionParam === 'new') setIsAddOpen(true);
  }, [searchParams]);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filtered Products
  const filteredProducts = products.filter(prod => {
    const matchesQuery =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.barcode && prod.barcode.includes(searchQuery));

    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || prod.status === selectedStatus;

    let matchesWarehouse = true;
    if (selectedWarehouse !== 'All') {
      matchesWarehouse = (prod.stockByWarehouse?.[selectedWarehouse] || 0) > 0;
    }

    return matchesQuery && matchesCategory && matchesStatus && matchesWarehouse;
  });

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      ID: p.id,
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      TotalStock: p.totalStock,
      Unit: p.unit,
      CostPrice: p.costPrice,
      SellingPrice: p.sellingPrice,
      Status: p.status,
      ReorderThreshold: p.minReorderPoint,
      LastUpdated: p.lastUpdated
    }));
    exportToCSV(exportData, `stockflow-products-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/40">
            {row.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
              {row.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-mono">{row.sku}</span>
              {row.barcode && <span>• GTIN: {row.barcode}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs">
          {row.category}
        </span>
      )
    },
    {
      header: 'Location Breakdown',
      accessor: 'stockByWarehouse',
      render: (row) => {
        const activeWhs = Object.keys(row.stockByWarehouse || {}).filter(k => row.stockByWarehouse[k] > 0);
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {activeWhs.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No warehouse stock</span>
            ) : (
              activeWhs.map(wh => (
                <span
                  key={wh}
                  className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                  title={`${row.stockByWarehouse[wh]} ${row.unit}`}
                >
                  {wh}: <strong>{row.stockByWarehouse[wh]}</strong>
                </span>
              ))
            )}
          </div>
        );
      }
    },
    {
      header: 'Available Stock',
      accessor: 'totalStock',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-mono">
            {row.totalStock.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 ml-1 font-normal">{row.unit}</span>
          <p className="text-[10px] text-slate-400">Min: {row.minReorderPoint}</p>
        </div>
      )
    },
    {
      header: 'Price / Val',
      accessor: 'sellingPrice',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">
            {formatCurrency(row.sellingPrice)}
          </span>
          <p className="text-[10px] text-slate-400 font-mono">Cost: {formatCurrency(row.costPrice)}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedProduct(row);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(row);
              setIsEditOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(row);
              setIsDeleteConfirmOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your inventory products, SKUs, and cross-warehouse availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExport}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddOpen(true)}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search products by name, SKU, category, or barcode..."
          className="flex-1 max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <FilterDropdown
            label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={['All', ...categories]}
            icon={Tags}
          />

          {/* Warehouse Filter */}
          <FilterDropdown
            label="Warehouse"
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            options={[
              { value: 'All', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w.id, label: w.name }))
            ]}
            icon={Warehouse}
          />

          {/* Stock Status Filter */}
          <FilterDropdown
            label="Stock Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock']}
            icon={Activity}
          />

          {(selectedCategory !== 'All' || selectedWarehouse !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedWarehouse('All');
                setSelectedStatus('All');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyField="id"
        pageSize={8}
        emptyTitle="No matching products found"
        emptyDescription="Try adjusting your filters or click 'Add Product' to create a new SKU."
        onRowClick={(row) => {
          setSelectedProduct(row);
          setIsDetailOpen(true);
        }}
      />

      {/* Add Product Modal */}
      <AddProductModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        product={selectedProduct}
      />

      {/* Product Details Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
        onEdit={(prod) => {
          setSelectedProduct(prod);
          setIsEditOpen(true);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => selectedProduct && deleteProduct(selectedProduct.id)}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}" (${selectedProduct?.sku})? This will remove all associated stock records.`}
        confirmText="Delete SKU"
      />
    </div>
  );
};
