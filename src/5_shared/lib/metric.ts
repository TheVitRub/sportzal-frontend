import type { MetricSchema } from '@entities/catalog';

export function defaultMetricValues(schema: MetricSchema) {
  const values: Record<string, number | string> = {};

  schema.fields.forEach((field) => {
    if (!field.required) {
      return;
    }
    values[field.key] = field.valueType === 'text' ? 'ok' : field.min ?? 1;
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

