import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'UNIQUE | Pilotage des livraisons', description: 'Tableau de pilotage UNIQUE Livraison Expresse', icons: { icon: '/brand/favicon.png' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
