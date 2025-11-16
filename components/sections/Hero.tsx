import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-700">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Mi Ticha brings<br />
              AI-powered learning<br />
              to Sierra Leone kids
            </h1>
            <p className="text-lg text-white/90 max-w-lg">
              Moe, our friendly AI tutor, supports homework, reading practice, and skill-building while parents track every milestone in a safe, local-first platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                className="bg-amber-400 hover:bg-amber-500 text-black px-8 py-6 rounded-full text-lg font-semibold"
              >
                <Link href="/signup">Parent sign up</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 px-8 py-6 rounded-full text-lg font-semibold"
              >
                <Link href="/student-login">Student log in</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-coral-500 rounded-full blur-2xl opacity-20" />
            <div className="absolute bottom-10 -left-10 w-40 h-40 bg-amber-400 rounded-full blur-2xl opacity-20" />
            
            {/* Main image - replace src with your actual image path */}
            <div className="relative z-10 rounded-2xl overflow-hidden">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/assets/hero.jpg"
                  alt="Mi Ticha students learning with Moe"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            {/* Dot pattern */}
            <div className="absolute -right-4 top-1/4 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
