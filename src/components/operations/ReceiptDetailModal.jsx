import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import {
  CheckCircle2,
  Building,
  Calendar,
  Package,
  FileText,
  ArrowDownToLine,
  Clock,
  Truck,
  Layers,
  MapPin
} from 'lucide-react';

export const ReceiptDetailModal = ({ isOpen, onClose, receipt }) => {
  const { validateReceipt, products } = useInventory();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!receipt) return null;

  const isDone = receipt.status === 'Done';
  const isCanceled = receipt.status === 'Canceled' || receipt.status === 'Cancelled';
  const totalUnits = (receipt.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const whId = receipt.warehouseId;
  const whName = receipt.warehouseName;

  // Stepper definition for Inbound PO
  const stages = ['Draft', 'Waiting', 'Ready', 'Done'];
  const currentStageIndex = stages.indexOf(receipt.status);

  const handleConfirmValidate = () => {
    const success = validateReceipt(receipt.id);
    setIsConfirmOpen(false);
    if (success !== false) {
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Receipt Details: #${receipt.receiptNumber}`}
        subtitle={`Recorded on ${formatDate(receipt.date)}`}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <StatusBadge status={receipt.status} size="md" />
              {isDone && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stock Updated
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              {!isDone && !isCanceled ? (
                <Button
                  variant="success"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => setIsConfirmOpen(true)}
                >
                  Validate Receipt
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Validated & Stock Added
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Visual Workflow Stepper */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between relative">
              {stages.map((stage, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage} className="flex-1 flex flex-col items-center relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone && stage === 'Done'
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isPassed || (isDone && stage === 'Done') ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 font-semibold tracking-tight ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : isPassed || (isDone && stage === 'Done')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {stage}
                    </span>
                  </div>
                );
              })}

              {/* Connector line */}
              <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
            </div>
          </div>

          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Building className="w-3.5 h-3.5 text-blue-500" /> Supplier Vendor
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{receipt.supplier}</p>
              <p className="text-[11px] text-slate-500">{receipt.supplierEmail || 'vendor@supply.io'}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Destination Warehouse
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{receipt.warehouseName}</p>
              <p className="text-[11px] text-slate-500 font-mono">Location ID: {receipt.warehouseId}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Expected Arrival
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{receipt.expectedDate}</p>
              <p className="text-[11px] text-slate-500">Handled by: {receipt.receivedBy || 'Receiving Bay'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-500" />
                Items in Receipt ({receipt.items?.length || 0})
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +{totalUnits} total units
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Product Name & SKU</th>
                    <th className="py-2.5 px-3 text-right">Current WH Stock</th>
                    <th className="py-2.5 px-3 text-right">Inbound Qty</th>
                    <th className="py-2.5 px-3 text-right">Stock After</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(receipt.items || []).map((item, idx) => {
                    const prod = products.find(p =>
                      (item.productId && p.id && String(item.productId).toLowerCase() === String(p.id).toLowerCase()) ||
                      (item.sku && p.sku && String(item.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
                      (item.productName && p.name && String(item.productName).trim().toLowerCase() === String(p.name).trim().toLowerCase())
                    );
                    const currentWhStock = Number(prod?.stockByWarehouse?.[whId] || 0);
                    const anticipatedStock = isDone ? currentWhStock : currentWhStock + Number(item.qty || 0);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.sku}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {isDone ? (currentWhStock - Number(item.qty || 0)) : currentWhStock} {item.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          +{item.qty} {item.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700 dark:text-emerald-300">
                          {anticipatedStock} {item.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(Number(item.qty || 0) * Number(item.unitCost || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <td colSpan="5" className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      Total Inbound PO Value:
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 font-mono text-sm">
                      {formatCurrency(receipt.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Logistics Notes:
              </span>
              <p className="text-slate-700 dark:text-slate-300">{receipt.notes}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog before validation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmValidate}
        title="Validate Receipt?"
        message="Validating this receipt will increase inventory stock. This action cannot be undone."
        confirmText="Validate Receipt"
        cancelText="Cancel"
        variant="success"
      />
    </>
  );
};
