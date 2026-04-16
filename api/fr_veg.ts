import apiClient from './client';

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
  date_time: string;
  products: Array<{ desi_product_id: string; quantity_kg: string; name?: string }>;
  is_washed: boolean;
  is_rinsed: boolean;
  soaking_time_minutes: number;
  chlorine_ppm: number | null;
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
   */
  getInitialData: async (): Promise<DisinfectionCatalog> => {
    try {
      const response = await apiClient.get('desinfection/init-data');

      // 1. DEBUG : Affichez la réponse brute dans votre terminal
      console.log('[fr-veg] RAW DATA FROM API:', JSON.stringify(response.data, null, 2));

      let raw = response.data;

      // 2. CAS SPÉCIFIQUE : Si les données sont dans une propriété "data" imbriquée
      // (Certains frameworks Laravel/Symfony renvoient { data: { ... } })
      if (raw.data && (raw.data['Légumes'] || raw.data['Fruits'] || raw.data['légumes'] || raw.data['fruits'])) {
        raw = raw.data;
      }

      // 3. LOGIQUE ROBUSTE : On cherche les clés sans se soucier de la casse (Majuscule/Minuscule)
      const allKeys = Object.keys(raw);

      // Fonction helper pour trouver une clé "proche"
      const findKey = (keywords: string[]) => {
        return allKeys.find(k => keywords.some(keyword => k.toLowerCase() === keyword.toLowerCase()));
      };

      const vegKey = findKey(['Légumes', 'Legumes', 'legumes', 'Vegetables', 'Vegetaux']);
      const fruitKey = findKey(['Fruits', 'fruits', 'Fruit', 'fruit']);

      // Si on ne trouve toujours rien, on avertit
      if (!vegKey && !fruitKey) {
        console.warn('[fr-veg] Clés "Légumes" ou "Fruits" introuvables dans la réponse API. Clés disponibles:', allKeys);
      }

      const catalog: DisinfectionCatalog = {
        'Légumes': Array.isArray(raw?.[vegKey]) ? raw[vegKey] : [],
        'Fruits':  Array.isArray(raw?.[fruitKey]) ? raw[fruitKey] : [],
      };

      return catalog;
    } catch (error: any) {
      console.error('[fr-veg] Erreur serveur:', error.response?.data);
      throw new Error('Impossible de charger le catalogue de produits.');
    }
  },

  saveProtocol: async (data: ProtocolSaveRequest): Promise<void> => {
    try {
      await apiClient.post('/desinfection/store', data);
    } catch (error: any) {
      console.error('[fr-veg] Erreur saveProtocol:', error?.response?.data ?? error.message);
      throw new Error("Échec de l'enregistrement du protocole.");
    }
  },
};

export default frVegApi;