// api/fr_veg.ts

import apiClient from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
}

export interface DisinfectionCatalog {
  'Légumes': Product[];
  'Fruits': Product[];
}

export interface ProtocolSaveRequest {
  date: string;
  products: Array<{ id: string; name: string; qty: string }>;
  lavage: boolean;
  rincage: boolean;
  timer: number;
  chlorinePpm: number | null;
  checklist: {
    cl_bacs: boolean;
    cl_doseur: boolean;
    cl_fuite: boolean;
  };
  comment: string;
  user: string;
}

// ─── API Service ──────────────────────────────────────────────────────────────
const frVegApi = {
  /**
   * Récupère le catalogue initial via l'API Nett-Desi.
   * Endpoint: [GET] /api/v1/fr-veg/init-data
   *
   * Le backend doit renvoyer un objet { "Légumes": [...], "Fruits": [...] }
   * On normalise la réponse pour garantir la structure attendue.
   */
  getInitialData: async (): Promise<DisinfectionCatalog> => {
    try {
      const response = await apiClient.get('/fr-veg/init-data');
      const raw = response.data;

      // Normalisation défensive : on s'assure que les deux clés existent
      const catalog: DisinfectionCatalog = {
        'Légumes': Array.isArray(raw?.['Légumes']) ? raw['Légumes'] : [],
        'Fruits':  Array.isArray(raw?.['Fruits'])  ? raw['Fruits']  : [],
      };

      return catalog;
    } catch (error: any) {
      if (error.response) {
        console.error('[fr-veg] Erreur serveur:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('[fr-veg] Pas de réponse serveur (vérifiez la connexion).');
      } else {
        console.error('[fr-veg] Erreur de configuration:', error.message);
      }
      throw new Error('Impossible de charger le catalogue de produits.');
    }
  },

  /**
   * Enregistre le rapport de désinfection.
   * Endpoint: [POST] /api/v1/fr-veg/store
   */
  saveProtocol: async (data: ProtocolSaveRequest): Promise<void> => {
    try {
      await apiClient.post('/fr-veg/store', data);
    } catch (error: any) {
      console.error('[fr-veg] Erreur saveProtocol:', error?.response?.data ?? error.message);
      throw new Error("Échec de l'enregistrement du protocole.");
    }
  },
};

export default frVegApi;