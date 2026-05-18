import type { MetricSchema } from '@entities/catalog';

export function defaultMetricValues(schema: MetricSchema) {
  const values: Record<string, number | string> = {};

  if (schema.type === 'treadmill') {
    return {
      duration_min: 3,
      speed_kmh: 5,
      incline_percent: 0
    };
  }

  if (schema.type === 'duration') {
    return {
      duration_sec: 30
    };
  }

  schema.fields.forEach((field) => {
    if (!field.required) {
      return;
    }
    values[field.key] = field.valueType === 'text' ? '' : field.min ?? 1;
  });

  return values;
}

export function toKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
