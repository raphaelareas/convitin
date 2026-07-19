'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Users, ArrowLeft, Loader2, Trash2, Gift, Share2, Check } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function GuestListPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyGuestLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/lista/${slug}/convidados`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: listData, error } = await supabase.from('lists').select('*').eq('slug', slug).eq('user_id', session.user.id).single();
      if (error || !listData) { router.push('/dashboard'); return; }
      setSelectedList(listData);
      await fetchGuests(listData.id);
    };
    init();
  }, [slug, router]);

  const fetchGuests = async (listId: string) => {
    const { data, error } = await supabase.from('guests').select('*').eq('list_id', listId).order('created_at', { ascending: false });
    if (!error && data) setGuests(data);
    setLoading(false);
  };

  const removeGuest = (id: string, name: string) => {
    setConfirmModal({
      title: 'Remover Convidado',
      message: `Deseja remover a confirmacao de presenca de "${name}"?`,
      onConfirm: async () => {
        const { error } = await supabase.from('guests').delete().eq('id', id);
        if (error) { alert('Erro ao remover convidado.'); } else { fetchGuests(selectedList.id); }
        setConfirmModal(null);
      },
    });
  };

  const totalGuests = guests.length;
  const totalCompanions = guests.reduce((sum, g) => sum + (g.companions ?? 0), 0);
  const totalPeople = totalGuests + totalCompanions;
  const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '--';

  if (loading || !selectedList) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', color: '#64748b' }}>
      <Loader2 size={40} className="animate-spin" color="var(--primary)" />
      <p>Carregando lista de convidados...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f1f5f9' }}>
      <header style={{ padding: '1rem 1.5rem', borderRadius: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }} className="glass-card">
        <div className="dashboard-header-container">
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Convitin</span>
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} />
              </Link>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Convidados Confirmados</h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: '500', margin: 0 }}>
              Acompanhe quem confirmou presença em <strong>{selectedList.title}</strong>.
            </p>

            {/* Botão de compartilhar link */}
            <button
              onClick={copyGuestLink}
              className="btn btn-secondary"
              style={{
                width: '100%',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                minHeight: '40px',
                padding: '0.5rem 1rem',
                border: copied ? '1px solid #10B981' : '1px solid var(--primary)',
                color: copied ? '#10B981' : 'var(--primary)',
                background: copied ? 'rgba(16,185,129,0.06)' : 'rgba(var(--primary-rgb), 0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? 'Link copiado!' : 'Compartilhar lista de presença'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {([['Confirmacoes', totalGuests, '✅'], ['Acompanhantes', totalCompanions, '👥'], ['Total de Pessoas', totalPeople, '🎉']] as const).map(([label, value, emoji]) => (
              <div key={label} className="glass-card" style={{ flex: '1 1 140px', padding: '0.75rem 1.25rem', background: '#ffffff', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', background: '#ffffff', borderRadius: '24px', width: '100%' }}>
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
              {guests.length === 0 ? (
                <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <Users size={48} style={{ marginBottom: '1rem', color: '#cbd5e1', display: 'inline-block' }} />
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Nenhum convidado confirmou presenca ainda.</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Compartilhe <strong>/lista/{selectedList.slug}/convidados</strong> para receber confirmacoes.
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ padding: '1rem', fontWeight: '700', color: '#475569' }}>Nome</th>
                      <th style={{ padding: '1rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Acompanhantes</th>
                      <th style={{ padding: '1rem', fontWeight: '700', color: '#475569' }}>Confirmado em</th>
                      <th style={{ padding: '1rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((guest: any) => (
                      <tr key={guest.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{guest.name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {guest.companions > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: '700' }}>
                              +{guest.companions}
                            </span>
                          ) : <span style={{ color: '#94a3b8' }}>--</span>}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{formatDate(guest.created_at)}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button onClick={() => removeGuest(guest.id, guest.name)} className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: '1px solid #fecaca', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Trash2 size={13} /> Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {confirmModal && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={{ padding: '2.5rem', width: '95%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', background: '#ffffff', borderRadius: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <Trash2 size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{confirmModal.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.5rem', lineHeight: 1.5 }}>{confirmModal.message}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button onClick={() => setConfirmModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="btn btn-primary" style={{ flex: 1, background: '#EF4444', borderColor: '#EF4444' }}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}