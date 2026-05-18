export type Role = 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MetricField {
  key: string;
  label: string;
  unit: string;
  valueType: 'int' | 'float' | 'text';
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface MetricSchema {
  type: string;
  fields: MetricField[];
  target?: Record<string, string>;
}

export interface ExerciseMedia {
  id: number;
  exerciseId: number;
  mediaType: 'photo' | 'video';
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Exercise {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string;
  metricSchema: MetricSchema;
  isActive: boolean;
  media: ExerciseMedia[];
}

export interface ExerciseSnapshot {
  exerciseId: number;
  title: string;
  description: string;
  categoryName: string;
  metricSchema: MetricSchema;
  media: ExerciseMedia[];
}

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

