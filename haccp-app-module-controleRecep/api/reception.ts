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
  min_temperature?: number | null;
  max_temperature?: number | null;
}

export interface Checklist {
  id: number;
  name: string;
}

export interface ProductChecklistResponse {
  product_id: number;
  product_name: string;
  min_temperature: number | null;
  max_temperature: number | null;
  checklists: Checklist[];
}

export interface ReceptionInitialData {
  suppliers: Supplier[];
  categories: Category[];
  products: Product[];
}

export interface ReceptionLine {
  product_id: number;
  measured_temperature?: number;
  expiration_date?: string;
  lot_number?: string;
  is_compliant: boolean;
  non_compliance_reason?: string | null;
  photo?: string; // Base64
  checklists?: {
    checklist_id: number;
    recorded_value: boolean;
  }[];
}

export interface StoreReceptionRequest {
  supplier_id: number;
  delivery_note_number?: string | null;
  received_at: string; // Y-m-d H:i:s
  global_photo?: string;
  lines: ReceptionLine[];
}

const receptionApi = {
  /**
   * Fetches the initial data for the reception module (suppliers, categories, products).
   */
  getInitialData: async (): Promise<ReceptionInitialData> => {
    const response = await client.get<ReceptionInitialData>('/reception/init-data');
    return response.data;
  },

  /**
   * Fetches specific checklists and temperature constraints for a product.
   */
  getProductChecklists: async (productId: number): Promise<ProductChecklistResponse> => {
    const response = await client.get<ProductChecklistResponse>(`/reception/products/${productId}/checklists`);
    return response.data;
  },

  /**
   * Stores the final reception data.
   */
  storeReception: async (data: StoreReceptionRequest) => {
    const response = await client.post('/reception/store', data);
    return response.data;
  },
};

export default receptionApi;
