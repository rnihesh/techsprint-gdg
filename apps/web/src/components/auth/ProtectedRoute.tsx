"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'citizen' | 'municipality' | 'admin';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireRole,
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  useEffect(() => {
    if (!loading && user && requireRole && userProfile) {
      if (userProfile.role !== requireRole && userProfile.role !== 'admin') {
        router.push('/unauthorized');
      }
    }
  }, [user, userProfile, loading, requireRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireRole && userProfile && userProfile.role !== requireRole && userProfile.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
