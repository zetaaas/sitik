import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';

interface RegisterForm {
  email: string;
  password: string;
  full_name?: string;
  iin?: string;
}

export const RegisterPage = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { email: '', password: '', full_name: '', iin: '' } });

  const onSubmit = async (values: RegisterForm) => {
    await registerUser(values);
    reset();
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-semibold text-primary">{t('auth.register')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.email')}</label>
          <input type="email" className="w-full rounded-md border px-3 py-2" {...register('email', { required: true })} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{t('auth.email')} required</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.password')}</label>
          <input type="password" className="w-full rounded-md border px-3 py-2" {...register('password', { required: true })} />
          {errors.password && <p className="mt-1 text-xs text-red-500">{t('auth.password')} required</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.name')}</label>
          <input type="text" className="w-full rounded-md border px-3 py-2" {...register('full_name')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">IIN</label>
          <input type="text" className="w-full rounded-md border px-3 py-2" {...register('iin')} />
        </div>
        <p className="text-xs text-gray-500">{t('auth.pendingNotice')}</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {isSubmitting ? t('app.loading') : t('auth.register')}
        </button>
        {isSubmitSuccessful && (
          <p className="text-sm text-emerald-600">
            {t('auth.volunteerPending')}
          </p>
        )}
      </form>
    </div>
  );
};
