"use client"

import type React from "react"

import { useEffect } from "react"

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress ServiceWorker registration errors
    const originalError = console.error
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || ""

      // Suppress ServiceWorker errors
      if (
        errorMessage.includes("ServiceWorker") ||
        errorMessage.includes("service worker") ||
        errorMessage.includes("Failed to register")
      ) {
        return // Silently ignore ServiceWorker errors
      }

      originalError.apply(console, args)
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const descriptor = Object.getOwnPropertyDescriptor(navigator, "serviceWorker")
      if (descriptor && descriptor.configurable) {
        Object.defineProperty(navigator, "serviceWorker", {
          get() {
            return undefined
          },
        })
      }
    }

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason?.toString() || ""
      if (error.includes("ServiceWorker") || error.includes("service worker") || error.includes("Failed to register")) {
        event.preventDefault() // Prevent the error from showing
      }
    }

    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      console.error = originalError
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return <>{children}</>
}
