import { api } from '@shared/api/api';
import type { Category, Exercise, MetricSchema } from '../config/types';

export class CatalogService {
  static listCategories() {
    return api<Category[]>('/api/v1/categories');
  }

  static createCategory(payload: { name: string; description: string; isActive: boolean; sortOrder: number }) {
    return api<Category>('/api/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static listExercises(includeInactive = false) {
    return api<Exercise[]>(`/api/v1/exercises${includeInactive ? '?includeInactive=1' : ''}`);
  }

  static createExercise(payload: {
    categoryId: number;
    title: string;
    description: string;
    metricSchema: MetricSchema;
    isActive: boolean;
  }) {
    return api<Exercise>('/api/v1/admin/exercises', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static uploadMedia(exerciseId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    return api(`/api/v1/admin/exercises/${exerciseId}/media`, {
      method: 'POST',
      body: form
    });
  }
}

