import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text mb-4">
          Страница не найдена
        </h2>
        <p className="text-textSecondary mb-8">
          Запрашиваемая страница не существует или была удалена
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
