import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Dumbbell,
  History,
  LogOut,
  Plus,
  Save,
  Share2,
  ShieldCheck,
  Trash2,
  Upload
} from 'lucide-react';
import { API_BASE, api, clearSession, downloadFile, getToken, setSession } from './api';
import type {
  Category,
  Exercise,
  MetricField,
  MetricSchema,
  ShareLink,
  User,
  WorkoutDetail,
  WorkoutExerciseDetail,
  WorkoutSet,
  WorkoutSummary
} from './types';

type Tab = 'workout' | 'history' | 'admin';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const defaultField: MetricField = {
  key: 'reps',
  label: 'Повторы',
  unit: 'раз',
  valueType: 'int',
  required: true,
  min: 1
};

export default function App() {
  const publicToken = getPublicToken();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('workout');

  useEffect(() => {
    if (publicToken) {
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>('/api/v1/auth/me')
      .then(setUser)
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [publicToken]);

  if (publicToken) {
    return <PublicWorkout token={publicToken} />;
  }

  if (loading) {
    return <FullScreenMessage title="Загрузка" text="Проверяем сессию" />;
  }

  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <Dumbbell size={28} />
          <div>
            <strong>Workout Tracker</strong>
            <span>{user.name}</span>
          </div>
        </div>
        <nav>
          <button className={tab === 'workout' ? 'active' : ''} onClick={() => setTab('workout')}>
            <Dumbbell size={18} /> Тренировка
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            <History size={18} /> История
          </button>
          {user.role === 'admin' && (
            <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
              <ShieldCheck size={18} /> Админка
            </button>
          )}
        </nav>
        <button
          className="ghost danger"
          onClick={() => {
            clearSession();
            setUser(null);
          }}
        >
          <LogOut size={18} /> Выйти
        </button>
      </aside>

      <main className="content">
        {tab === 'workout' && <WorkoutPage />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'admin' && user.role === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}

function AuthPage({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = mode === 'register' ? { email, name, password } : { email, password };
      const result = await api<{ token: string; user: User }>(`/api/v1/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSession(result.token, result.user);
      onAuth(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authLayout">
      <section className="authPanel">
        <div className="authHeader">
          <Dumbbell size={34} />
          <div>
            <h1>Workout Tracker</h1>
            <p>Первый зарегистрированный пользователь получает права администратора.</p>
          </div>
        </div>
        <form onSubmit={submit} className="formStack">
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {mode === 'register' && (
            <label>
              Имя
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как вас называть" />
            </label>
          )}
          <label>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error && <p className="errorText">{error}</p>}
          <button className="primary" disabled={busy}>
            {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
        <button className="linkButton" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
          {mode === 'register' ? 'Уже есть аккаунт' : 'Нужна регистрация'}
        </button>
      </section>
    </div>
  );
}

function WorkoutPage() {
  const [active, setActive] = useState<WorkoutDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [workout, exerciseList] = await Promise.all([
      api<WorkoutDetail | null>('/api/v1/workouts/active'),
      api<Exercise[]>('/api/v1/exercises')
    ]);
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
      const workout = await api<WorkoutDetail | { alreadyActive: boolean; workout: WorkoutDetail }>('/api/v1/workouts', {
        method: 'POST',
        body: JSON.stringify({})
      });
      setActive('workout' in workout ? workout.workout : workout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать тренировку');
    } finally {
      setBusy(false);
    }
  }

  async function addExercise() {
    if (!active || !selectedExercise) return;
    setBusy(true);
    try {
      const updated = await api<WorkoutDetail>(`/api/v1/workouts/${active.id}/exercises`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId: Number(selectedExercise) })
      });
      setActive(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить упражнение');
    } finally {
      setBusy(false);
    }
  }

  async function finishWorkout() {
    if (!active) return;
    const updated = await api<WorkoutDetail>(`/api/v1/workouts/${active.id}/finish`, { method: 'POST' });
    setActive(updated.status === 'active' ? updated : null);
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">Активная сессия</span>
          <h1>{active ? active.title : 'Новая тренировка'}</h1>
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
          <h2>Тренировка еще не начата</h2>
          <p>Создайте сессию, добавьте упражнение и фиксируйте подходы по одному.</p>
          <button className="primary" onClick={startWorkout} disabled={busy}>
            <Plus size={18} /> Начать тренировку
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.categoryName}: {exercise.title}
                </option>
              ))}
            </select>
            <button className="primary" onClick={addExercise} disabled={busy || !selectedExercise}>
              <Plus size={18} /> Добавить упражнение
            </button>
          </div>

          <div className="exerciseList">
            {active.exercises.length === 0 && <Notice text="Добавьте первое упражнение из каталога." />}
            {active.exercises.map((item) => (
              <WorkoutExerciseCard key={item.id} item={item} onReload={load} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function WorkoutExerciseCard({ item, onReload }: { item: WorkoutExerciseDetail; onReload: () => Promise<void> }) {
	const [error, setError] = useState('');
	const schema = item.exerciseSnapshot.metricSchema;
	const media = item.exerciseSnapshot.media ?? [];
	const sets = item.sets ?? [];

  async function addSet() {
    setError('');
    const metricValues = defaultMetricValues(schema);
    try {
      await api<WorkoutSet>(`/api/v1/workout-exercises/${item.id}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          clientId: crypto.randomUUID(),
          metricValues
        })
      });
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить подход');
    }
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

      {error && <Notice tone="danger" text={error} />}

			<div className="setTable">
				{sets.length === 0 && <p className="muted">Подходов пока нет.</p>}
				{sets.map((set) => (
					<SetRow key={set.id} set={set} schema={schema} onReload={onReload} />
				))}
			</div>
    </article>
  );
}

