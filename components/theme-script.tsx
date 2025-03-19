"use client"

import { useTheme } from "@/components/theme-provider"
import { useEffect } from "react"

// This component is used to apply the theme class to the html element
// It needs to be client-side because it accesses localStorage and window.matchMedia
export function ThemeScript() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Use system preference by default
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      setTheme("system")
      
      // Apply the system theme class directly
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      if (theme === "system") {
        if (mediaQuery.matches) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, setTheme])

  return null
}