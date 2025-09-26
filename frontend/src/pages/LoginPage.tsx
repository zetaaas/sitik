import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-semibold text-primary">{t('auth.login')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.email')}</label>
          <input
            type="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            {...register('email', { required: true })}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{t('auth.email')} required</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.password')}</label>
          <input
            type="password"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            {...register('password', { required: true })}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{t('auth.password')} required</p>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-accent px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {isSubmitting ? t('app.loading') : t('auth.login')}
        </button>
      </form>
    </div>
  );
};
