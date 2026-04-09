import apiClient from './client';

export interface TemperatureCheckTime {
  id: number;
  label: string;
  check_time: string;
  tolerance_minutes: number;
  already_done: boolean;
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
    const response = await apiClient.get<TemperatureControlInitialData>('/temperature-control/init-data');
    return response.data;
  },

  storeControl: async (payload: StoreTemperatureControlPayload): Promise<TemperatureControlResponse> => {
    const response = await apiClient.post<TemperatureControlResponse>('/temperature-control/store', payload);
    return response.data;
  }
};

export default temperatureControlApi;