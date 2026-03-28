import api from './client';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    user: { id: string; name: string; email: string };
}

export interface TasksMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TasksResponse {
    success: boolean;
    data: Task[];
    meta: TasksMeta;
}

export interface TaskFilters {
    page?: number;
    limit?: number;
    status?: Task['status'];
    priority?: Task['priority'];
    search?: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    dueDate?: string;
}

export const tasksApi = {
    list: (filters: TaskFilters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== '') params.append(k, String(v));
        });
        return api.get<TasksResponse>(`/tasks?${params.toString()}`);
    },

    get: (id: string) => api.get<{ success: boolean; data: Task }>(`/tasks/${id}`),

    create: (data: CreateTaskData) =>
        api.post<{ success: boolean; data: Task }>('/tasks', data),

    update: (id: string, data: Partial<CreateTaskData>) =>
        api.put<{ success: boolean; data: Task }>(`/tasks/${id}`, data),

    delete: (id: string) => api.delete(`/tasks/${id}`),
};
