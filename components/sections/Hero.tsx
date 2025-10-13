import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-700">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Language<br />
              mastery<br />
              made easy!
            </h1>
            <p className="text-lg text-white/90 max-w-lg">
              Our innovative language programs make learning fun and effective for children of all ages. Start their language journey today!
            </p>
            <Button 
              className="bg-amber-400 hover:bg-amber-500 text-black px-8 py-6 rounded-full text-lg font-semibold"
            >
              Enroll now!
            </Button>
          </div>
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-coral-500 rounded-full blur-2xl opacity-20" />
            <div className="absolute bottom-10 -left-10 w-40 h-40 bg-amber-400 rounded-full blur-2xl opacity-20" />
            
            {/* Main image - replace src with your actual image path */}
            <div className="relative z-10 rounded-2xl overflow-hidden">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/students-hero.png"
                  alt="Students learning together"
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