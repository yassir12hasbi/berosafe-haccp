// ─── api/traceability.ts ──────────────────────────────────────────────────────
import apiClient from './client';

// ── Types ──
export interface Product {
  id: number;
  name: string;
  category_id: number;
  max_dlc: number;
  category_name?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface TraceabilityBatch {
  id: number;
  product_id: number;
  product_name?: string;
  lot_number: string;
  zone: string | null;
  opened_at: string;
  expires_at: string;
  status: 'active' | 'closed';
  closed_at: string | null;
  photo: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TraceabilityInitialData {
  products: Product[];
  categories: Category[];
  zones: string[];
}

export interface StoreBatchPayload {
  product_id: number;
  lot_number: string;
  zone?: string | null;
  opened_at: string;
  photo?: string | null;
}

export interface UpdateBatchPayload {
  lot_number?: string;
  zone?: string | null;
  expires_at?: string;
  status?: 'active' | 'closed';
  photo?: string | null;
}

// ── API Class ──
class TraceabilityApi {
  /**
   * [GET] api/v1/traceability/init-data
   * Récupère les données initiales (produits, catégories, zones)
   */
  async getInitialData(): Promise<TraceabilityInitialData> {
    const response = await apiClient.get<TraceabilityInitialData>('/traceability/init-data');
    return response.data;
  }

  /**
   * [GET] api/v1/traceability/batches
   * Récupère les lots pour un mois/année donné
   */
  async getBatches(month: number, year: number): Promise<TraceabilityBatch[]> {
    const response = await apiClient.get<TraceabilityBatch[]>('/traceability/batches', {
      params: { month, year }
    });
    return response.data;
  }

  /**
   * [POST] api/v1/traceability/store
   * Crée un nouveau lot
   */
  async storeBatch(data: StoreBatchPayload): Promise<TraceabilityBatch> {
    const response = await apiClient.post<TraceabilityBatch>('/api/v1/traceability/store', data);
    return response.data;
  }

  /**
   * [POST] api/v1/traceability/store (avec photo en multipart)
   */
  async storeBatchWithPhoto(data: StoreBatchPayload, photoUri: string): Promise<TraceabilityBatch> {
    const formData = new FormData();
    
    // Sur React Native, on utilise uri pour le fichier
    const photoFile = {
      uri: photoUri,
      type: 'image/jpeg',
      name: `lot_photo_${Date.now()}.jpg`,
    } as any;

    formData.append('photo', photoFile);
    formData.append('product_id', String(data.product_id));
    formData.append('lot_number', data.lot_number);
    if (data.zone) formData.append('zone', data.zone);
    formData.append('opened_at', data.opened_at);

    const response = await apiClient.post<TraceabilityBatch>('/api/v1/traceability/store', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * [PUT] api/v1/traceability/update/{batch}
   * Met à jour un lot existant
   */
  async updateBatch(batchId: number, data: UpdateBatchPayload): Promise<TraceabilityBatch> {
    const response = await apiClient.put<TraceabilityBatch>(`/api/v1/traceability/update/${batchId}`, data);
    return response.data;
  }

  /**
   * [PUT] api/v1/traceability/update/{batch} (avec photo en multipart)
   */
  async updateBatchWithPhoto(batchId: number, data: UpdateBatchPayload, photoUri: string): Promise<TraceabilityBatch> {
    const formData = new FormData();
    
    const photoFile = {
      uri: photoUri,
      type: 'image/jpeg',
      name: `lot_photo_${Date.now()}.jpg`,
    } as any;

    formData.append('photo', photoFile);
    if (data.lot_number) formData.append('lot_number', data.lot_number);
    if (data.zone) formData.append('zone', data.zone);
    if (data.expires_at) formData.append('expires_at', data.expires_at);
    if (data.status) formData.append('status', data.status);
    formData.append('_method', 'PUT'); // Pour les serveurs qui ne supportent pas PUT avec FormData

    const response = await apiClient.post<TraceabilityBatch>(`/api/v1/traceability/update/${batchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * [DELETE] api/v1/traceability/destroy/{batch}
   * Supprime un lot
   */
  async deleteBatch(batchId: number): Promise<void> {
    await apiClient.delete(`/api/v1/traceability/destroy/${batchId}`);
  }
}

export default new TraceabilityApi();