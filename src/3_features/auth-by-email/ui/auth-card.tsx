import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dumbbell } from 'lucide-react';
import { SessionService, useSession } from '@entities/session';

export function AuthCard() {
  const { setSession } = useSession();
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
      const result =
        mode === 'register'
          ? await SessionService.register({ email, name, password })
          : await SessionService.login({ email, password });
      setSession(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="authPanel">
      <div className="authHeader">
        <Dumbbell size={34} />
        <div>
          <h1>Тренировки</h1>
          <p>Первый зарегистрированный пользователь получает права администратора.</p>
        </div>
      </div>
      <form onSubmit={submit} className="formStack">
        <label>
          Почта
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@mail.ru" />
        </label>
        {mode === 'register' && (
          <label>
            Имя
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас называть" />
          </label>
        )}
        <label>
          Пароль
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
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
  );
}
