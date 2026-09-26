/**
 * StockFlow API Service Placeholder
 * 
 * This module is architected to facilitate future integration with a real REST or GraphQL backend.
 * Currently, frontend mock state handles all CRUD and inventory ledger workflows.
 * 
 * Future Endpoints:
 * - GET /api/v1/products -> fetchProducts()
 * - POST /api/v1/products -> createProduct(data)
 * - POST /api/v1/receipts/validate/:id -> validateReceipt(id)
 * - POST /api/v1/deliveries/validate/:id -> validateDelivery(id)
 * - POST /api/v1/transfers -> createTransfer(data)
 * - POST /api/v1/adjustments -> applyAdjustment(data)
 * - GET /api/v1/ledger -> fetchLedger(filters)
 * - GET /api/v1/analytics/overview -> fetchDashboardMetrics()
 */

export const api = {
  products: {
    getAll: async () => Promise.resolve({ data: [] }),
    getById: async (id) => Promise.resolve({ data: { id } }),
    create: async (payload) => Promise.resolve({ data: payload }),
    update: async (id, payload) => Promise.resolve({ data: { id, ...payload } }),
    delete: async (id) => Promise.resolve({ success: true, id }),
  },
  receipts: {
    getAll: async () => Promise.resolve({ data: [] }),
    create: async (payload) => Promise.resolve({ data: payload }),
    validate: async (id) => Promise.resolve({ success: true, id }),
  },
  deliveries: {
    getAll: async () => Promise.resolve({ data: [] }),
    create: async (payload) => Promise.resolve({ data: payload }),
    validate: async (id) => Promise.resolve({ success: true, id }),
  },
  transfers: {
    getAll: async () => Promise.resolve({ data: [] }),
    create: async (payload) => Promise.resolve({ data: payload }),
  },
  adjustments: {
    getAll: async () => Promise.resolve({ data: [] }),
    create: async (payload) => Promise.resolve({ data: payload }),
  },
  warehouses: {
    getAll: async () => Promise.resolve({ data: [] }),
  },
  alerts: {
    getAll: async () => Promise.resolve({ data: [] }),
    markAsRead: async (id) => Promise.resolve({ success: true, id }),
  }
};
