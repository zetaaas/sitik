import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

interface TwoFactorForm {
  code: string;
}

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login, verifyTwoFactor, twoFactorChallenge, error, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });

  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    reset: resetCodeForm,
    formState: { errors: codeErrors, isSubmitting: isCodeSubmitting },
  } = useForm<TwoFactorForm>({ defaultValues: { code: '' } });

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
    } catch (err) {
      console.error(err);
    }
  };

  const onVerify = async (values: TwoFactorForm) => {
    if (!twoFactorChallenge) return;
    try {
      await verifyTwoFactor(twoFactorChallenge.challengeId, values.code);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  useEffect(() => {
    if (twoFactorChallenge) {
      resetCodeForm({ code: '' });
    }
  }, [twoFactorChallenge, resetCodeForm]);

  const handleRestart = () => {
    logout();
    resetCodeForm({ code: '' });
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-semibold text-primary">
        {twoFactorChallenge ? t('auth.twoFactorTitle') : t('auth.login')}
      </h1>
      {!twoFactorChallenge ? (
        <form onSubmit={handleLoginSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.email')}</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              {...registerLogin('email', { required: true })}
            />
            {loginErrors.email && (
              <p className="mt-1 text-xs text-red-500">{`${t('auth.email')} ${t('auth.required')}`}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.password')}</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              {...registerLogin('password', { required: true })}
            />
            {loginErrors.password && (
              <p className="mt-1 text-xs text-red-500">{`${t('auth.password')} ${t('auth.required')}`}</p>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoginSubmitting || loading}
            className="w-full rounded-md bg-accent px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {isLoginSubmitting || loading ? t('app.loading') : t('auth.login')}
          </button>
          <Link
            to="/register"
            className="mt-2 block w-full rounded-md border border-accent px-4 py-2 text-center text-accent hover:bg-emerald-50"
          >
            {t('auth.createAccount')}
          </Link>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('auth.twoFactorSubtitle', { phone: twoFactorChallenge.maskedPhone })}
          </p>
          <form onSubmit={handleCodeSubmit(onVerify)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.code')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 tracking-widest"
                {...registerCode('code', { required: true })}
              />
              {codeErrors.code && (
                <p className="mt-1 text-xs text-red-500">{t('auth.code')} {t('auth.required')}</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isCodeSubmitting || loading}
              className="w-full rounded-md bg-accent px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {isCodeSubmitting || loading ? t('app.loading') : t('auth.verify')}
            </button>
          </form>
          <button
            type="button"
            onClick={handleRestart}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t('auth.backToLogin')}
          </button>
        </div>
      )}
    </div>
  );
};
