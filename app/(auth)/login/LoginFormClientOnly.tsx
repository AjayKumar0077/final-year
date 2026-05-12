'use client';

import dynamic from 'next/dynamic';

const LoginForm = dynamic(
  () => import('@/components/auth/LoginForm').then((mod) => mod.LoginForm),
  { ssr: false },
);

export default function LoginFormClientOnly() {
  return <LoginForm />;
}
