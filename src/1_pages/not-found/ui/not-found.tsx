import { Link } from 'react-router';
import { ROUTES_PATH } from '@app/router/routes';

export function NotFoundPage() {
  return (
    <div className="authLayout">
      <section className="authPanel">
        <h1>Страница не найдена</h1>
        <p>Такого маршрута в приложении нет.</p>
        <Link className="primary" to={ROUTES_PATH.WORKOUT}>
          К тренировке
        </Link>
      </section>
    </div>
  );
}

export default NotFoundPage;

