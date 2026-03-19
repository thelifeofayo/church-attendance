import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import api, { getErrorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [serverMessage, setServerMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetRequest = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const res = await api.post<{
        success: boolean;
        data?: { resetToken?: string; resetUrl?: string };
      }>('/auth/forgot-password', data);
      return res.data.data;
    },
    onSuccess: (resetData) => {
      const resetToken = resetData?.resetToken;
      if (resetToken) {
        toast.success('Reset link ready');
        navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
        return;
      }

      setServerMessage('If your account exists, we sent a password reset link to your email.');
      toast.success('Password reset link sent (if account exists)');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((data) => resetRequest.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@church.org"
              autoComplete="email"
              className="h-10"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {serverMessage && (
            <div className="p-3 text-sm text-muted-foreground border border-border rounded-lg">
              {serverMessage}
            </div>
          )}

          <Button type="submit" className="w-full h-10" disabled={isSubmitting || resetRequest.isPending}>
            {resetRequest.isPending ? 'Sending...' : 'Send reset link'}
          </Button>

          <div className="flex justify-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link to="/login" className="underline hover:text-foreground">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

