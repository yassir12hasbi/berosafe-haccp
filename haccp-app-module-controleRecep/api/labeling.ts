import client from './client';

export interface Product {
  id: number;
  name: string;
  category_id: number;
  max_dlc: number | null;
  category: {
    id: number;
    name: string;
  };
}

export interface Category {
  id: number;
  name: string;
}

export interface LabelingInitialData {
  categories: Category[];
  products: Product[];
}

export interface PrintBatchRequest {
  product_id: number;
  lot_number: string;
  zone?: string | null;
  opened_at?: string;
  expires_at?: string;
  quantity: number;
}

const labelingApi = {
  getInitialData: async (): Promise<LabelingInitialData> => {
    const response = await client.get('/labeling/init-data');
    return response.data;
  },

  printBatch: async (data: PrintBatchRequest) => {
    const response = await client.post('/labeling/print', data);
    return response.data;
  },
};

export default labelingApi;
