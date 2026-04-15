import client from './client';

export interface NettDesiEquipment {
  id: number;
  name: string;
  frequency: string;
}

export interface NettDesiZone {
  id: number;
  name: string;
}

export interface NettDesiTask {
  id: number;
  scheduled_date: string;
  is_today?: boolean;
  is_completed: boolean;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  equipement: NettDesiEquipment;
  zone: NettDesiZone | null;
}

export interface NettDesiTasksResponse {
  date: string;
  is_today?: boolean;
  count: number;
  tasks: NettDesiTask[];
}

export interface UpdateNettDesiTaskStatusRequest {
  is_completed: boolean;
  notes?: string | null;
}

export interface UpdateNettDesiTaskStatusResponse {
  success: boolean;
  message: string;
  task: Pick<
    NettDesiTask,
    'id' | 'scheduled_date' | 'is_completed' | 'notes' | 'completed_at'
  >;
}

const nettDesiApi = {
  getTasks: async (date: string): Promise<NettDesiTasksResponse> => {
    const response = await client.get('/nett-desi/tasks', {
      params: { date },
    });
    console.log('Fetched NettDesi tasks:', response.data);
    return response.data;
  },

  updateTaskStatus: async (
    planningId: number,
    payload: UpdateNettDesiTaskStatusRequest
  ): Promise<UpdateNettDesiTaskStatusResponse> => {
    const response = await client.put(`/nett-desi/tasks/${planningId}/status`, payload);
    return response.data;
  },
};

export default nettDesiApi;