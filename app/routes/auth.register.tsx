import { useState } from 'react';
import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import { Form, Link, useActionData, useNavigation, useSearchParams } from 'react-router';
import { requireAnonymous } from '@app/lib/session';
import { Button, Input } from '@app/components/ui';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle } from 'lucide-react';

interface ActionData {
  error?: string;
  errors?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);
  return {};
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  const errors: ActionData['errors'] = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Please enter your full name';
  }

  if (!email || !email.includes('@')) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 400 });
  }

  // Call the Better Auth API to sign up
  const origin = new URL(request.url).origin;
  const response = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
    },
    body: JSON.stringify({
      name: name.trim(),
      email,
      password,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return Response.json(
      { error: data.message || 'Failed to create account. Please try again.' },
      { status: 400 }
    );
  }

  // Get the Set-Cookie header from the response
  const setCookieHeader = response.headers.get('Set-Cookie');
  const headers = new Headers();
  if (setCookieHeader) {
    headers.append('Set-Cookie', setCookieHeader);
  }

  return redirect(redirectTo, { headers });
}

export default function RegisterPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const isSubmitting = navigation.state === 'submitting';
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600">
            Start tracking your finances today
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-8">
          {actionData?.error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
              <p className="text-sm text-red-600 font-medium">{actionData.error}</p>
            </div>
          )}

          <Form method="post" className="space-y-4 sm:space-y-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="John Doe"
                  className="pl-11 h-11 sm:h-12 text-base touch-target"
                  error={actionData?.errors?.name}
                />
              </div>
              {actionData?.errors?.name && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="pl-11 h-11 sm:h-12 text-base touch-target"
                  error={actionData?.errors?.email}
                />
              </div>
              {actionData?.errors?.email && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-11 sm:h-12 text-base touch-target"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={actionData?.errors?.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {actionData?.errors?.password && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          strengthScore >= level
                            ? strengthScore >= 3
                              ? 'bg-green-500'
                              : strengthScore >= 2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasMinLength ? 'opacity-100' : 'opacity-40'}`} />
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasUppercase ? 'opacity-100' : 'opacity-40'}`} />
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasLowercase ? 'opacity-100' : 'opacity-40'}`} />
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasNumber ? 'opacity-100' : 'opacity-40'}`} />
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="pl-11 h-11 sm:h-12 text-base touch-target"
                  error={actionData?.errors?.confirmPassword}
                />
              </div>
              {actionData?.errors?.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full h-12 text-base"
            >
              {!isSubmitting && <ArrowRight className="w-4 h-4 mr-2" />}
              Create account
            </Button>
          </Form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to={{ pathname: '/auth/login', search: redirectTo !== '/dashboard' ? `redirectTo=${redirectTo}` : undefined }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 sm:mt-8 text-center text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-gray-600 hover:text-gray-900 underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-gray-600 hover:text-gray-900 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Start tracking your finances today
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {actionData?.error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
              <p className="text-sm text-red-600 font-medium">{actionData.error}</p>
            </div>
          )}

          <Form method="post" className="space-y-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="John Doe"
                  className="pl-11"
                  error={actionData?.errors?.name}
                />
              </div>
              {actionData?.errors?.name && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="pl-11"
                  error={actionData?.errors?.email}
                />
              </div>
              {actionData?.errors?.email && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="pl-11 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={actionData?.errors?.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {actionData?.errors?.password && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          strengthScore >= level
                            ? strengthScore >= 3
                              ? 'bg-green-500'
                              : strengthScore >= 2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasMinLength ? 'opacity-100' : 'opacity-40'}`} />
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasUppercase ? 'opacity-100' : 'opacity-40'}`} />
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasLowercase ? 'opacity-100' : 'opacity-40'}`} />
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${hasNumber ? 'opacity-100' : 'opacity-40'}`} />
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="pl-11"
                  error={actionData?.errors?.confirmPassword}
                />
              </div>
              {actionData?.errors?.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600">{actionData.errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full h-11"
            >
              {!isSubmitting && <ArrowRight className="w-4 h-4 mr-2" />}
              Create account
            </Button>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to={{ pathname: '/auth/login', search: redirectTo !== '/dashboard' ? `redirectTo=${redirectTo}` : undefined }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-gray-600 hover:text-gray-900 underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-gray-600 hover:text-gray-900 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
