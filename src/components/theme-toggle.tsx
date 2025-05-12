"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { AnimatedIconSwitch } from "@/framer-presets/animate-icon-switch"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent rendering icons until mounted to avoid hydration mismatch
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted ? (
        <AnimatedIconSwitch
          show={theme === "dark"}
          iconA={<Moon className="h-[1.2rem] w-[1.2rem] transition-all" />}
          iconB={<Sun className="h-[1.2rem] w-[1.2rem] transition-all" />}
          duration={0.25}
        />
      ) : (
        // Optionally render a placeholder to avoid layout shift
        <span className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
