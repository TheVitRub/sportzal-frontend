import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Timer, Volume2, VolumeX, Watch } from 'lucide-react';

const DEFAULT_TIMER_SECONDS = 90;
const TIMER_PRESETS = [30, 60, 90, 180];

type TimeMode = 'timer' | 'stopwatch';
type TimekeeperVariant = 'rest' | 'exercise';

interface WorkoutTimekeeperProps {
  variant?: TimekeeperVariant;
  eyebrow?: string;
  title?: string;
  description?: string;
  defaultTimerSeconds?: number;
  timerPresets?: number[];
  showStopwatch?: boolean;
  saveLabel?: string;
  onSaveDuration?: (seconds: number) => Promise<void> | void;
}

export function WorkoutTimekeeper({
  variant = 'rest',
  eyebrow,
  title,
  description,
  defaultTimerSeconds = DEFAULT_TIMER_SECONDS,
  timerPresets = TIMER_PRESETS,
  showStopwatch,
  saveLabel = 'Записать время',
  onSaveDuration
}: WorkoutTimekeeperProps) {
  const hasStopwatch = showStopwatch ?? variant === 'exercise';
  const [mode, setMode] = useState<TimeMode>('timer');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timerDuration, setTimerDuration] = useState(defaultTimerSeconds);
  const [timerRemaining, setTimerRemaining] = useState(defaultTimerSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerDone, setTimerDone] = useState(false);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchStartedAt, setStopwatchStartedAt] = useState<number | null>(null);
  const [savingDuration, setSavingDuration] = useState(false);
  const [saveError, setSaveError] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const displayEyebrow = eyebrow ?? (variant === 'rest' ? 'Отдых' : 'Время');
  const displayTitle = title ?? (variant === 'rest' ? 'Отдых между подходами' : 'Время упражнения');

  const timerMinutes = Math.floor(timerDuration / 60);
  const timerSeconds = timerDuration % 60;
  const capturedSeconds = mode === 'timer' ? Math.max(0, timerDuration - timerRemaining) : stopwatchElapsed;
  const canSaveDuration = Boolean(onSaveDuration) && capturedSeconds > 0 && !timerRunning && !stopwatchRunning;
  const timerProgress = useMemo(() => {
    if (timerDuration <= 0) {
      return 0;
    }
    return Math.round(((timerDuration - timerRemaining) / timerDuration) * 100);
  }, [timerDuration, timerRemaining]);

  useEffect(() => {
    if (!hasStopwatch && mode === 'stopwatch') {
      setMode('timer');
    }
  }, [hasStopwatch, mode]);

  useEffect(() => {
    if (!timerRunning || timerEndAt === null) {
      return;
    }

    function tick() {
      const secondsLeft = Math.max(0, Math.ceil(((timerEndAt ?? 0) - Date.now()) / 1000));
      setTimerRemaining(secondsLeft);

      if (secondsLeft === 0) {
        setTimerRunning(false);
        setTimerEndAt(null);
        setTimerDone(true);
        playSignal();
      }
    }

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [soundEnabled, timerEndAt, timerRunning]);

  useEffect(() => {
    if (!stopwatchRunning || stopwatchStartedAt === null) {
      return;
    }

    function tick() {
      setStopwatchElapsed(Math.floor((Date.now() - (stopwatchStartedAt ?? Date.now())) / 1000));
    }

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [stopwatchRunning, stopwatchStartedAt]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  function getAudioContext() {
    if (!window.AudioContext) {
      return null;
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }

  function playSignal() {
    if (!soundEnabled) {
      return;
    }

    const context = getAudioContext();
    if (!context) {
      return;
    }
    const startedAt = context.currentTime + 0.03;

    [0, 0.28, 0.56].forEach((offset) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = startedAt + offset;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    });
  }

  function updateTimerDuration(minutes: number, seconds: number) {
    const nextMinutes = clamp(minutes, 0, 180);
    const nextSeconds = clamp(seconds, 0, 59);
    const nextDuration = Math.max(1, nextMinutes * 60 + nextSeconds);
    setTimerDuration(nextDuration);
    setTimerRemaining(nextDuration);
    setTimerRunning(false);
    setTimerEndAt(null);
    setTimerDone(false);
  }

  function setTimerPreset(seconds: number) {
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
    setTimerRunning(false);
    setTimerEndAt(null);
    setTimerDone(false);
  }

  function startTimer() {
    if (soundEnabled) {
      getAudioContext();
    }
    const remaining = timerRemaining > 0 ? timerRemaining : timerDuration;
    setTimerRemaining(remaining);
    setTimerEndAt(Date.now() + remaining * 1000);
    setTimerRunning(true);
    setTimerDone(false);
  }

  function pauseTimer() {
    if (timerEndAt !== null) {
      setTimerRemaining(Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000)));
    }
    setTimerRunning(false);
    setTimerEndAt(null);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerEndAt(null);
    setTimerRemaining(timerDuration);
    setTimerDone(false);
  }

  function startStopwatch() {
    setStopwatchStartedAt(Date.now() - stopwatchElapsed * 1000);
    setStopwatchRunning(true);
  }

  function pauseStopwatch() {
    setStopwatchRunning(false);
    setStopwatchStartedAt(null);
  }

  function resetStopwatch() {
    setStopwatchRunning(false);
    setStopwatchStartedAt(null);
    setStopwatchElapsed(0);
  }

  async function saveDuration() {
    if (!onSaveDuration || !canSaveDuration) {
      return;
    }

    setSaveError('');
    setSavingDuration(true);
    try {
      await onSaveDuration(capturedSeconds);
      if (mode === 'timer') {
        resetTimer();
      } else {
        resetStopwatch();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось записать время');
    } finally {
      setSavingDuration(false);
    }
  }

  return (
    <section className={`timekeeperPanel ${variant}Timekeeper`} aria-label={displayTitle}>
      <div className="timekeeperTop">
        <div>
          <span className="eyebrow">{displayEyebrow}</span>
          <h2>{displayTitle}</h2>
          {description && <p className="timekeeperDescription">{description}</p>}
        </div>
        <button
          className="iconButton"
          type="button"
          onClick={() => setSoundEnabled((enabled) => !enabled)}
          aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          aria-pressed={soundEnabled}
          title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {hasStopwatch && (
        <div className="timeModeSwitch" role="tablist" aria-label="Режим времени">
          <button
            type="button"
            className={mode === 'timer' ? 'active' : ''}
            onClick={() => setMode('timer')}
            aria-selected={mode === 'timer'}
            role="tab"
          >
            <Timer size={18} /> Таймер
          </button>
          <button
            type="button"
            className={mode === 'stopwatch' ? 'active' : ''}
            onClick={() => setMode('stopwatch')}
            aria-selected={mode === 'stopwatch'}
            role="tab"
          >
            <Watch size={18} /> Секундомер
          </button>
        </div>
      )}

      {mode === 'timer' ? (
        <div className="timeModePanel" role="tabpanel">
          <div className={`timeDisplay ${timerDone ? 'done' : ''}`}>
            <span>{formatDuration(timerRemaining)}</span>
            <div className="timerProgress" aria-hidden="true">
              <span style={{ width: `${timerProgress}%` }} />
            </div>
          </div>

          <div className="timerInputs" aria-label="Длительность таймера">
            <label>
              Мин
              <input
                type="number"
                min="0"
                max="180"
                value={timerMinutes}
                onChange={(event) => updateTimerDuration(Number(event.target.value), timerSeconds)}
                disabled={timerRunning}
              />
            </label>
            <label>
              Сек
              <input
                type="number"
                min="0"
                max="59"
                value={timerSeconds}
                onChange={(event) => updateTimerDuration(timerMinutes, Number(event.target.value))}
                disabled={timerRunning}
              />
            </label>
          </div>

          <div className="timerPresets" aria-label="Быстрый выбор таймера">
            {timerPresets.map((seconds) => (
              <button
                key={seconds}
                type="button"
                className={timerDuration === seconds ? 'active' : ''}
                onClick={() => setTimerPreset(seconds)}
                disabled={timerRunning}
              >
                {formatPreset(seconds)}
              </button>
            ))}
          </div>

          <div className="timeActions">
            {timerRunning ? (
              <button className="secondary" type="button" onClick={pauseTimer}>
                <Pause size={18} /> Пауза
              </button>
            ) : (
              <button className="primary" type="button" onClick={startTimer}>
                <Play size={18} /> Старт
              </button>
            )}
            <button className="secondary" type="button" onClick={resetTimer}>
              <RotateCcw size={18} /> Сброс
            </button>
          </div>
          {onSaveDuration && (
            <div className="durationSave">
              <button className="secondary" type="button" onClick={saveDuration} disabled={!canSaveDuration || savingDuration}>
                <CheckCircle2 size={18} /> {savingDuration ? 'Записываю' : saveLabel}
              </button>
              <span>{capturedSeconds > 0 ? `Будет записано: ${formatDuration(capturedSeconds)}` : 'Запустите время подхода'}</span>
              {saveError && <strong className="errorText">{saveError}</strong>}
            </div>
          )}
        </div>
      ) : (
        <div className="timeModePanel" role="tabpanel">
          <div className="timeDisplay stopwatchDisplay">
            <span>{formatDuration(stopwatchElapsed)}</span>
          </div>

          <div className="timeActions">
            {stopwatchRunning ? (
              <button className="secondary" type="button" onClick={pauseStopwatch}>
                <Pause size={18} /> Пауза
              </button>
            ) : (
              <button className="primary" type="button" onClick={startStopwatch}>
                <Play size={18} /> Старт
              </button>
            )}
            <button className="secondary" type="button" onClick={resetStopwatch}>
              <RotateCcw size={18} /> Сброс
            </button>
          </div>
          {onSaveDuration && (
            <div className="durationSave">
              <button className="secondary" type="button" onClick={saveDuration} disabled={!canSaveDuration || savingDuration}>
                <CheckCircle2 size={18} /> {savingDuration ? 'Записываю' : saveLabel}
              </button>
              <span>{capturedSeconds > 0 ? `Будет записано: ${formatDuration(capturedSeconds)}` : 'Запустите время подхода'}</span>
              {saveError && <strong className="errorText">{saveError}</strong>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function formatDuration(totalSeconds: number) {
  const safeTotal = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const seconds = safeTotal % 60;

  if (hours > 0) {
    return `${hours}:${padTime(minutes)}:${padTime(seconds)}`;
  }
  return `${padTime(minutes)}:${padTime(seconds)}`;
}

function formatPreset(seconds: number) {
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  if (seconds % 60 === 0) {
    return `${seconds / 60} мин`;
  }
  return formatDuration(seconds);
}

function padTime(value: number) {
  return String(value).padStart(2, '0');
}
