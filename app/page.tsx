import Link from "next/link";
import Image from "next/image";

import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: BookOpen,
    title: "Culturally relevant lessons",
    description:
      "Every example, story, and exercise draws from Sierra Leonean daily life.",
  },
  {
    icon: Sparkles,
    title: "Adaptive AI tutoring",
    description:
      "Moe adjusts difficulty in real time, offering hints when needed and celebrating every win.",
  },
  {
    icon: GraduationCap,
    title: "Progress tracking",
    description:
      "Guardians receive weekly summaries showing strengths, areas to review, and next steps.",
  },
];

const steps = [
  {
    title: "Sign up and set goals",
    description:
      "Tell us your child's grade level and what you'd like them to master—reading, math, or creative writing.",
  },
  {
    title: "Let Moe guide every session",
    description:
      "Students get bite-sized explanations, reading prompts, and supportive nudges that keep them engaged.",
  },
  {
    title: "Monitor and celebrate",
    description:
      "Review detailed reports, track milestones, and watch confidence grow week by week.",
  },
];

const safetyHighlights = [
  {
    icon: ShieldCheck,
    title: "Protected conversations",
    description:
      "All interactions are encrypted and never shared without your permission.",
  },
  {
    icon: Users,
    title: "Guardian oversight",
    description:
      "Access full transcripts anytime and set custom guardrails for content.",
  },
  {
    icon: Sparkles,
    title: "Age-appropriate content",
    description:
      "Moe is trained to recognize sensitive topics and defer to guardians when needed.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="relative overflow-hidden">
        <div
          className="absolute -left-1/3 top-0 h-[520px] w-[520px] rounded-full bg-blue-500/30 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute right-[-18rem] top-40 h-[540px] w-[540px] rounded-full bg-yellow-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-1 pb-17 pt-1 md:pt-5">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-white"
            >
              Moe
              {/* Mi Ticha */}
            </Link>
            <div className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
              <Link href="#features" className="transition hover:text-white">
                How it helps
              </Link>
              <Link href="#steps" className="transition hover:text-white">
                How it works
              </Link>
              <Link href="#safety" className="transition hover:text-white">
                Safety
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                className="hidden text-white/80 hover:text-white md:inline-flex"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-amber-400 px-5 text-slate-900 hover:bg-amber-300"
              >
                <Link href="/signup">Start free trial</Link>
              </Button>
            </div>
          </nav>

          <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <Badge
                variant="secondary"
                className="bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em]  text-white"
              >
                AI tutor for Sierra Leone
              </Badge>
              <h4 className="text-balance text-lg font-bold leading-tight md:text-3xl">
                Moe builds confident readers and problem solvers
              </h4>
              <p className="text-sm leading-relaxed text-white/80 md:text-xl">
                Moe, our friendly AI tutor, delivers homework help, guided
                reading practice, and crystal-clear progress insights so
                families can celebrate every milestone together.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-full bg-amber-400 px-8 text-base font-semibold text-slate-900 hover:bg-amber-300"
                >
                  <Link href="/signup">Parent sign up</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-white/30 bg-white/10 px-8 text-base font-semibold text-white hover:bg-white/20"
                >
                  <Link href="/student-login">Student log in</Link>
                </Button>
              </div>
              <p className="text-sm text-white/70">
                No credit card required for the first 14 days.
              </p>
            </div>
            <div className="relative">
              <div
                className="absolute -right-6 top-10 h-32 w-32 rounded-full bg-blue-400/40 blur-2xl"
                aria-hidden
              />
              <div
                className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-amber-400/30 blur-2xl"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
                <div className="relative aspect-[1.9/2]">
                  <Image
                    src="/assets/ami.png"
                    alt="Students learning with Moe"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Families Section */}
      <section id="families" className="bg-slate-50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl grid items-center gap-12 md:grid-cols-2">
          <div className="order-last md:order-first">
            <div className="relative overflow-hidden rounded-3xl shadow-xl bg-blue-500">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/assets/img1.png"
                  alt="Parent reviewing progress on the Mi Ticha dashboard"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500 ">
                For families
              </p>
            </Badge>{" "}
            <h2 className="text-balance font-bold text-4xl text-slate-900 md:text-5xl">
              Everything parents need to support learning at home
            </h2>
            <p className="text-lg leading-relaxed text-slate-700">
              Mi Ticha brings homework help, reading practice, and progress
              tracking into one secure, easy-to-use hub so guardians in Sierra
              Leone can champion every learner.
            </p>
            <ul className="space-y-4 text-lg text-slate-700">
              <li className="flex gap-3">
                <span
                  className="mt-2 h-2 w-2 rounded-full bg-blue-600"
                  aria-hidden
                />
                <span>Local curriculum alignment tailored for ages 8–14.</span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-2 h-2 w-2 rounded-full bg-blue-600"
                  aria-hidden
                />
                <span>
                  Instant recaps and weekly reports that highlight wins and
                  gaps.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-2 h-2 w-2 rounded-full bg-blue-600"
                  aria-hidden
                />
                <span>
                  Safe, moderated environment with full parental oversight.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <main className="bg-white text-slate-900">
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="md:flex md:items-end md:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500 ">
                  For families
                </p>
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                What families need to know
              </h2>
              {/* <p className="text-lg text-slate-600">
                We cover homework, reading, and skill-building with lessons that
                reflect Sierra Leonean culture and the WAEC curriculum.
              </p> */}
            </div>
            <Button
              asChild
              variant="ghost"
              className="mt-6 hidden gap-2 text-blue-700 hover:bg-blue-50 md:flex"
            >
              <Link href="/dashboard">
                Explore the dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-blue-100 bg-blue-50/60"
                >
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Students Section */}
        <section id="students" className="px-4 py-16 md:py-24">
          <div className="mx-auto max-w-6xl grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
                                        <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500 ">
                  For Students
              </p>
            </Badge>

              <h2 className="text-balance font-bold text-4xl text-slate-900 md:text-5xl">
                Moe makes studying fun, friendly, and culturally relevant
              </h2>
              <p className="text-lg leading-relaxed text-slate-700">
                Students chat with Moe for step-by-step solutions, practice
                reading aloud with immediate feedback, and earn badges that keep
                motivation high throughout the school year.
              </p>
              <ul className="space-y-4 text-lg text-slate-700">
                <li className="flex gap-3">
                  <span
                    className="mt-2 h-2 w-2 rounded-full bg-yellow-400"
                    aria-hidden
                  />
                  <span>
                    Friendly guidance that encourages critical thinking over
                    memorizing.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span
                    className="mt-2 h-2 w-2 rounded-full bg-yellow-400"
                    aria-hidden
                  />
                  <span>
                    Reading passages rooted in Sierra Leonean stories and
                    everyday life.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span
                    className="mt-2 h-2 w-2 rounded-full bg-yellow-400"
                    aria-hidden
                  />
                  <span>
                    Celebrate streaks and achievements with playful progress
                    badges.
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/assets/img2.png"
                    alt="Student smiling while using the Mi Ticha tutor on a tablet"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="steps" className="bg-slate-900 py-20 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-4">
              <Badge
                variant="secondary"
                className="bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                How it works
              </Badge>
              <h2 className="text-3xl font-bold md:text-4xl">
                Start in minutes, grow for years{" "}
              </h2>
              <p className="text-lg text-white/70">
                Parents create the plan, Moe handles everyday support, and
                everyone gets to celebrate progress.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step.title} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <Badge className="w-fit rounded-full bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-900">
                      Step {index + 1}
                    </Badge>
                    <CardTitle className="mt-4 text-xl font-semibold text-white">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-white/70">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-start gap-12 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Designed for trust
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Safe, culturally grounded, and transparent
              </h2>
              <p className="text-lg text-slate-600">
                Guardians stay in control. Every interaction is logged,
                protected, and easy to review whenever you like.
              </p>
              <div className="space-y-4">
                {safetyHighlights.map((highlight) => {
                  const Icon = highlight.icon;
                  return (
                    <div
                      key={highlight.title}
                      className="flex gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-900">
                          {highlight.title}
                        </h3>
                        <p className="mt-1 text-base text-emerald-800">
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-xl">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/assets/img3.png"
                  alt="Parent and student dashboards"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-blue-950 py-20 text-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to transform your child's learning?
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Start your free 14-day trial and see how Moe keeps students
              curious, confident, and on track.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-amber-400 px-7 text-base font-semibold text-slate-900 hover:bg-amber-300"
              >
                <Link href="/signup">Start free trial</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-white/5 px-7 text-base font-semibold text-white hover:bg-white/10"
              >
                <Link href="/login">Parent log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/60 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Moe. Empowering Sierra Leone
            students with AI education.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
