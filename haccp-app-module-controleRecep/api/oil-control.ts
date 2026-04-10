import client from './client';

export interface ChecklistItem {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  code: string;
  type: string;
  description: string | null;
  checklists: ChecklistItem[];
}

export interface Zone {
  id: number;
  name: string;
  equipments: Equipment[];
}

export interface OilControlInitialData {
  zones: Zone[];
}

export interface OilControlStoreRequest {
  equipment_id: number;
  temperature?: number | null;
  peroxide_value?: number | null;
  status: 'reused' | 'changed';
  checklists: {
    checklist_id: number;
    recorded_value: boolean;
  }[];
}

const oilControlApi = {
  getInitialData: async (): Promise<OilControlInitialData> => {
    const response = await client.get('/oil-control/init-data');
    return response.data;
  },

  storeControl: async (data: OilControlStoreRequest) => {
    const response = await client.post('/oil-control/store', data);
    return response.data;
  },
};

export default oilControlApi;