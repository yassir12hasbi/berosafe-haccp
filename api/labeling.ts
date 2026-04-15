import client from './client';

export interface Product {
  id: number;
  name: string;
  category_id: number;
  max_dlc: number | null;
  // Ajout de la propriété allergens pour correspondre aux données reçues et utilisées dans l'UI
  allergens: string[];
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

// Interface pour la création d'une catégorie
interface StoreCategoryRequest {
  name: string;
}

// Interface pour la création d'un produit
interface StoreProductRequest {
  name: string;
  category_id: number;
  max_dlc: number;
  allergens: string[];
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

  // ─── NOUVEAU : Ajouter une catégorie ───
  storeCategory: async (data: StoreCategoryRequest): Promise<Category> => {
    // Assurez-vous que l'URL correspond bien à votre route backend (ex: /labeling/categories)
    const response = await client.post('/labeling/categories', data);
    return response.data;
  },

  // ─── NOUVEAU : Ajouter un produit ───
  storeProduct: async (data: StoreProductRequest): Promise<Product> => {
    // Assurez-vous que l'URL correspond bien à votre route backend (ex: /labeling/products)
    const response = await client.post('/labeling/products', data);
    return response.data;
  },
};

export default labelingApi;