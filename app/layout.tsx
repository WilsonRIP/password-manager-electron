'use client'
// import { NhostProvider } from '@nhost/nextjs'
// import { nhost } from '@/lib/nhostClient'
import { ThemeProvider, useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { Sidebar } from '@/components/ui/sidebar'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import type { Appearance } from '@clerk/types' // Import Appearance type

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Helper function to get computed style property in a Clerk-compatible format (HSL or RGB)
const getComputedClerkColorValue = (
  variableName: string
): string | undefined => {
  if (typeof window === 'undefined') return undefined // Avoid running on server

  const computedValue = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()

  if (!computedValue) return undefined

  try {
    // Use a canvas context to parse the color and get a standard format
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return undefined // Canvas context might not be available

    ctx.fillStyle = computedValue // Assign the potentially complex color (e.g., oklch)
    const parsedColor = ctx.fillStyle // Read it back - browser usually returns hex, rgb, or rgba

    // Clerk prefers HSL if possible, but RGB/Hex is fine too.
    // We'll stick with whatever the canvas gives back (likely RGB or Hex).
    // If Clerk strictly needed HSL, more complex conversion would be needed.
    return parsedColor // Return the parsed color (e.g., #ffffff, rgb(0, 0, 0))
  } catch (error) {
    console.error(
      `Failed to parse computed color for ${variableName}:`,
      computedValue,
      error
    )
    return undefined // Return undefined if parsing fails
  }
}

// Component to handle dynamic theme and computed styles for ClerkProvider
function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [clerkAppearance, setClerkAppearance] = useState<Appearance>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Read computed styles using the new helper
      const primaryColor = getComputedClerkColorValue('--primary')
      const backgroundColor = getComputedClerkColorValue('--background')
      const inputColor = getComputedClerkColorValue('--input')
      const foregroundColor = getComputedClerkColorValue('--foreground')
      const cardColor = getComputedClerkColorValue('--card')
      const accentColor = getComputedClerkColorValue('--accent')
      const destructiveColor = getComputedClerkColorValue('--destructive')
      const destructiveForegroundColor = getComputedClerkColorValue(
        '--destructive-foreground'
      )

      setClerkAppearance({
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        variables: {
          // Pass the directly parsed color values (e.g., rgb, hex)
          colorPrimary: primaryColor,
          colorBackground: backgroundColor,
          colorInputBackground: inputColor,
          colorInputText: foregroundColor,
        },
        elements: {
          button: {
            '&[data-variant="ghost"]': {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              color: foregroundColor,
              '&:hover': {
                backgroundColor: accentColor,
              },
            },
          },
          userButtonPopoverCard: {
            backgroundColor: cardColor,
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          userButtonPopoverActionButton: {
            color: foregroundColor,
            '&:hover': {
              backgroundColor: accentColor,
            },
          },
          userButtonPopoverActionButton__danger: {
            color: destructiveForegroundColor,
            '&:hover': {
              backgroundColor: destructiveColor,
            },
          },
        },
      })
    }
  }, [resolvedTheme])

  // Pass appearance only if it has keys, otherwise Clerk might default incorrectly
  return (
    <ClerkProvider
      appearance={
        Object.keys(clerkAppearance).length > 0 ? clerkAppearance : undefined
      }
    >
      {children}
    </ClerkProvider>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" enableSystem>
          <ClerkThemeProvider>
            <Header />
            <div className="flex h-[calc(100vh-4rem)]">
              {' '}
              {/* full screen minus header height */}
              <Sidebar />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
            <Toaster />
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

function Header() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <header className="border-border bg-background flex items-center justify-between border-b p-4">
      <span className="text-xl font-bold">Keyed</span>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {isMounted ? (
            theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <div className="h-5 w-5" />
          )}
        </Button>
        <SignedOut>
          <SignInButton fallbackRedirectUrl="/" mode="modal">
            <Button variant="ghost" data-variant="ghost">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton fallbackRedirectUrl="/" mode="modal">
            <Button variant="ghost" data-variant="ghost">
              Sign Up
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  )
}
