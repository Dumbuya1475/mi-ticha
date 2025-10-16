import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-white text-slate-900">
			<SiteHeader />
			<main>
				{/* Hero Section */}
				<section className="relative overflow-hidden px-4 py-16 md:py-24">
					<div className="mx-auto max-w-7xl">
						<div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
							<div className="space-y-6">
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
									AI tutor for Sierra Leone
								</p>
								<h1 className="text-balance font-bold text-5xl leading-tight text-blue-700 md:text-6xl">
									Mi Ticha builds confident readers and problem solvers
								</h1>
								<p className="text-pretty text-lg leading-relaxed text-gray-700 md:text-xl">
									Moe, our friendly AI tutor, delivers homework help, guided reading practice, and crystal-clear
									progress insights so families can celebrate every milestone together.
								</p>
								<div className="flex flex-col gap-4 sm:flex-row">
									<Button
										asChild
										size="lg"
										className="h-14 rounded-full bg-yellow-400 px-8 font-semibold text-lg text-slate-900 hover:bg-yellow-500"
									>
										<Link href="/signup" prefetch>
											Parent sign up
										</Link>
									</Button>
									<Button
										asChild
										variant="outline"
										size="lg"
										className="h-14 rounded-full border-2 border-blue-200 bg-white px-8 font-semibold text-lg text-blue-700 hover:bg-blue-50"
									>
										<Link href="/student-login" prefetch>
											Student log in
										</Link>
									</Button>
								</div>
								<p className="text-sm text-gray-500">No credit card required for the first 14 days.</p>
							</div>
							<div className="relative">
								<div
									className="absolute -left-16 top-8 hidden h-72 w-72 rounded-full bg-blue-100 blur-3xl md:block"
									aria-hidden
								/>
								<div
									className="absolute -right-20 bottom-12 hidden h-64 w-64 rounded-full bg-yellow-100 blur-3xl md:block"
									aria-hidden
								/>
								<div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl">
									<div className="relative aspect-[4/3]">
										<Image
											src="/assets/ami.png"
											// src="/assets/img6.png"
											alt="A student learning with the Mi Ticha tutor"
											fill
											className="object-cover"
											priority
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="absolute bottom-0 left-0 w-full">
						<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M0,96L48,85.3C96,75,192,53,288,53.3C384,53,480,75,576,90.7C672,107,768,117,864,112C960,107,1056,85,1152,74.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
								fill="#F3F4F6"
							/>
						</svg>
					</div>
				</section>

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
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">For families</p>
							<h2 className="text-balance font-bold text-4xl text-slate-900 md:text-5xl">
								Everything parents need to support learning at home
							</h2>
							<p className="text-lg leading-relaxed text-slate-700">
								Mi Ticha brings homework help, reading practice, and progress tracking into one secure, easy-to-use hub
								so guardians in Sierra Leone can champion every learner.
							</p>
							<ul className="space-y-4 text-lg text-slate-700">
								<li className="flex gap-3">
									<span className="mt-2 h-2 w-2 rounded-full bg-blue-600" aria-hidden />
									<span>Local curriculum alignment tailored for ages 8–14.</span>
								</li>
								<li className="flex gap-3">
									<span className="mt-2 h-2 w-2 rounded-full bg-blue-600" aria-hidden />
									<span>Instant recaps and weekly reports that highlight wins and gaps.</span>
								</li>
								<li className="flex gap-3">
									<span className="mt-2 h-2 w-2 rounded-full bg-blue-600" aria-hidden />
									<span>Safe, moderated environment with full parental oversight.</span>
								</li>
							</ul>
						</div>
					</div>
				</section>

						{/* Students Section */}
						<section id="students" className="px-4 py-16 md:py-24">
							<div className="mx-auto max-w-6xl grid items-center gap-12 md:grid-cols-2">
								<div className="space-y-6">
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">For students</p>
									<h2 className="text-balance font-bold text-4xl text-slate-900 md:text-5xl">
										Moe makes studying fun, friendly, and culturally relevant
									</h2>
									<p className="text-lg leading-relaxed text-slate-700">
										Students chat with Moe for step-by-step solutions, practice reading aloud with immediate feedback, and
										earn badges that keep motivation high throughout the school year.
									</p>
									<ul className="space-y-4 text-lg text-slate-700">
										<li className="flex gap-3">
											<span className="mt-2 h-2 w-2 rounded-full bg-yellow-400" aria-hidden />
											<span>Friendly guidance that encourages critical thinking over memorizing.</span>
										</li>
										<li className="flex gap-3">
											<span className="mt-2 h-2 w-2 rounded-full bg-yellow-400" aria-hidden />
											<span>Reading passages rooted in Sierra Leonean stories and everyday life.</span>
										</li>
										<li className="flex gap-3">
											<span className="mt-2 h-2 w-2 rounded-full bg-yellow-400" aria-hidden />
											<span>Celebrate streaks and achievements with playful progress badges.</span>
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

				{/* How It Works Section */}
						<section id="how-it-works" className="bg-slate-900 px-4 py-16 text-white md:py-24">
							<div className="mx-auto max-w-6xl grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">How it works</p>
									<h2 className="mt-4 text-balance font-bold text-4xl md:text-5xl">Start in minutes, grow for years</h2>
									<p className="mt-6 text-lg leading-relaxed text-slate-200">
										Onboard in three simple steps and keep boosting confidence with guided study sessions, reading practice,
										and real-time updates for the whole family.
									</p>
									<ol className="mt-10 space-y-6">
										<li className="rounded-2xl border border-white/10 bg-white/5 p-6">
											<span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-slate-900">
												1
											</span>
											<h3 className="text-xl font-semibold">Create a parent account</h3>
											<p className="mt-2 text-slate-200">
												Add your learner in minutes and tailor goals that match their grade level and schedule.
											</p>
										</li>
										<li className="rounded-2xl border border-white/10 bg-white/5 p-6">
											<span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-slate-900">
												2
											</span>
											<h3 className="text-xl font-semibold">Let Moe guide every session</h3>
											<p className="mt-2 text-slate-200">
												Students get bite-sized explanations, reading prompts, and supportive nudges that keep them engaged.
											</p>
										</li>
										<li className="rounded-2xl border border-white/10 bg-white/5 p-6">
											<span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-slate-900">
												3
											</span>
											<h3 className="text-xl font-semibold">Track progress together</h3>
											<p className="mt-2 text-slate-200">
												Weekly summaries show growth, while actionable tips help you support your child between sessions.
											</p>
										</li>
									</ol>
								</div>
								<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
									<div className="relative aspect-[3/4] p-6 md:aspect-[4/5]">
										<Image
											src="/assets/img3.png"
											alt="Screens showcasing the Mi Ticha parent dashboard and student experience"
											fill
											className="object-contain"
										/>
									</div>
								</div>
							</div>
						</section>

				{/* CTA Section */}
				<section className="px-4 py-16 md:py-24">
					<div className="mx-auto max-w-4xl text-center">
						<h2 className="mb-4 text-balance font-bold text-4xl md:text-5xl">
							Ready to transform your child's learning?
						</h2>
						<p className="mb-10 text-pretty text-lg leading-relaxed text-slate-600 md:text-xl">
							Join Mi Ticha today and unlock AI-powered support that keeps students curious and parents connected.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								asChild
								size="lg"
								className="h-14 rounded-full bg-yellow-400 px-8 font-semibold text-lg text-slate-900 hover:bg-yellow-500"
							>
								<Link href="/signup">Parent sign up</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="lg"
								className="h-14 rounded-full border-2 border-blue-200 bg-white px-8 font-semibold text-lg text-blue-700 hover:bg-blue-50"
							>
								<Link href="/student-login">Student log in</Link>
							</Button>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t bg-muted px-4 py-8">
				<div className="mx-auto max-w-6xl text-center text-muted-foreground text-sm">
					<p>&copy; 2025 Mi Ticha. Empowering Sierra Leone students with AI education.</p>
				</div>
			</footer>
		</div>
	)
}
