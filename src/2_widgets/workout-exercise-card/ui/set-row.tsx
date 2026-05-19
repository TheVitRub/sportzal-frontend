import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Save, Trash2 } from 'lucide-react';
import { WorkoutService } from '@entities/workout';
import type { WorkoutSet } from '@entities/workout';
import type { MetricSchema } from '@entities/catalog';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SetRowProps {
  set: WorkoutSet;
  schema: MetricSchema;
  onReload: () => Promise<void>;
}

export function SetRow({ set, schema, onReload }: SetRowProps) {
  const [values, setValues] = useState<Record<string, string | number>>(set.metricValues ?? {});
  const [notes, setNotes] = useState(set.notes ?? '');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<number | null>(null);
  const isTreadmill = schema.type === 'treadmill';
  const entryName = isTreadmill ? 'Отрезок' : 'Подход';

  function scheduleSave(nextValues: Record<string, string | number>, nextNotes: string) {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    setStatus('saving');
    timerRef.current = window.setTimeout(async () => {
      try {
        await WorkoutService.updateSet(set.id, nextValues, nextNotes);
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 700);
  }

  async function deleteSet() {
    await WorkoutService.deleteSet(set.id);
    await onReload();
  }

  return (
    <div className={`setRow ${isTreadmill ? 'setRowTreadmill' : ''}`}>
      <div className="setTop">
        <strong>
          {entryName} {set.setIndex}
        </strong>
        <span className={`saveState ${status}`}>
          {status === 'saving' && (
            <>
              <Save size={15} /> Сохраняю
            </>
          )}
          {status === 'saved' && (
            <>
              <CheckCircle2 size={15} /> Сохранено
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle size={15} /> Ошибка
            </>
          )}
          {status === 'idle' && 'Автосохранение'}
        </span>
      </div>

      <div className="setFields">
        {schema.fields.map((field) => (
          <label key={field.key} className={field.key === 'notes' ? 'wideField' : ''}>
            {fieldLabel(field.key, field.label)}
            <div className="inputWithUnit">
              <input
                type={field.valueType === 'text' ? 'text' : 'number'}
                inputMode={field.valueType === 'int' ? 'numeric' : field.valueType === 'float' ? 'decimal' : 'text'}
                step={field.step ?? (field.valueType === 'int' ? 1 : 0.1)}
                min={field.min}
                max={field.max}
                value={values[field.key] ?? ''}
                placeholder={fieldPlaceholder(field.key)}
                onChange={(event) => {
                  const raw = event.target.value;
                  const nextValue = field.valueType === 'text' || raw === '' ? raw : Number(raw);
                  const nextValues = { ...values, [field.key]: nextValue };
                  setValues(nextValues);
                  scheduleSave(nextValues, notes);
                }}
              />
              {field.unit && <span>{field.unit}</span>}
            </div>
          </label>
        ))}
      </div>

      <label className="noteField">
        Заметка
        <input
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            scheduleSave(values, event.target.value);
          }}
          placeholder="Как прошло"
        />
      </label>

      <button className="deleteSetButton danger" title={`Удалить ${entryName.toLowerCase()}`} onClick={deleteSet}>
        <Trash2 size={17} /> Удалить
      </button>
    </div>
  );
}

function fieldLabel(key: string, fallback: string) {
  const labels: Record<string, string> = {
    duration_min: 'Минуты',
    speed_kmh: 'Скорость',
    incline_percent: 'Наклон',
    distance_km: 'Километры',
    duration_sec: 'Секунды',
    weight_kg: 'Вес',
    reps: 'Повторы'
  };
  return labels[key] ?? fallback;
}

function fieldPlaceholder(key: string) {
  const placeholders: Record<string, string> = {
    duration_min: '3',
    speed_kmh: '5',
    incline_percent: '0',
    distance_km: '0',
    duration_sec: '30',
    weight_kg: '0',
    reps: '8'
  };
  return placeholders[key] ?? '';
}
