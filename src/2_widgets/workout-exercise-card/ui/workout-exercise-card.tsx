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
        <button className="secondary" onClick={addSet}>
          <Plus size={18} /> Подход
        </button>
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
        {sets.length === 0 && <Notice text="Подходов пока нет." />}
        {sets.map((set) => (
          <SetRow key={set.id} set={set} schema={schema} onReload={onReload} />
        ))}
      </div>
    </article>
  );
}

