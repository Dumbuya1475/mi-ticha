import Link from "next/link"
import { X, Facebook, Instagram, Twitter } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">KidSpeak</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="font-medium text-gray-700 hover:text-primary">
            Home
          </Link>
          <Link href="#about" className="font-medium text-gray-700 hover:text-primary">
            About us
          </Link>
          <Link href="#programs" className="font-medium text-gray-700 hover:text-primary">
            Programs
          </Link>
          <Link href="#contact" className="font-medium text-gray-700 hover:text-primary">
            Contact
          </Link>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Link href="#" className="text-gray-600 hover:text-primary">
            <Twitter className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-gray-600 hover:text-primary">
            <Instagram className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-gray-600 hover:text-primary">
            <Facebook className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}