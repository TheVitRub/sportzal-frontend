import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Dumbbell } from 'lucide-react';
import { WorkoutService } from '@entities/workout';
import type { WorkoutDetail } from '@entities/workout';
import { WorkoutReadOnly } from '@widgets/workout-readonly';
import { Notice } from '@shared/ui';

export function PublicWorkoutPage() {
  const { token = '' } = useParams();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Ссылка не открылась');
      return;
    }
    WorkoutService.publicWorkout(token)
      .then(setWorkout)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ссылка не открылась'));
  }, [token]);

  return (
    <div className="publicPage">
      <div className="publicHeader">
        <Dumbbell size={30} />
        <div>
          <span className="eyebrow">Публичный просмотр</span>
          <h1>{workout?.title ?? 'Тренировка'}</h1>
        </div>
      </div>
      {error && <Notice tone="danger" text={error} />}
      {workout ? <WorkoutReadOnly workout={workout} /> : !error && <Notice text="Загрузка тренировки." />}
    </div>
  );
}

export default PublicWorkoutPage;
