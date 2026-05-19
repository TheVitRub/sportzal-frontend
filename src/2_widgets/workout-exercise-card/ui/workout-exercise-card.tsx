import { Plus } from 'lucide-react';
import { API_BASE } from '@shared/api/api';
import { defaultMetricValues } from '@shared/lib/metric';
import { Notice } from '@shared/ui';
import { WorkoutService } from '@entities/workout';
import type { WorkoutExerciseDetail } from '@entities/workout';
import { SetRow } from './set-row';

interface WorkoutExerciseCardProps {
  item: WorkoutExerciseDetail;
  onReload: () => Promise<void>;
}

export function WorkoutExerciseCard({ item, onReload }: WorkoutExerciseCardProps) {
  const schema = item.exerciseSnapshot.metricSchema;
  const media = item.exerciseSnapshot.media ?? [];
  const sets = item.sets ?? [];
  const isTreadmill = schema.type === 'treadmill';
  const entryName = isTreadmill ? 'отрезок' : 'подход';
  const totalMinutes = sets.reduce((sum, set) => sum + metricNumber(set.metricValues.duration_min), 0);
  const estimatedDistance = sets.reduce((sum, set) => {
    const distance = metricNumber(set.metricValues.distance_km);
    if (distance > 0) {
      return sum + distance;
    }
    return sum + (metricNumber(set.metricValues.duration_min) * metricNumber(set.metricValues.speed_kmh)) / 60;
  }, 0);

  async function addSet() {
    await WorkoutService.createSet(item.id, defaultMetricValues(schema));
    await onReload();
  }

  return (
    <article className="workoutExercise">
      <div className="exerciseHead">
        <div>
          <span className="eyebrow">{item.exerciseSnapshot.categoryName}</span>
          <h2>{item.exerciseSnapshot.title}</h2>
          {item.exerciseSnapshot.description && <p>{item.exerciseSnapshot.description}</p>}
        </div>
        <button className="primary compactAction" onClick={addSet}>
          <Plus size={18} /> Новый {entryName}
        </button>
      </div>

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
