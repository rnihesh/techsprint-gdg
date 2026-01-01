"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

type Role = "user" | "municipality" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute - Wraps routes that need authentication/authorization
 *
 * Usage:
 * - <ProtectedRoute requireAuth>...</ProtectedRoute>  // Any logged in user
 * - <ProtectedRoute allowedRoles={["municipality", "admin"]}>...</ProtectedRoute>  // Only these roles
 * - <ProtectedRoute allowedRoles={["admin"]}>...</ProtectedRoute>  // Admin only
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Still loading auth state
    if (loading) return;

    // Not logged in
    if (!user) {
      if (requireAuth) {
        router.push(redirectTo);
      } else {
        setIsAuthorized(true);
      }
      setIsChecking(false);
      return;
    }

    // Logged in - check role if required
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (userProfile?.role || "user") as Role;

      // Admin has access to everything
      if (userRole === "admin" || allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // User doesn't have required role - redirect based on their actual role
      if (userRole === "user") {
        router.push("/");
      } else if (userRole === "municipality") {
        router.push("/municipality/dashboard");
      } else if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
      setIsChecking(false);
      return;
    }

    // No specific role required, just auth - user is authorized
    setIsAuthorized(true);
    setIsChecking(false);
  }, [
    user,
    userProfile,
    loading,
    allowedRoles,
    requireAuth,
    redirectTo,
    router,
  ]);

  // Show loading while checking
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authorized - will be redirected
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Unauthorized. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Specific role guards as convenience components
 */
export function MunicipalityOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["municipality", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}

export function AuthenticatedOnly({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireAuth>{children}</ProtectedRoute>;
}

export default ProtectedRoute;
