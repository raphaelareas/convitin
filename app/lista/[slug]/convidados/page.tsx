import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import GuestClient from './GuestClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function GuestRSVPPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: list, error } = await supabase
    .from('lists')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !list) notFound();

  return <GuestClient list={list} />;
}