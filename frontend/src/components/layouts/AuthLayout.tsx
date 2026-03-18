import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at top, #1a1200 0%, #0a0a0a 50%, #000000 100%)',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Church header */}
      <div className="relative z-10 text-center mb-8 px-4">
        <h1
          className="font-black tracking-widest uppercase text-white"
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            textShadow: '0 0 30px rgba(251,191,36,0.4)',
            letterSpacing: '0.15em',
          }}
        >
          Harvesters International Christian Centre
          <br />
          <span style={{ color: '#fbbf24' }}>Anthony Campus</span>
        </h1>
        <p
          className="mt-3 font-semibold tracking-[0.3em] uppercase"
          style={{
            fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
            color: 'rgba(251,191,36,0.7)',
          }}
        >
          Workers Attendance
        </p>
        <div
          className="mx-auto mt-4"
          style={{
            height: '1px',
            width: '80px',
            background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
