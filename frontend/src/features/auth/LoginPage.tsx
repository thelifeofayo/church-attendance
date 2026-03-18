import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import api, { getErrorMessage } from '@/lib/api';
import { LoginResponse } from 'shared';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  return (
    <AuthLayout>
      <Card
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #0d0d0d 100%)',
          border: '1px solid rgba(251,191,36,0.2)',
          boxShadow: '0 0 40px rgba(251,191,36,0.08), 0 25px 50px rgba(0,0,0,0.6)',
        }}
      >
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl text-center text-white">Sign In</CardTitle>
          <CardDescription className="text-center" style={{ color: 'rgba(251,191,36,0.6)' }}>
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-400/50 focus:ring-amber-400/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-400/50 focus:ring-amber-400/20"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full font-semibold tracking-wide transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#000',
                border: 'none',
                boxShadow: loginMutation.isPending ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
              }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
