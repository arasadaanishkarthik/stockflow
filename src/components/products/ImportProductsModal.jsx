import React, { useState, useRef } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';

// Sample CSV Content for Download
const SAMPLE_CSV_CONTENT = `SKU,Product Name,Category,Unit,Current Stock,Reorder Level,Warehouse,Cost Price,Selling Price
SKU-9001,Wireless Ergonomic Mouse,Electronics,pcs,45,15,WH-MAIN,18.50,34.99
SKU-9002,Premium Mechanical Keyboard,Electronics,pcs,30,10,WH-MAIN,45.00,89.99
SKU-9003,Recycled Cardboard Shipping Box,Packaging,box,250,50,WH-MAIN,0.85,1.99
SKU-9004,Heavy Duty Steel Shelving Unit,Furniture,units,12,5,WH-SEC,85.00,149.99
`;

export const ImportProductsModal = ({ isOpen, onClose }) => {
  const { products, warehouses, categories, importProductsBatch } = useInventory();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validatedRows, setValidatedRows] = useState([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [defaultWarehouse, setDefaultWarehouse] = useState('WH-MAIN');

  const existingSkus = new Set(products.map(p => p.sku.toUpperCase()));
  const validWarehouseCodes = new Set(warehouses.map(w => w.code || w.id));

  // Download Sample CSV
  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stockflow_product_import_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Sample Downloaded', 'Use this format for importing products.');
  };

  // Reset modal state
  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setValidatedRows([]);
    setValidCount(0);
    setInvalidCount(0);
    setIsProcessing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Standard CSV Line Parser (handles quotes & escaped quotes)
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Process File Selection
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      toast.error('Invalid File Type', 'Please upload a valid .csv file.');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseAndValidateCSV(text);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      toast.error('File Reading Error', 'Failed to read the uploaded CSV file.');
      setIsProcessing(false);
    };
    reader.readAsText(selectedFile);
  };

  // Main Parsing & Validation Logic
  const parseAndValidateCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      toast.error('Empty CSV', 'The uploaded CSV file contains no product data rows.');
      setValidatedRows([]);
      setValidCount(0);
      setInvalidCount(0);
      return;
    }

    // Header extraction
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Map header names to standardize fields
    const getFieldIndex = (possibleNames) => {
      return headers.findIndex(h => possibleNames.some(p => h.includes(p)));
    };

    const skuIdx = getFieldIndex(['sku', 'code', 'productcode']);
    const nameIdx = getFieldIndex(['name', 'productname', 'title', 'item']);
    const catIdx = getFieldIndex(['category', 'cat', 'type']);
    const unitIdx = getFieldIndex(['unit', 'uom', 'measure']);
    const stockIdx = getFieldIndex(['stock', 'currentstock', 'initialstock', 'qty', 'quantity']);
    const reorderIdx = getFieldIndex(['reorder', 'minreorder', 'threshold', 'level']);
    const whIdx = getFieldIndex(['warehouse', 'location', 'wh', 'facility']);
    const costIdx = getFieldIndex(['cost', 'costprice', 'buyprice']);
    const sellIdx = getFieldIndex(['sell', 'sellingprice', 'price']);

    const fileSkus = new Set();
    const rows = [];
    let valid = 0;
    let invalid = 0;

    for (let i = 1; i < lines.length; i++) {
      const rawValues = parseCSVLine(lines[i]);
      if (rawValues.every(val => val === '')) continue; // skip blank rows

      const rowNum = i + 1;
      const sku = skuIdx !== -1 ? rawValues[skuIdx] : '';
      const name = nameIdx !== -1 ? rawValues[nameIdx] : '';
      const category = catIdx !== -1 && rawValues[catIdx] ? rawValues[catIdx] : 'Raw Materials';
      const unit = unitIdx !== -1 && rawValues[unitIdx] ? rawValues[unitIdx] : 'units';
      const stockRaw = stockIdx !== -1 ? rawValues[stockIdx] : '0';
      const reorderRaw = reorderIdx !== -1 ? rawValues[reorderIdx] : '30';
      const warehouse = whIdx !== -1 && rawValues[whIdx] ? rawValues[whIdx].toUpperCase() : defaultWarehouse;
      const costRaw = costIdx !== -1 ? rawValues[costIdx] : '10.0';
      const sellRaw = sellIdx !== -1 ? rawValues[sellIdx] : '19.99';

      const errors = [];

      // Validation 1: Missing Product Name
      if (!name || name.trim() === '') {
        errors.push('Missing Product Name');
      }

      // Validation 2: Missing SKU
      if (!sku || sku.trim() === '') {
        errors.push('Missing SKU Code');
      }

      const formattedSku = sku.trim().toUpperCase();

      // Validation 3: Duplicate SKU in catalog
      if (formattedSku && existingSkus.has(formattedSku)) {
        errors.push(`Duplicate SKU in catalog (${formattedSku})`);
      }

      // Validation 4: Duplicate SKU repeated in CSV file
      if (formattedSku && fileSkus.has(formattedSku)) {
        errors.push(`Duplicate SKU in CSV file (${formattedSku})`);
      } else if (formattedSku) {
        fileSkus.add(formattedSku);
      }

      // Validation 5: Invalid Quantity
      const parsedStock = Number(stockRaw);
      if (isNaN(parsedStock) || parsedStock < 0) {
        errors.push(`Invalid stock quantity: "${stockRaw}"`);
      }

      // Validation 6: Invalid Reorder Point
      const parsedReorder = Number(reorderRaw);
      if (isNaN(parsedReorder) || parsedReorder < 0) {
        errors.push(`Invalid reorder level: "${reorderRaw}"`);
      }

      // Validation 7: Invalid Prices
      if (isNaN(Number(costRaw)) || Number(costRaw) < 0) {
        errors.push(`Invalid cost price: "${costRaw}"`);
      }
      if (isNaN(Number(sellRaw)) || Number(sellRaw) < 0) {
        errors.push(`Invalid selling price: "${sellRaw}"`);
      }

      const isValid = errors.length === 0;
      if (isValid) valid++; else invalid++;

      rows.push({
        rowNum,
        name: name.trim(),
        sku: formattedSku,
        category: category.trim(),
        unit: unit.trim(),
        totalStock: isNaN(parsedStock) ? 0 : parsedStock,
        minReorderPoint: isNaN(parsedReorder) ? 30 : parsedReorder,
        warehouse: warehouse.trim(),
        costPrice: isNaN(Number(costRaw)) ? 10 : Number(costRaw),
        sellingPrice: isNaN(Number(sellRaw)) ? 20 : Number(sellRaw),
        isValid,
        errors
      });
    }

    setValidatedRows(rows);
    setValidCount(valid);
    setInvalidCount(invalid);

    if (valid === 0 && rows.length > 0) {
      toast.error('Validation Failed', 'All rows in the CSV failed validation. Please check errors.');
    } else if (invalid > 0) {
      toast.warning('CSV Analyzed with Errors', `${valid} valid rows ready for import, ${invalid} rows have errors.`);
    } else {
      toast.success('CSV Validated Successfully', `All ${valid} products ready to import!`);
    }
  };

  // Perform Final Import
  const handleConfirmImport = () => {
    const validProductsToImport = validatedRows
      .filter(r => r.isValid)
      .map(r => ({
        name: r.name,
        sku: r.sku,
        category: r.category,
        unit: r.unit,
        totalStock: r.totalStock,
        minReorderPoint: r.minReorderPoint,
        warehouseId: r.warehouse,
        costPrice: r.costPrice,
        sellingPrice: r.sellingPrice
      }));

    if (validProductsToImport.length === 0) {
      toast.error('No Valid Products', 'There are no valid products to import.');
      return;
    }

    importProductsBatch(validProductsToImport, defaultWarehouse);
    handleClose();
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Products from CSV"
      size="xl"
    >
      <div className="space-y-6">
        {/* Step 1: Upload Dropzone if no file loaded */}
        {!file && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Click to upload or drag & drop your CSV file
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports standard CSV files (.csv, .txt) with header rows
                </p>
              </div>
            </div>

            {/* Template & Guidelines Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Need an example structure? Download our pre-formatted CSV template.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleDownloadSample}
                className="shrink-0"
              >
                Download Sample CSV
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Processing & Validated Results Preview */}
        {file && (
          <div className="space-y-4">
            {/* File info bar & Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • {validatedRows.length} rows parsed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleReset}
                >
                  Upload Different CSV
                </Button>
              </div>
            </div>

            {/* Validation KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  {validatedRows.length}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Rows</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Parsed from file</p>
                </div>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  {validCount}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Valid Products</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready to import</p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${invalidCount > 0 ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${invalidCount > 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {invalidCount}
                </div>
                <div>
                  <p className={`text-[11px] font-bold uppercase ${invalidCount > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-slate-500'}`}>Invalid Rows</p>
                  <p className="text-xs text-slate-500 font-medium">{invalidCount > 0 ? 'Will be skipped' : 'No errors found'}</p>
                </div>
              </div>
            </div>

            {/* Default Destination Warehouse Selector */}
            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs">
              <span className="font-semibold text-blue-900 dark:text-blue-300">
                Target Import Warehouse for Stock Intake:
              </span>
              <select
                value={defaultWarehouse}
                onChange={(e) => setDefaultWarehouse(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-600 dark:text-slate-300 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Stock</th>
                    <th className="py-2.5 px-3">Validation Result / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {validatedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.isValid ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/30' : 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/60'}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">#{row.rowNum}</td>
                      <td className="py-2.5 px-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {row.name || <span className="text-rose-500 italic">[Empty]</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {row.sku || <span className="text-rose-500 italic">[Empty]</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {row.totalStock} {row.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">Ready for catalog insertion</span>
                        ) : (
                          <div className="space-y-0.5">
                            {row.errors.map((err, errIdx) => (
                              <p key={errIdx} className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>

          {file && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={validCount === 0}
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Import {validCount} Valid {validCount === 1 ? 'Product' : 'Products'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
