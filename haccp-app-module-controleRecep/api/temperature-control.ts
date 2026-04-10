import apiClient from './client';

export interface TemperatureCheckTime {
  id: number;
  label: string;
  check_time: string;
  tolerance_minutes: number;
  already_done: boolean;
  // AJOUT IMPORTANT : Ces champs sont utilisés par le composant React Native
  // pour afficher qui a validé et à quelle heure réelle après l'enregistrement.
  recorded_by?: string | null;
  recorded_at?: string | null;
}

export interface Equipment {
  id: number;
  code: string;
  description: string;
  zone_id: number | null;
  establishment_id: number;
  min_temperature: number | null;
  max_temperature: number | null;
  check_times: TemperatureCheckTime[];
}

export interface Zone {
  id: number;
  name: string;
  equipments: Equipment[];
}

export interface TemperatureControlInitialData {
  zones: Zone[];
}

export interface StoreTemperatureControlPayload {
  equipment_id: number;
  check_time_id: number;
  temperature: number;
  probable_cause?: string | null;
  corrective_action?: string | null;
  comments?: string | null;
}

export interface TemperatureControlResponse {
  success: boolean;
  message: string;
  is_conform: boolean;
  temperature_control_id: number;
}

const temperatureControlApi = {
  getInitialData: async (): Promise<TemperatureControlInitialData> => {
    // Si votre client n'a PAS de baseURL avec /api/v1, vous devez l'ajouter ici :
    // ex: apiClient.get('/api/v1/temperature-control/init-data')
    const response = await apiClient.get<TemperatureControlInitialData>('/temperature-control/init-data');
    return response.data;
  },

  storeControl: async (payload: StoreTemperatureControlPayload): Promise<TemperatureControlResponse> => {
    // Idem ici : Vérifiez que l'URL est complète ou gérée par le client
    const response = await apiClient.post<TemperatureControlResponse>('/temperature-control/store', payload);
    return response.data;
  }
};

export default temperatureControlApi;