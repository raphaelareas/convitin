import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ListClient from './ListClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 1. Geração Dinâmica de Metadados (SEO / Open Graph) para compartilhamento em redes sociais
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Puxar lista direto do Supabase no servidor
  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!list) {
    return {
      title: 'Lista não encontrada - Convitin',
      description: 'Esta lista de presentes não existe ou foi removida.',
    };
  }

  const cleanDescription = list.description || `Veja a lista de presentes de ${list.title} e reserve o seu!`;
  const bannerImage = list.banner_url || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200&h=300';

  return {
    title: `${list.title} - Convitin`,
    description: cleanDescription,
    openGraph: {
      title: `${list.title} - Lista de Presentes`,
      description: cleanDescription,
      type: 'website',
      images: [
        {
          url: bannerImage,
          width: 1200,
          height: 630,
          alt: list.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${list.title} - Lista de Presentes`,
      description: cleanDescription,
      images: [bannerImage],
    },
  };
}

// 2. Componente de Servidor Principal da Rota
export default async function ListPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar lista no Supabase
  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!list) {
    notFound();
  }

  // Buscar presentes iniciais no Supabase
  const { data: gifts } = await supabase
    .from('gifts')
    .select('*')
    .eq('list_id', list.id)
    .order('created_at', { ascending: false });

  return (
    <ListClient list={list} initialGifts={gifts || []} />
  );
}
