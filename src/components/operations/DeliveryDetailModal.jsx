import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useInventory } from '../../context/InventoryContext';
import { Truck, MapPin, Calendar, Package, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const DeliveryDetailModal = ({ isOpen, onClose, delivery }) => {
  const { advanceDeliveryStatus, cancelDelivery } = useInventory();
  if (!delivery) return null;

  const isDone = delivery.status === 'Done';
  const isCanceled = delivery.status === 'Canceled';

  const getNextActionLabel = () => {
    if (delivery.status === 'Draft') return 'Advance to Picking';
    if (delivery.status === 'Picking') return 'Advance to Packing';
    if (delivery.status === 'Packing' || delivery.status === 'Ready') return 'Validate & Dispatch (Reduce Stock)';
    return null;
  };

  const nextAction = getNextActionLabel();

  const handleAdvance = () => {
    advanceDeliveryStatus(delivery.id);
    onClose();
  };

  const handleCancel = () => {
    cancelDelivery(delivery.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delivery Order: #${delivery.deliveryId}`}
      subtitle={`Created on ${formatDate(delivery.date)}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <StatusBadge status={delivery.status} size="md" />
            <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
              delivery.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
            }`}>
              {delivery.priority} Priority
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isDone && !isCanceled && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                icon={XCircle}
                onClick={handleCancel}
              >
                Cancel Delivery
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {!isDone && !isCanceled && nextAction && (
              <Button
                variant="primary"
                size="sm"
                icon={delivery.status === 'Packing' ? CheckCircle2 : ArrowRight}
                onClick={handleAdvance}
              >
                {nextAction}
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
              <Truck className="w-3.5 h-3.5" /> Customer
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{delivery.customer}</p>
            <p className="text-[11px] text-slate-500">{delivery.customerEmail}</p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5" /> Shipping Address
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{delivery.shippingAddress}</p>
            <p className="text-[11px] text-slate-500 font-mono">Source: {delivery.warehouseName}</p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5" /> Carrier / Tracking
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{delivery.carrier || 'FedEx'}</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold">
              {delivery.trackingNumber}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-500" />
            Dispatched Items
          </h4>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(delivery.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                      -{item.qty} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(Number(item.qty || 0) * Number(item.unitPrice || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <td colSpan="4" className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
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
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Dispatch Instructions:
            </span>
            <p className="text-slate-700 dark:text-slate-300">{delivery.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
