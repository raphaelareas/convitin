import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Convitin - Agregador de Links para Wishlist',
  description: 'Crie sua lista de presentes personalizada para Casamentos, Chás de Bebê, Aniversários e mais, unificando links da Amazon, Shopee e Mercado Livre.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
