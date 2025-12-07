import { Metadata } from 'next';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Регистрация - DomGo.rs',
  description: 'Создайте аккаунт на DomGo.rs',
};

export default function RegistracijaPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Регистрация</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
