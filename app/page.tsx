import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, MessageSquare, BarChart3, Heart } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="mb-6 text-balance font-bold text-5xl text-white md:text-6xl lg:text-7xl">Mi Ticha</h1>
            <p className="mb-4 text-balance font-semibold text-2xl text-white/95 md:text-3xl">
              Your Child's AI Learning Companion
            </p>
            <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-white/90 leading-relaxed md:text-xl">
              Empowering Sierra Leone students ages 8-14 with personalized homework help and reading practice. Meet Moe,
              the friendly AI tutor who makes learning fun!
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 bg-white px-8 font-semibold text-lg text-primary hover:bg-white/90"
              >
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-2 border-white bg-white/10 px-8 font-semibold text-lg text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link href="/student-login">Student Login</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-2 border-white bg-transparent px-8 font-semibold text-lg text-white hover:bg-white/10"
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute top-20 right-10 h-32 w-32 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 left-10 h-40 w-40 rounded-full bg-white blur-3xl" />
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
