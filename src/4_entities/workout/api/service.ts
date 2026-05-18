import { api, downloadFile } from '@shared/api/api';
import type { ShareLink, WorkoutDetail, WorkoutSet, WorkoutSummary } from '../config/types';

export class WorkoutService {
  static active() {
    return api<WorkoutDetail | null>('/api/v1/workouts/active');
  }

  static create() {
    return api<WorkoutDetail | { alreadyActive: boolean; workout: WorkoutDetail }>('/api/v1/workouts', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  static list() {
    return api<WorkoutSummary[]>('/api/v1/workouts');
  }

  static get(id: number) {
    return api<WorkoutDetail>(`/api/v1/workouts/${id}`);
  }

  static finish(id: number) {
    return api<WorkoutDetail>(`/api/v1/workouts/${id}/finish`, { method: 'POST' });
  }

  static addExercise(workoutId: number, exerciseId: number) {
    return api<WorkoutDetail>(`/api/v1/workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: JSON.stringify({ exerciseId })
    });
  }

  static createSet(workoutExerciseId: number, metricValues: Record<string, string | number>) {
    return api<WorkoutSet>(`/api/v1/workout-exercises/${workoutExerciseId}/sets`, {
      method: 'POST',
      body: JSON.stringify({ clientId: crypto.randomUUID(), metricValues })
    });
  }

  static updateSet(setId: number, metricValues: Record<string, string | number>, notes: string) {
    return api<WorkoutSet>(`/api/v1/workout-sets/${setId}`, {
      method: 'PATCH',
      body: JSON.stringify({ metricValues, notes })
    });
  }

  static deleteSet(setId: number) {
    return api<void>(`/api/v1/workout-sets/${setId}`, { method: 'DELETE' });
  }

  static createShareLink(workoutId: number) {
    return api<ShareLink>(`/api/v1/workouts/${workoutId}/share-links`, { method: 'POST' });
  }

  static publicWorkout(token: string) {
    return api<WorkoutDetail>(`/api/v1/public/workouts/${token}`);
  }

  static exportCSV(workoutId: number) {
    return downloadFile(`/api/v1/workouts/${workoutId}/export.csv`, `workout_${workoutId}.csv`);
  }

  static exportJSON(workoutId: number) {
    return downloadFile(`/api/v1/workouts/${workoutId}/export.json`, `workout_${workoutId}.json`);
  }
}

