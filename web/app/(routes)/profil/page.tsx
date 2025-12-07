'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Heart, Home, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function ProfilPage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-textSecondary">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/prijava');
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Личный кабинет</h1>
          <p className="text-textSecondary">{user.email}</p>
        </div>

        {/* Меню */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Избранное */}
          <Link href="/profil/omiljeno">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="flex items-center p-6">
                <Heart className="h-12 w-12 text-primary mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-text mb-1">Избранное</h3>
                  <p className="text-sm text-textSecondary">Сохраненные объявления</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Мои объявления */}
          <Link href="/profil/moji-oglasi">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="flex items-center p-6">
                <Home className="h-12 w-12 text-primary mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-text mb-1">Мои объявления</h3>
                  <p className="text-sm text-textSecondary">Управление объявлениями</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Настройки */}
          <Link href="/podesavanja">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="flex items-center p-6">
                <Settings className="h-12 w-12 text-primary mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-text mb-1">Настройки</h3>
                  <p className="text-sm text-textSecondary">Настройки профиля</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Выход */}
          <Card
            className="hover:shadow-lg transition-all cursor-pointer"
            onClick={handleLogout}
          >
            <CardContent className="flex items-center p-6">
              <LogOut className="h-12 w-12 text-error mr-4" />
              <div>
                <h3 className="text-xl font-semibold text-text mb-1">Выйти</h3>
                <p className="text-sm text-textSecondary">Выход из аккаунта</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
