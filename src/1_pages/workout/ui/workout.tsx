import { useEffect, useState } from 'react';
import { CheckCircle2, Dumbbell, Plus, X } from 'lucide-react';
import { CatalogService } from '@entities/catalog';
import type { Exercise } from '@entities/catalog';
import { WorkoutService } from '@entities/workout';
import type { WorkoutDetail } from '@entities/workout';
import { WorkoutExerciseCard } from '@widgets/workout-exercise-card';
import { WorkoutTimekeeper } from '@widgets/workout-timekeeper';
import { Notice } from '@shared/ui';

export function WorkoutPage() {
  const [active, setActive] = useState<WorkoutDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const exerciseCount = active?.exercises.length ?? 0;
  const setCount = active?.exercises.reduce((sum, exercise) => sum + (exercise.sets?.length ?? 0), 0) ?? 0;

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
      setConfirmFinish(false);
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
      setConfirmFinish(false);
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
    setError('');
    setBusy(true);
    try {
      const updated = await WorkoutService.finish(active.id);
      setActive(updated.status === 'active' ? updated : null);
      setConfirmFinish(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить тренировку');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <header className="pageHeader workoutHero">
        <div>
          <span className="eyebrow">Сегодня</span>
          <h1>{active ? 'Тренировка идет' : 'Начать тренировку'}</h1>
          <p>{active ? 'Держите темп: добавляйте упражнения и подходы без лишних переходов.' : 'Откройте сессию и ведите всю тренировку с телефона.'}</p>
        </div>
        {active && (
          <div className="workoutStats" aria-label="Итоги тренировки">
            <span>
              <strong>{exerciseCount}</strong>
              упражн.
            </span>
            <span>
              <strong>{setCount}</strong>
              подходов
            </span>
          </div>
        )}
        {active && !confirmFinish && (
          <button className="primary" onClick={() => setConfirmFinish(true)} disabled={busy}>
            <CheckCircle2 size={18} /> Завершить
          </button>
        )}
        {active && confirmFinish && (
          <div className="finishConfirm" role="group" aria-label="Подтверждение завершения тренировки">
            <span>Точно завершить тренировку?</span>
            <div className="finishConfirmActions">
              <button className="secondary" onClick={() => setConfirmFinish(false)} disabled={busy}>
                <X size={18} /> Отмена
              </button>
              <button className="primary" onClick={finishWorkout} disabled={busy}>
                <CheckCircle2 size={18} /> {busy ? 'Завершаем' : 'Завершить'}
              </button>
            </div>
          </div>
        )}
      </header>

      {error && <Notice tone="danger" text={error} />}

      {!active ? (
        <div className="emptyState">
          <span className="emptyIcon"><Dumbbell size={36} /></span>
          <span className="eyebrow">Готовы к залу</span>
          <h2>Один спокойный экран для всей тренировки</h2>
          <p>Начните сессию, выберите упражнение и фиксируйте подходы крупными полями, удобно на ходу.</p>
          <button className="primary" onClick={startWorkout} disabled={busy}>
            <Plus size={18} /> Начать тренировку
          </button>
        </div>
      ) : (
        <>
          <WorkoutTimekeeper
            variant="rest"
            title="Отдых между подходами"
            description="Запускайте обратный отсчет после подхода. По окончании прозвучит короткий сигнал."
            defaultTimerSeconds={90}
            timerPresets={[30, 60, 90, 120, 180]}
            showStopwatch={false}
          />

          <div className="toolbar addExercisePanel">
            <div>
              <span className="eyebrow">Следующее действие</span>
              <strong>Добавить упражнение</strong>
              <span>Выберите из каталога и сразу внесите первый подход.</span>
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
