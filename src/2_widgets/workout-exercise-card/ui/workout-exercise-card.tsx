import { useState } from 'react';
import { CopyPlus, Plus } from 'lucide-react';
import { API_BASE } from '@shared/api/api';
import { defaultMetricValues } from '@shared/lib/metric';
import { Notice } from '@shared/ui';
import { WorkoutService } from '@entities/workout';
import type { WorkoutExerciseDetail } from '@entities/workout';
import { WorkoutTimekeeper } from '@widgets/workout-timekeeper';
import { SetRow } from './set-row';

interface WorkoutExerciseCardProps {
  item: WorkoutExerciseDetail;
  onReload: () => Promise<void>;
}

export function WorkoutExerciseCard({ item, onReload }: WorkoutExerciseCardProps) {
  const [busyAction, setBusyAction] = useState<'new' | 'repeat' | 'timed' | null>(null);
  const [actionError, setActionError] = useState('');
  const schema = item.exerciseSnapshot.metricSchema;
  const media = item.exerciseSnapshot.media ?? [];
  const sets = item.sets ?? [];
  const lastSet = sets[sets.length - 1];
  const isTreadmill = schema.type === 'treadmill';
  const entryName = isTreadmill ? 'отрезок' : 'подход';
  const durationField = schema.fields.find((field) => field.key === 'duration_sec' || field.key === 'duration_min');
  const durationTimerDefault = durationField ? secondsFromMetric(defaultMetricValues(schema)[durationField.key], durationField.key) : 30;
  const totalMinutes = sets.reduce((sum, set) => sum + metricNumber(set.metricValues.duration_min), 0);
  const estimatedDistance = sets.reduce((sum, set) => {
    const distance = metricNumber(set.metricValues.distance_km);
    if (distance > 0) {
      return sum + distance;
    }
    return sum + (metricNumber(set.metricValues.duration_min) * metricNumber(set.metricValues.speed_kmh)) / 60;
  }, 0);

  async function createSet(metricValues: Record<string, string | number>, action: 'new' | 'repeat' | 'timed') {
    setActionError('');
    setBusyAction(action);
    try {
      await WorkoutService.createSet(item.id, metricValues);
      await onReload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось добавить подход';
      setActionError(message);
      throw new Error(message);
    } finally {
      setBusyAction(null);
    }
  }

  async function addSet() {
    await createSet(defaultMetricValues(schema), 'new').catch(() => undefined);
  }

  async function repeatLastSet() {
    if (!lastSet) {
      return;
    }
    await createSet(lastSet.metricValues, 'repeat').catch(() => undefined);
  }

  async function saveTimedSet(seconds: number) {
    if (!durationField) {
      return;
    }

    const metricValues = {
      ...defaultMetricValues(schema),
      [durationField.key]: durationMetricValue(seconds, durationField.key)
    };
    await createSet(metricValues, 'timed');
  }

  return (
    <article className="workoutExercise">
      <div className="exerciseHead">
        <div>
          <span className="eyebrow">{item.exerciseSnapshot.categoryName}</span>
          <h2>{item.exerciseSnapshot.title}</h2>
          {item.exerciseSnapshot.description && <p>{item.exerciseSnapshot.description}</p>}
        </div>
        <div className="exerciseActions">
          {lastSet && (
            <button className="secondary compactAction" onClick={repeatLastSet} disabled={busyAction !== null}>
              <CopyPlus size={18} /> {busyAction === 'repeat' ? 'Повторяем' : 'Повторить'}
            </button>
          )}
          <button className="primary compactAction" onClick={addSet} disabled={busyAction !== null}>
            <Plus size={18} /> {busyAction === 'new' ? 'Добавляем' : `Новый ${entryName}`}
          </button>
        </div>
      </div>

      {actionError && <Notice tone="danger" text={actionError} />}

      {durationField && (
        <WorkoutTimekeeper
          variant="exercise"
          title="Время подхода"
          description="Засеките планку, удержание или другой подход на время и сразу запишите результат."
          defaultTimerSeconds={durationTimerDefault}
          timerPresets={[15, 30, 45, 60, 90, 120]}
          saveLabel={`Записать ${entryName}`}
          onSaveDuration={saveTimedSet}
        />
      )}

      <div className="exerciseMeta">
        <span>
          <strong>{sets.length}</strong>
          {pluralize(sets.length, entryName, isTreadmill ? 'отрезка' : 'подхода', isTreadmill ? 'отрезков' : 'подходов')}
        </span>
        {isTreadmill && totalMinutes > 0 && <span><strong>{formatNumber(totalMinutes)}</strong> мин</span>}
        {isTreadmill && estimatedDistance > 0 && <span><strong>{formatNumber(estimatedDistance)}</strong> км</span>}
      </div>

      {media.length > 0 && (
        <div className="mediaStrip">
          {media.map((entry) =>
            entry.mediaType === 'photo' ? (
              <img key={entry.id} src={`${API_BASE}${entry.fileUrl}`} alt={item.exerciseSnapshot.title} />
            ) : (
              <video key={entry.id} src={`${API_BASE}${entry.fileUrl}`} controls />
            )
          )}
        </div>
      )}

      <div className="setTable">
        {sets.length === 0 && <Notice text={isTreadmill ? 'Добавьте первый отрезок. Он сразу появится как 3 мин на 5 км/ч.' : 'Добавьте первый подход.'} />}
        {sets.map((set) => (
          <SetRow key={set.id} set={set} schema={schema} onReload={onReload} />
        ))}
      </div>
    </article>
  );
}

function metricNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

function secondsFromMetric(value: unknown, key: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return 30;
  }
  return key === 'duration_min' ? Math.max(1, Math.round(number * 60)) : Math.max(1, Math.round(number));
}

function durationMetricValue(seconds: number, key: string) {
  if (key === 'duration_min') {
    return Number((seconds / 60).toFixed(2));
  }
  return Math.max(1, Math.round(seconds));
}

function pluralize(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}
