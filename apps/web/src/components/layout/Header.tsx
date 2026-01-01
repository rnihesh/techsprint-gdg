"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  MapPin,
  Trophy,
  Building2,
  User,
  LogIn,
  LogOut,
  LayoutDashboard,
  Loader2,
  Shield,
  FileText,
  Users,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { toast } from "sonner";

// Navigation items for different user roles
const getNavigation = (role: string | undefined) => {
  if (role === "PLATFORM_MAINTAINER") {
    // Admin: management pages only
    return [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ];
  }

  if (role === "MUNICIPALITY_USER") {
    // Municipality: view and solve issues in their area
    return [
      { name: "Issues", href: "/municipality/issues", icon: ClipboardList },
      { name: "Map View", href: "/map", icon: MapPin },
    ];
  }

  // Citizen or not logged in: report issue, map view, leaderboard
  return [
    { name: "Report Issue", href: "/report", icon: FileText },
    { name: "Map View", href: "/map", icon: MapPin },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Municipalities", href: "/municipalities", icon: Building2 },
  ];
};

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, userProfile, signOut, loading } = useAuth();
  const router = useRouter();

  const isLoggedIn = !!user;
  const userRole = userProfile?.role;

  // Debug log for role issues
  useEffect(() => {
    if (user && userProfile) {
      console.log("[Header] User role:", userProfile.role);
    }
  }, [user, userProfile]);

  // If user is logged in but profile not loaded yet, don't show nav (avoid flicker)
  const isProfileLoading = isLoggedIn && !userProfile;

  const navigation = useMemo(() => {
    if (isProfileLoading) return []; // Don't show nav while loading profile
    return getNavigation(userRole);
  }, [userRole, isProfileLoading]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">
            CivicLemma
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center space-x-4">
          {loading ? (
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="h-5 w-5 animate-spin" />
            </Button>
          ) : isLoggedIn ? (
            <UserMenu />
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <nav className="flex flex-col space-y-4 mt-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-lg font-medium text-muted-foreground hover:text-primary"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <hr className="my-4" />
              {loading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-lg font-medium text-muted-foreground hover:text-primary"
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
