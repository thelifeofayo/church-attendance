import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import api, { getErrorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const passwordStrength = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

const resetPasswordSchema = z
  .object({
    password: passwordStrength,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPassword = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      if (!token) {
        throw new Error('Reset token is missing');
      }
      await api.post('/auth/reset-password', { token, password: data.password });
    },
    onSuccess: () => {
      toast.success('Password updated');
      navigate('/login');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!token) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
            <p className="text-sm text-muted-foreground">
              This reset link is missing a token.
            </p>
          </div>
          <Button type="button" onClick={() => navigate('/forgot-password')} className="w-full h-10">
            Request a new reset link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Choose a new password</h2>
          <p className="text-sm text-muted-foreground">
            Enter a strong password you haven’t used before.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((data) => resetPassword.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" className="h-10" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="h-10"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-10" disabled={isSubmitting || resetPassword.isPending}>
            {resetPassword.isPending ? 'Updating...' : 'Update password'}
          </Button>

          <div className="flex justify-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <button type="button" onClick={() => navigate('/login')} className="underline hover:text-foreground">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

