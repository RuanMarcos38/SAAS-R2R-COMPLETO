import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'R2R | Centro de Comando', description: 'Sistema de gestão integrada da R2R Marketing Digital' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
