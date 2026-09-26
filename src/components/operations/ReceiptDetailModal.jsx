import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import { CheckCircle2, Building, Calendar, User, Package, FileText } from 'lucide-react';

export const ReceiptDetailModal = ({ isOpen, onClose, receipt }) => {
  const { validateReceipt } = useInventory();
  if (!receipt) return null;

  const isDone = receipt.status === 'Done';

  const handleValidate = () => {
    validateReceipt(receipt.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receipt Details: #${receipt.receiptNumber}`}
      subtitle={`Created on ${formatDate(receipt.date)}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <StatusBadge status={receipt.status} size="md" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {!isDone && (
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                onClick={handleValidate}
              >
                Validate Receipt & Increase Stock
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Building className="w-3.5 h-3.5" /> Supplier
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{receipt.supplier}</p>
            <p className="text-[11px] text-slate-500">{receipt.supplierEmail}</p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Building className="w-3.5 h-3.5" /> Destination Warehouse
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{receipt.warehouseName}</p>
            <p className="text-[11px] text-slate-500 font-mono">{receipt.warehouseId}</p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5" /> Expected Date
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{receipt.expectedDate}</p>
            <p className="text-[11px] text-slate-500">Received By: {receipt.receivedBy}</p>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-500" />
            Items in Receipt
          </h4>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(receipt.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{item.qty} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(Number(item.qty || 0) * Number(item.unitCost || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <td colSpan="4" className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
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
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Logistics Notes:
            </span>
            <p className="text-slate-700 dark:text-slate-300">{receipt.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
