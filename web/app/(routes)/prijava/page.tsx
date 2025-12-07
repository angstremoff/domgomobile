import { Metadata } from 'next';
import { LoginForm } from '@/components/forms/LoginForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { FormTitle } from '@/components/forms/FormTitle';

export const metadata: Metadata = {
  title: 'Prijava - DomGo.rs',
  description: 'Prijavite se u svoj DomGo.rs nalog',
};

export default function PrijavaPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <FormTitle translationKey="auth.login" />
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