function SetRow({ set, schema, onReload }: { set: WorkoutSet; schema: MetricSchema; onReload: () => Promise<void> }) {
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
        await api<WorkoutSet>(`/api/v1/workout-sets/${set.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ metricValues: nextValues, notes: nextNotes })
        });
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 700);
  }

  async function deleteSet() {
    await api<void>(`/api/v1/workout-sets/${set.id}`, { method: 'DELETE' });
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

function HistoryPage() {
  const [items, setItems] = useState<WorkoutSummary[]>([]);
  const [selected, setSelected] = useState<WorkoutDetail | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');

  async function loadList() {
    const list = await api<WorkoutSummary[]>('/api/v1/workouts');
    setItems(list);
    if (!selected && list[0]) {
      openWorkout(list[0].id).catch(() => undefined);
    }
  }

  async function openWorkout(id: number) {
    setShareUrl('');
    const detail = await api<WorkoutDetail>(`/api/v1/workouts/${id}`);
    setSelected(detail);
  }

  useEffect(() => {
    loadList().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки истории'));
  }, []);

  async function share() {
    if (!selected) return;
    const link = await api<ShareLink>(`/api/v1/workouts/${selected.id}/share-links`, { method: 'POST' });
    setShareUrl(`${location.origin}/public/${link.token}`);
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">Архив</span>
          <h1>История тренировок</h1>
        </div>
      </header>
      {error && <Notice tone="danger" text={error} />}
      <div className="historyGrid">
        <div className="listPanel">
          {items.length === 0 && <Notice text="История пока пустая." />}
          {items.map((item) => (
            <button key={item.id} className={selected?.id === item.id ? 'listItem active' : 'listItem'} onClick={() => openWorkout(item.id)}>
              <strong>{item.title}</strong>
              <span>
                {formatDate(item.startedAt)} · {item.exerciseCount} упр. · {item.setCount} подх.
              </span>
            </button>
          ))}
        </div>
        <div className="detailPanel">
          {selected ? (
            <>
              <div className="detailHeader">
                <div>
                  <h2>{selected.title}</h2>
                  <p>{formatDate(selected.startedAt)} · {selected.status === 'completed' ? 'завершена' : 'активна'}</p>
                </div>
                <div className="actions">
                  <button className="secondary" onClick={share}>
                    <Share2 size={17} /> Поделиться
                  </button>
                  <button className="secondary" onClick={() => downloadFile(`/api/v1/workouts/${selected.id}/export.csv`, `workout_${selected.id}.csv`)}>
                    <Download size={17} /> CSV
                  </button>
                  <button className="secondary" onClick={() => downloadFile(`/api/v1/workouts/${selected.id}/export.json`, `workout_${selected.id}.json`)}>
                    <Download size={17} /> JSON
                  </button>
                </div>
              </div>
              {shareUrl && <input className="shareInput" value={shareUrl} readOnly onFocus={(e) => e.currentTarget.select()} />}
              <WorkoutReadOnly workout={selected} />
            </>
          ) : (
            <Notice text="Выберите тренировку слева." />
          )}
        </div>
      </div>
    </section>
  );
}

function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryID, setCategoryID] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schemaType, setSchemaType] = useState('strength');
  const [fields, setFields] = useState<MetricField[]>([defaultField]);
  const [error, setError] = useState('');

  async function load() {
    const [categoryList, exerciseList] = await Promise.all([
      api<Category[]>('/api/v1/categories'),
      api<Exercise[]>('/api/v1/exercises?includeInactive=1')
    ]);
    setCategories(categoryList);
    setExercises(exerciseList);
    if (!categoryID && categoryList[0]) {
      setCategoryID(String(categoryList[0].id));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки админки'));
  }, []);

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    await api<Category>('/api/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: categoryName, description: categoryDescription, isActive: true, sortOrder: categories.length + 1 })
    });
    setCategoryName('');
    setCategoryDescription('');
    await load();
  }

  async function createExercise(event: FormEvent) {
    event.preventDefault();
    const metricSchema: MetricSchema = {
      type: schemaType,
      fields: fields.map(cleanField)
    };
    await api<Exercise>('/api/v1/admin/exercises', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: Number(categoryID),
        title,
        description,
        metricSchema,
        isActive: true
      })
    });
    setTitle('');
    setDescription('');
    setFields([defaultField]);
    await load();
  }

  async function uploadMedia(exerciseId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    await api(`/api/v1/admin/exercises/${exerciseId}/media`, { method: 'POST', body: form });
    await load();
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">Справочник</span>
          <h1>Администрирование упражнений</h1>
        </div>
      </header>
      {error && <Notice tone="danger" text={error} />}
      <div className="adminGrid">
        <form className="panel formStack" onSubmit={createCategory}>
          <h2>Категория</h2>
          <label>
            Название
            <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          </label>
          <label>
            Описание
            <textarea value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
          </label>
          <button className="primary">
            <Plus size={17} /> Создать категорию
          </button>
          <div className="chips">
            {categories.map((category) => (
              <span key={category.id}>{category.name}</span>
            ))}
          </div>
        </form>

        <form className="panel formStack widePanel" onSubmit={createExercise}>
          <h2>Упражнение</h2>
          <div className="twoCols">
            <label>
              Категория
              <select value={categoryID} onChange={(e) => setCategoryID(e.target.value)} required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Тип схемы
              <input value={schemaType} onChange={(e) => setSchemaType(e.target.value)} placeholder="strength, treadmill, duration" required />
            </label>
          </div>
          <label>
            Название
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Описание
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="metricBuilder">
            <div className="sectionTitle">
              <h3>Метрики подхода</h3>
              <button type="button" className="secondary" onClick={() => setFields([...fields, { ...defaultField, key: `field_${fields.length + 1}`, label: 'Метрика' }])}>
                <Plus size={16} /> Поле
              </button>
            </div>
            {fields.map((field, index) => (
              <div className="metricRow" key={index}>
                <input value={field.key} onChange={(e) => updateField(fields, setFields, index, 'key', toKey(e.target.value))} placeholder="key" />
                <input value={field.label} onChange={(e) => updateField(fields, setFields, index, 'label', e.target.value)} placeholder="Название" />
                <input value={field.unit} onChange={(e) => updateField(fields, setFields, index, 'unit', e.target.value)} placeholder="Ед." />
                <select value={field.valueType} onChange={(e) => updateField(fields, setFields, index, 'valueType', e.target.value as MetricField['valueType'])}>
                  <option value="int">Целое</option>
                  <option value="float">Число</option>
                  <option value="text">Текст</option>
                </select>
                <label className="checkLine">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(fields, setFields, index, 'required', e.target.checked)} />
                  Обяз.
                </label>
                <input type="number" value={field.min ?? ''} onChange={(e) => updateOptionalNumber(fields, setFields, index, 'min', e.target.value)} placeholder="Мин" />
                <button type="button" className="iconButton danger" onClick={() => setFields(fields.filter((_, i) => i !== index))}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button className="primary">
            <Save size={17} /> Создать упражнение
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>Каталог</h2>
        <div className="catalogList">
          {exercises.map((exercise) => (
            <article key={exercise.id} className="catalogItem">
              <div>
                <span className="eyebrow">{exercise.categoryName}</span>
                <h3>{exercise.title}</h3>
                <p>{exercise.description || 'Без описания'}</p>
                <div className="chips">
                  {exercise.metricSchema.fields.map((field) => (
                    <span key={field.key}>
                      {field.label} {field.unit && `(${field.unit})`}
                    </span>
                  ))}
                </div>
              </div>
              <label className="uploadButton">
                <Upload size={17} /> Фото/видео
                <input type="file" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && uploadMedia(exercise.id, e.target.files[0])} />
              </label>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublicWorkout({ token }: { token: string }) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<WorkoutDetail>(`/api/v1/public/workouts/${token}`)
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

function WorkoutReadOnly({ workout }: { workout: WorkoutDetail }) {
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

function Notice({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'danger' }) {
  return <div className={`notice ${tone}`}>{text}</div>;
}

function FullScreenMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="authLayout">
      <section className="authPanel">
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
    </div>
  );
}

function getPublicToken() {
  const parts = location.pathname.split('/').filter(Boolean);
  return parts[0] === 'public' ? parts[1] : '';
}

function defaultMetricValues(schema: MetricSchema) {
  const values: Record<string, number | string> = {};
  schema.fields.forEach((field) => {
    if (!field.required) return;
    if (field.valueType === 'text') {
      values[field.key] = 'ok';
    } else {
      values[field.key] = field.min ?? 1;
    }
  });
  return values;
}

function cleanField(field: MetricField): MetricField {
  return {
    key: toKey(field.key),
    label: field.label.trim(),
    unit: field.unit.trim(),
    valueType: field.valueType,
    required: field.required,
    min: field.min,
    max: field.max,
    step: field.step
  };
}

function toKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function updateField<K extends keyof MetricField>(
  fields: MetricField[],
  setFields: (fields: MetricField[]) => void,
  index: number,
  key: K,
  value: MetricField[K]
) {
  setFields(fields.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
}

function updateOptionalNumber(
  fields: MetricField[],
  setFields: (fields: MetricField[]) => void,
  index: number,
  key: 'min' | 'max' | 'step',
  value: string
) {
  setFields(fields.map((field, i) => (i === index ? { ...field, [key]: value === '' ? undefined : Number(value) } : field)));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
