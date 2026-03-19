import React from 'react';
import { Church } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background border-r border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)/0.12)_0%,_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 text-center px-12 space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 backdrop-blur-sm">
            <Church className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Harvesters International
            </h1>
            <h2 className="text-2xl font-bold tracking-tight">
              Christian Centre
            </h2>
            <p className="text-primary font-semibold text-lg tracking-wide">
              Anthony Campus
            </p>
          </div>
          <div className="h-px w-20 mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <p className="text-sm text-muted-foreground tracking-[0.2em] uppercase">
            Workers Attendance System
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="lg:hidden text-center mb-10 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
            <Church className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Harvesters International Christian Centre
            </h1>
            <p className="text-primary text-sm font-semibold mt-1">Anthony Campus</p>
          </div>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
