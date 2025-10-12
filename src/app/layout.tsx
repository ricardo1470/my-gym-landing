// src/app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "sonner" // <--- 💡 Importa el Toaster
import "./globals.css"

export const metadata: Metadata = {
  title: "FitTransform - Transforma tu cuerpo, transforma tu vida",
  description: "Servicios personalizados de entrenamiento, nutrición y suplementación. Comienza tu transformación hoy.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          {children}
        </Suspense>

        {/* 💡 Añade el Toaster para las notificaciones */}
        <Toaster richColors position="top-right" />

        <Analytics />
      </body>
    </html>
  )
}
