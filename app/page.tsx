import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, MessageSquare, BarChart3, Heart } from "lucide-react"

import { SiteHeader } from "@/components/site-header"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            <div>
              <h1 className="mb-6 text-balance font-bold text-6xl text-blue-600">
                Language mastery made easy!
              </h1>
              <p className="mb-8 text-pretty text-lg text-gray-700 leading-relaxed md:text-xl">
                Our innovative language programs make learning fun and effective for children of all ages. 
                Start their language journey today!
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 bg-yellow-400 px-8 font-semibold text-lg text-white hover:bg-yellow-500"
              >
                <Link href="/signup">Enroll now!</Link>
              </Button>
            </div>
            <div className="relative">
              {/* This is where we'll add the hero image */}
              <div className="relative z-10 rounded-lg overflow-hidden">
                <div className="absolute -right-4 top-4 w-64 h-64 bg-coral-500 rounded-full opacity-20" />
                <div className="absolute -left-4 bottom-4 w-64 h-64 bg-purple-500 rounded-full opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration at bottom */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,96L48,85.3C96,75,192,53,288,53.3C384,53,480,75,576,90.7C672,107,768,117,864,112C960,107,1056,85,1152,74.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" 
              fill="#F3F4F6"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance font-bold text-4xl md:text-5xl">Everything Your Child Needs to Succeed</h2>
            <p className="mx-auto max-w-2xl text-pretty text-muted-foreground text-lg leading-relaxed">
              Mi Ticha provides a safe, engaging environment for students to learn at their own pace with AI-powered
              support.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 font-bold text-xl">Chat with Moe</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant homework help from Moe, your friendly AI tutor who explains concepts in simple terms.
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
                <BookOpen className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="mb-2 font-bold text-xl">Reading Practice</h3>
              <p className="text-muted-foreground leading-relaxed">
                Improve reading skills with timed exercises and instant feedback on comprehension.
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <BarChart3 className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mb-2 font-bold text-xl">Track Progress</h3>
              <p className="text-muted-foreground leading-relaxed">
                Parents can monitor learning activities, time spent, and areas where their child excels.
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 font-bold text-xl">Safe & Supportive</h3>
              <p className="text-muted-foreground leading-relaxed">
                A secure environment designed specifically for young learners with parental oversight.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance font-bold text-4xl md:text-5xl">How Mi Ticha Works</h2>
            <p className="mx-auto max-w-2xl text-pretty text-muted-foreground text-lg leading-relaxed">
              Get started in three simple steps and watch your child's confidence grow.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-3xl text-white">
                1
              </div>
              <h3 className="mb-2 font-bold text-xl">Create Your Account</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sign up as a parent or guardian and add your child's profile in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-bold text-3xl text-white">
                2
              </div>
              <h3 className="mb-2 font-bold text-xl">Your Child Learns</h3>
              <p className="text-muted-foreground leading-relaxed">
                Students chat with Moe for homework help and practice reading at their own pace.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent font-bold text-3xl text-white">
                3
              </div>
              <h3 className="mb-2 font-bold text-xl">Monitor Progress</h3>
              <p className="text-muted-foreground leading-relaxed">
                View detailed insights on your dashboard and celebrate achievements together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-balance font-bold text-4xl md:text-5xl">
            Ready to Transform Your Child's Learning?
          </h2>
          <p className="mb-8 text-pretty text-muted-foreground text-lg leading-relaxed md:text-xl">
            Join Mi Ticha today and give your child the gift of personalized AI-powered education.
          </p>
          <Button asChild size="lg" className="h-14 bg-primary px-8 font-semibold text-lg hover:bg-primary/90">
            <Link href="/signup">Start Learning Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Mi Ticha. Empowering Sierra Leone students with AI education.</p>
        </div>
      </footer>
    </div>
  )
}
