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

