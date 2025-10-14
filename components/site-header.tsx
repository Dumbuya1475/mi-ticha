import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Mi Ticha</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="font-medium text-gray-700 hover:text-primary">
            Home
          </Link>
          <Link href="#families" className="font-medium text-gray-700 hover:text-primary">
            Families
          </Link>
          <Link href="#students" className="font-medium text-gray-700 hover:text-primary">
            Students
          </Link>
          <Link href="#how-it-works" className="font-medium text-gray-700 hover:text-primary">
            How it works
          </Link>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Link href="/student-login" className="text-gray-600 hover:text-primary">
            Student log in
          </Link>
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/signup">Parent sign up</Link>
          </Button>
          <div className="flex items-center space-x-3 text-gray-400">
            <Link href="#" aria-label="Mi Ticha on Twitter" className="hover:text-primary">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="Mi Ticha on Instagram" className="hover:text-primary">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="Mi Ticha on Facebook" className="hover:text-primary">
              <Facebook className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}