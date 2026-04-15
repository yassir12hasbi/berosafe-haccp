import client from './client';

export interface Supplier {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  max_dlc: number | null;
  category?: Category;
}

export interface TraceabilityBatch {
  id: number;
  product_id: number;
  lot_number: string;
  zone: string | null;
  opened_at: string; // Y-m-d
  expires_at: string; // Y-m-d
  closed_at: string | null; // Y-m-d
  status: 'active' | 'closed';
  product?: Product;
}

export interface TraceabilityInitialData {
  categories: Category[];
  products: Product[];
}

export interface StoreBatchRequest {
  product_id: number;
  lot_number: string;
  zone?: string | null;
  opened_at: string; // Y-m-d
}

export interface UpdateBatchRequest {
  lot_number: string;
  zone?: string | null;
  expires_at: string; // Y-m-d
  status: 'active' | 'closed';
}

const traceabilityApi = {
  /**
   * Fetches the initial data for the traceability module (categories, products).
   */
  getInitialData: async (): Promise<TraceabilityInitialData> => {
    const response = await client.get<TraceabilityInitialData>('/traceability/init-data');
    return response.data;
  },

  /**
   * Fetches the batches for a specific month and year.
   */
  getBatches: async (month: number, year: number): Promise<TraceabilityBatch[]> => {
    const response = await client.get<TraceabilityBatch[]>('/traceability/batches', {
      params: { month, year }
    });
    return response.data;
  },

  /**
   * Stores a new traceability batch.
   */
  storeBatch: async (data: StoreBatchRequest) => {
    const response = await client.post('/traceability/store', data);
    return response.data;
  },

  /**
   * Updates an existing traceability batch.
   */
  updateBatch: async (id: number, data: UpdateBatchRequest) => {
    const response = await client.put(`/traceability/update/${id}`, data);
    return response.data;
  },

  /**
   * Deletes a traceability batch.
   */
  deleteBatch: async (id: number) => {
    const response = await client.delete(`/traceability/destroy/${id}`);
    return response.data;
  }
};

export default traceabilityApi;
