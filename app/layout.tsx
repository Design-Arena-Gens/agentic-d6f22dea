import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Target Locker',
  description: 'Lock your targets for tomorrow and get completion notifications',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
