import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { CatalogService } from '@entities/catalog';
import type { Category, Exercise, MetricField, MetricSchema } from '@entities/catalog';
import { toKey } from '@shared/lib/metric';
import { Notice } from '@shared/ui';

const defaultField: MetricField = {
  key: 'reps',
  label: 'Повторы',
  unit: 'раз',
  valueType: 'int',
  required: true,
  min: 1
};

export function AdminPage() {
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
      CatalogService.listCategories(),
      CatalogService.listExercises(true)
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
    setError('');
    try {
      await CatalogService.createCategory({
        name: categoryName,
        description: categoryDescription,
        isActive: true,
        sortOrder: categories.length + 1
      });
      setCategoryName('');
      setCategoryDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать категорию');
    }
  }

  async function createExercise(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const metricSchema: MetricSchema = {
        type: schemaType,
        fields: fields.map(cleanField)
      };
      await CatalogService.createExercise({
        categoryId: Number(categoryID),
        title,
        description,
        metricSchema,
        isActive: true
      });
      setTitle('');
      setDescription('');
      setFields([defaultField]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать упражнение');
    }
  }

  async function uploadMedia(exerciseId: number, file: File) {
    setError('');
    try {
      await CatalogService.uploadMedia(exerciseId, file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить медиа');
    }
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
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
          </label>
          <label>
            Описание
            <textarea value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} />
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
              <select value={categoryID} onChange={(event) => setCategoryID(event.target.value)} required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Тип схемы
              <select value={schemaType} onChange={(event) => setSchemaType(event.target.value)} required>
                <option value="strength">Силовое</option>
                <option value="treadmill">Беговая дорожка</option>
                <option value="duration">На время</option>
              </select>
            </label>
          </div>
          <label>
            Название
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Описание
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <div className="metricBuilder">
            <div className="sectionTitle">
              <h3>Метрики подхода</h3>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setFields([
                    ...fields,
                    {
                      ...defaultField,
                      key: `field_${fields.length + 1}`,
                      label: 'Метрика'
                    }
                  ])
                }
              >
                <Plus size={16} /> Поле
              </button>
            </div>

            {fields.map((field, index) => (
              <div className="metricRow" key={`${field.key}-${index}`}>
                <input value={field.key} onChange={(event) => updateField(fields, setFields, index, 'key', toKey(event.target.value))} placeholder="код поля" />
                <input value={field.label} onChange={(event) => updateField(fields, setFields, index, 'label', event.target.value)} placeholder="Название" />
                <input value={field.unit} onChange={(event) => updateField(fields, setFields, index, 'unit', event.target.value)} placeholder="Ед." />
                <select value={field.valueType} onChange={(event) => updateField(fields, setFields, index, 'valueType', event.target.value as MetricField['valueType'])}>
                  <option value="int">Целое</option>
                  <option value="float">Число</option>
                  <option value="text">Текст</option>
                </select>
                <label className="checkLine">
                  <input type="checkbox" checked={field.required} onChange={(event) => updateField(fields, setFields, index, 'required', event.target.checked)} />
                  Обяз.
                </label>
                <input type="number" value={field.min ?? ''} onChange={(event) => updateOptionalNumber(fields, setFields, index, 'min', event.target.value)} placeholder="Мин" />
                <button type="button" className="iconButton danger" onClick={() => setFields(fields.filter((_, i) => i !== index))} title="Удалить поле">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button className="primary" disabled={!categoryID || fields.length === 0}>
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
                <input type="file" accept="image/*,video/*" onChange={(event) => event.target.files?.[0] && uploadMedia(exercise.id, event.target.files[0])} />
              </label>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
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

export default AdminPage;
