import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">CivicLemma</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering citizens to report civic issues and hold municipalities
              accountable.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">
                  Report Issue
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-primary">
                  Map View
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-primary">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/municipalities" className="hover:text-primary">
                  Municipalities
                </Link>
              </li>
            </ul>
          </div>

          {/* For Municipalities */}
          <div>
            <h3 className="font-semibold mb-4">For Municipalities</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/login" className="hover:text-primary">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-primary">
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/municipality/dashboard"
                  className="hover:text-primary"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} CivicLemma. Built for GDG
            TechSprint.
          </p>
        </div>
      </div>
    </footer>
  );
}
