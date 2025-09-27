import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

interface RegisterForm {
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
  full_name?: string;
  iin?: string;
}

export const RegisterPage = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { email: '', password: '', password_confirm: '', phone_number: '', full_name: '', iin: '' },
  });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    setSuccess(false);
    if (values.password !== values.password_confirm) {
      setError('password_confirm', { type: 'validate', message: t('auth.passwordMismatch') });
      return;
    }
    try {
      await registerUser(values);
      setSuccess(true);
      reset({ email: '', password: '', password_confirm: '', phone_number: '', full_name: '', iin: '' });
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setServerError(typeof detail === 'string' ? detail : t('auth.registrationFailed'));
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-semibold text-primary">{t('auth.register')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.email')}</label>
          <input type="email" className="w-full rounded-md border px-3 py-2" {...register('email', { required: true })} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{`${t('auth.email')} ${t('auth.required')}`}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.password')}</label>
          <input type="password" className="w-full rounded-md border px-3 py-2" {...register('password', { required: true })} />
          {errors.password && <p className="mt-1 text-xs text-red-500">{`${t('auth.password')} ${t('auth.required')}`}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.confirmPassword')}</label>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2"
            {...register('password_confirm', { required: true })}
          />
          {errors.password_confirm && (
            <p className="mt-1 text-xs text-red-500">
              {errors.password_confirm.message ?? t('auth.confirmPasswordRequired')}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.phone')}</label>
          <input
            type="tel"
            className="w-full rounded-md border px-3 py-2"
            {...register('phone_number', { required: true })}
          />
          {errors.phone_number && <p className="mt-1 text-xs text-red-500">{t('auth.phoneRequired')}</p>}
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
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}
        {success && (
          <p className="text-sm text-emerald-600">{t('auth.registerSuccess')}</p>
        )}
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-accent hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
};
