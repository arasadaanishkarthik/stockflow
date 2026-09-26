import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import {
  Truck,
  MapPin,
  Calendar,
  Package,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  ShieldCheck,
  Building
} from 'lucide-react';

export const DeliveryDetailModal = ({ isOpen, onClose, delivery }) => {
  const { advanceDeliveryStatus, validateDelivery, products } = useInventory();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!delivery) return null;

  const isDone = delivery.status === 'Done';
  const isCanceled = delivery.status === 'Canceled' || delivery.status === 'Cancelled';
  const whId = delivery.warehouseId;
  const whName = delivery.warehouseName;

  const totalDeliveredQty = (delivery.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);

  // Stepper definition
  const stages = ['Draft', 'Picking', 'Packing', 'Ready', 'Done'];
  const currentStageIndex = stages.indexOf(delivery.status);

  // Status transitions
  const getNextActionConfig = () => {
    if (delivery.status === 'Draft') {
      return {
        label: 'Advance to Picking',
        icon: ArrowRight,
        action: () => advanceDeliveryStatus(delivery.id),
        variant: 'secondary'
      };
    }
    if (delivery.status === 'Picking') {
      return {
        label: 'Advance to Packing',
        icon: ArrowRight,
        action: () => advanceDeliveryStatus(delivery.id),
        variant: 'secondary'
      };
    }
    if (delivery.status === 'Packing' || delivery.status === 'Ready') {
      return {
        label: 'Validate & Dispatch',
        icon: CheckCircle2,
        action: () => setIsConfirmOpen(true),
        variant: 'danger'
      };
    }
    return null;
  };

  const nextActionConfig = getNextActionConfig();

  const handleConfirmValidate = () => {
    const success = validateDelivery(delivery.id);
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
        title={`Delivery Order: #${delivery.deliveryId || delivery.id}`}
        subtitle={`Scheduled on ${formatDate(delivery.date)}`}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <StatusBadge status={delivery.status} size="md" />
              <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                delivery.priority === 'High' || delivery.priority === 'Urgent'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 text-slate-300'
              }`}>
                {delivery.priority} Priority
              </span>
              {isDone && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stock Reduced
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>

              {/* Sequential next action */}
              {!isDone && !isCanceled && nextActionConfig && (
                <Button
                  variant={nextActionConfig.variant}
                  size="sm"
                  icon={nextActionConfig.icon}
                  onClick={nextActionConfig.action}
                >
                  {nextActionConfig.label}
                </Button>
              )}

              {isDone && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Validated & Dispatched
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

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Truck className="w-3.5 h-3.5 text-blue-500" /> Customer
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{delivery.customer}</p>
              <p className="text-[11px] text-slate-500">{delivery.customerEmail || 'No email provided'}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Building className="w-3.5 h-3.5 text-emerald-500" /> Dispatch Warehouse
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{whName}</p>
              <p className="text-[11px] text-slate-500 font-mono">Location ID: {whId}</p>
            </div>
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Courier & Tracking
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{delivery.carrier || 'FedEx'}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                {delivery.trackingNumber || 'Pending'}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          {delivery.shippingAddress && (
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">Shipping Destination:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{delivery.shippingAddress}</span>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-500" />
                Dispatched Items ({delivery.items?.length || 0})
              </h4>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                -{totalDeliveredQty} total units
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Product Name & SKU</th>
                    <th className="py-2.5 px-3 text-right">Available in WH</th>
                    <th className="py-2.5 px-3 text-right">Dispatch Qty</th>
                    <th className="py-2.5 px-3 text-right">Stock After</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(delivery.items || []).map((item, idx) => {
                    const prod = products.find(p =>
                      (item.productId && p.id && String(item.productId).toLowerCase() === String(p.id).toLowerCase()) ||
                      (item.sku && p.sku && String(item.sku).toLowerCase() === String(p.sku).toLowerCase()) ||
                      (item.productName && p.name && String(item.productName).trim().toLowerCase() === String(p.name).trim().toLowerCase())
                    );
                    const currentWhStock = Number(prod?.stockByWarehouse?.[whId] || 0);
                    const remainingWhStock = isDone ? currentWhStock : currentWhStock - Number(item.qty || 0);

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
                          {currentWhStock} {item.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                          -{item.qty} {item.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {isDone ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {currentWhStock} (Current)
                            </span>
                          ) : remainingWhStock >= 0 ? (
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {remainingWhStock} {item.unit || 'units'}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold">
                              Insufficient ({remainingWhStock})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(Number(item.qty || 0) * Number(item.unitPrice || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <td colSpan="5" className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      Total Order Value:
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 font-mono text-sm">
                      {formatCurrency(delivery.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {delivery.notes && (
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Dispatch Instructions:
              </span>
              <p className="text-slate-700 dark:text-slate-300">{delivery.notes}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog before validation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmValidate}
        title="Validate & Dispatch Delivery?"
        message="Validating this delivery will decrease inventory stock. This action cannot be undone."
        confirmText="Validate & Dispatch"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};
