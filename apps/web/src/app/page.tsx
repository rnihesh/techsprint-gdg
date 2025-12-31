import Link from "next/link";
import {
  MapPin,
  Camera,
  CheckCircle,
  BarChart3,
  Shield,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar, Footer } from "@/components/layout";

const features = [
  {
    icon: Camera,
    title: "Report Anonymously",
    description:
      "Submit civic issues without creating an account. Your identity stays protected while your voice is heard.",
  },
  {
    icon: MapPin,
    title: "Auto Location Tagging",
    description:
      "Issues are automatically tagged to the correct municipality using geolocation technology.",
  },
  {
    icon: Shield,
    title: "ML Verification",
    description:
      "AI-powered verification ensures resolution claims are genuine before marking issues as resolved.",
  },
  {
    icon: BarChart3,
    title: "Transparency Dashboard",
    description:
      "All data is public. Track resolution times, trends, and municipality performance openly.",
  },
];

const stats = [
  { value: "10,000+", label: "Issues Reported" },
  { value: "500+", label: "Municipalities" },
  { value: "75%", label: "Resolution Rate" },
  { value: "100%", label: "Transparent" },
];

const howItWorks = [
  {
    step: 1,
    title: "Spot an Issue",
    description:
      "See a pothole, garbage pile, or any civic problem in your area.",
  },
  {
    step: 2,
    title: "Take a Photo",
    description:
      "Capture the issue with your phone and add a brief description.",
  },
  {
    step: 3,
    title: "Submit Anonymously",
    description:
      "Your report is automatically tagged to the responsible municipality.",
  },
  {
    step: 4,
    title: "Track Progress",
    description: "Watch as municipalities respond and AI verifies resolutions.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Report Civic Issues.
                <span className="text-primary">
                  {" "}
                  Hold Municipalities Accountable.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                CivicSense empowers citizens across India to anonymously report
                civic problems and track how municipalities respond. All data is
                public, transparent, and verifiable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/report">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Camera className="mr-2 h-5 w-5" />
                    Report an Issue
                  </Button>
                </Link>
                <Link href="/map">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    View Issues Map
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Transparency Powered by Technology
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform combines citizen participation with AI verification
                to create a transparent system for civic accountability.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Reporting a civic issue takes less than a minute. Here&apos;s
                how your report makes an impact.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="py-20">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Municipality Leaderboard
                </h2>
                <p className="text-muted-foreground">
                  See how municipalities rank based on their response to civic
                  issues.
                </p>
              </div>
              <Link href="/leaderboard">
                <Button variant="outline">
                  View Full Leaderboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((rank) => (
                    <div
                      key={rank}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                            rank === 1
                              ? "bg-yellow-500 text-white"
                              : rank === 2
                              ? "bg-gray-400 text-white"
                              : "bg-amber-700 text-white"
                          }`}
                        >
                          {rank}
                        </div>
                        <div>
                          <div className="font-semibold">
                            Sample Municipality
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Karnataka
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">9,850</div>
                        <div className="text-sm text-muted-foreground">
                          Score
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">
              Be the Change in Your Community
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Every report you submit helps create a more accountable and
              responsive local government. Start making a difference today.
            </p>
            <Link href="/report">
              <Button size="lg" variant="secondary">
                <Camera className="mr-2 h-5 w-5" />
                Report Your First Issue
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
