import { useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { WorkoutService } from '@entities/workout';
import type { WorkoutDetail, WorkoutSummary } from '@entities/workout';
import { WorkoutReadOnly } from '@widgets/workout-readonly';
import { formatDate } from '@shared/lib/format-date';
import { Notice } from '@shared/ui';

export function HistoryPage() {
  const [items, setItems] = useState<WorkoutSummary[]>([]);
  const [selected, setSelected] = useState<WorkoutDetail | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');

  async function openWorkout(id: number) {
    setShareUrl('');
    setSelected(await WorkoutService.get(id));
  }

  async function loadList() {
    const list = await WorkoutService.list();
    setItems(list);
    if (!selected && list[0]) {
      await openWorkout(list[0].id);
    }
  }

  useEffect(() => {
    loadList().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки истории'));
  }, []);

  async function share() {
    if (!selected) {
      return;
    }
    const link = await WorkoutService.createShareLink(selected.id);
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
                  <button className="secondary" onClick={() => WorkoutService.exportCSV(selected.id)}>
                    <Download size={17} /> CSV
                  </button>
                  <button className="secondary" onClick={() => WorkoutService.exportJSON(selected.id)}>
                    <Download size={17} /> JSON
                  </button>
                </div>
              </div>
              {shareUrl && <input className="shareInput" value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />}
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

export default HistoryPage;

