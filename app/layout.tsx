import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas-pessoal-prototipo.abnercoimbra74.chatgpt.site'),
  title: 'Atlas — Sua jornada de aprendizagem',
  description: 'Uma experiência diária de estudo, prática e domínio construída ao redor do seu progresso.',
  openGraph: {
    title: 'Atlas — Sua jornada de aprendizagem',
    description: 'Estude. Comprove. Evolua.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Atlas — Estude. Comprove. Evolua.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas — Sua jornada de aprendizagem',
    description: 'Estude. Comprove. Evolua.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
