import type { WorkoutDetail } from '@entities/workout';

interface WorkoutReadOnlyProps {
  workout: WorkoutDetail;
}

export function WorkoutReadOnly({ workout }: WorkoutReadOnlyProps) {
  return (
    <div className="readonlyWorkout">
      {(workout.exercises ?? []).map((exercise) => (
        <article className="readonlyExercise" key={exercise.id}>
          <h3>{exercise.exerciseSnapshot.title}</h3>
          <p>{exercise.exerciseSnapshot.categoryName}</p>
          <div className="readonlySets">
            {(exercise.sets ?? []).map((set) => (
              <div className="readonlySet" key={set.id}>
                <strong>#{set.setIndex}</strong>
                {exercise.exerciseSnapshot.metricSchema.fields.map((field) => (
                  <span key={field.key}>
                    {field.label}: {String(set.metricValues[field.key] ?? '-')} {field.unit}
                  </span>
                ))}
                {set.notes && <span>{set.notes}</span>}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

