import Link from "next/link"
import { Twitter, Instagram, Facebook } from "lucide-react"

const navigation = [
  { name: "Home", href: "/" },
  { name: "About us", href: "/about" },
  { name: "Programs", href: "/programs" },
  { name: "Contact", href: "/contact" },
]

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
]

export function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-6">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            KidSpeak
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white/90 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-4">
            {socials.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-white/90 hover:text-white transition-colors"
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}