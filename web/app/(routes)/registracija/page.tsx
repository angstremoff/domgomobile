import { Metadata } from 'next';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { FormTitle } from '@/components/forms/FormTitle';

export const metadata: Metadata = {
  title: 'Registracija - DomGo.rs',
  description: 'Kreirajte nalog na DomGo.rs',
};

export default function RegistracijaPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <FormTitle translationKey="auth.register" />
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
