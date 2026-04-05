import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: 'AlgoPath — AI Pathfinding & Search Algorithm Visualizer',
  description:
    'Interactive visualization of 9 AI search algorithms including BFS, DFS, A*, Greedy, Hill Climbing, and Genetic Algorithm. Step through each algorithm on a 2D grid, compare performance metrics, and explore informed vs uninformed search strategies.',
  keywords: [
    'algorithms',
    'pathfinding',
    'visualization',
    'BFS',
    'DFS',
    'A-star',
    'AI',
    'search algorithms',
    'education',
    'artificial intelligence',
  ],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  )
}
