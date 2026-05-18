import { useEffect, useState } from 'react';
import { CheckCircle2, Dumbbell, Plus } from 'lucide-react';
import { CatalogService } from '@entities/catalog';
import type { Exercise } from '@entities/catalog';
import { WorkoutService } from '@entities/workout';
import type { WorkoutDetail } from '@entities/workout';
import { WorkoutExerciseCard } from '@widgets/workout-exercise-card';
import { Notice } from '@shared/ui';

export function WorkoutPage() {
  const [active, setActive] = useState<WorkoutDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [workout, exerciseList] = await Promise.all([WorkoutService.active(), CatalogService.listExercises()]);
    setActive(workout);
    setExercises(exerciseList);
    if (!selectedExercise && exerciseList[0]) {
      setSelectedExercise(String(exerciseList[0].id));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'));
  }, []);

  async function startWorkout() {
    setError('');
    setBusy(true);
    try {
      const workout = await WorkoutService.create();
      setActive('workout' in workout ? workout.workout : workout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать тренировку');
    } finally {
      setBusy(false);
    }
  }

  async function addExercise() {
    if (!active || !selectedExercise) {
      return;
    }
    setBusy(true);
    try {
      setActive(await WorkoutService.addExercise(active.id, Number(selectedExercise)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить упражнение');
    } finally {
      setBusy(false);
    }
  }

  async function finishWorkout() {
    if (!active) {
      return;
    }
    const updated = await WorkoutService.finish(active.id);
    setActive(updated.status === 'active' ? updated : null);
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">Сегодня</span>
          <h1>{active ? 'Тренировка идет' : 'Начать тренировку'}</h1>
        </div>
        {active && (
          <button className="primary" onClick={finishWorkout}>
            <CheckCircle2 size={18} /> Завершить
          </button>
        )}
      </header>

      {error && <Notice tone="danger" text={error} />}

      {!active ? (
        <div className="emptyState">
          <Dumbbell size={42} />
          <h2>Один экран для всей тренировки</h2>
          <p>Начните, выберите упражнение и добавляйте подходы или отрезки прямо с телефона.</p>
          <button className="primary" onClick={startWorkout} disabled={busy}>
            <Plus size={18} /> Начать тренировку
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar addExercisePanel">
            <div>
              <strong>Что делаем?</strong>
              <span>Например: беговая дорожка, жим, планка</span>
            </div>
            <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.categoryName}: {exercise.title}
                </option>
              ))}
            </select>
            <button className="primary" onClick={addExercise} disabled={busy || !selectedExercise}>
              <Plus size={18} /> Добавить
            </button>
          </div>

          <div className="exerciseList">
            {active.exercises.length === 0 && <Notice text="Выберите упражнение выше и нажмите «Добавить»." />}
            {active.exercises.map((item) => (
              <WorkoutExerciseCard key={item.id} item={item} onReload={load} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default WorkoutPage;
