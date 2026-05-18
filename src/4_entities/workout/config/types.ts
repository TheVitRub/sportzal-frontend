import type { ExerciseSnapshot } from '@entities/catalog';

export interface WorkoutSet {
  id: number;
  workoutExerciseId: number;
  clientId: string;
  setIndex: number;
  metricValues: Record<string, string | number>;
  notes: string;
  completedAt: string;
}

export interface WorkoutExerciseDetail {
  id: number;
  workoutId: number;
  exerciseTemplateId: number;
  exerciseSnapshot: ExerciseSnapshot;
  position: number;
  notes: string;
  sets: WorkoutSet[];
}

export interface WorkoutDetail {
  id: number;
  userId: number;
  title: string;
  status: 'active' | 'completed';
  startedAt: string;
  finishedAt?: string;
  notes: string;
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutSummary {
  id: number;
  title: string;
  status: 'active' | 'completed';
  startedAt: string;
  finishedAt?: string;
  notes: string;
  exerciseCount: number;
  setCount: number;
}

export interface ShareLink {
  id: number;
  workoutId: number;
  token: string;
  isActive: boolean;
}

