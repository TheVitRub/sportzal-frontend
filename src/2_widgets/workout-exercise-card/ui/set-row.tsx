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
    <div className="setRow">
      <div className="setIndex">#{set.setIndex}</div>
      {schema.fields.map((field) => (
        <label key={field.key}>
          {field.label}
          <div className="inputWithUnit">
            <input
              type={field.valueType === 'text' ? 'text' : 'number'}
              step={field.step ?? (field.valueType === 'int' ? 1 : 0.1)}
              min={field.min}
              max={field.max}
              value={values[field.key] ?? ''}
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
      <label>
        Заметка
        <input
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            scheduleSave(values, event.target.value);
          }}
          placeholder="Самочувствие, техника"
        />
      </label>
      <div className={`saveState ${status}`}>
        {status === 'saving' && <Save size={16} />}
        {status === 'saved' && <CheckCircle2 size={16} />}
        {status === 'error' && <AlertCircle size={16} />}
      </div>
      <button className="iconButton danger" title="Удалить подход" onClick={deleteSet}>
        <Trash2 size={17} />
      </button>
    </div>
  );
}

