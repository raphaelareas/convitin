'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Trash2, ArrowLeft, Loader2
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ReservedGiftsPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [gifts, setGifts] = useState<any[]>([]);

  // Auxiliares
  const [confirmModalConfig, setConfirmModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void, isDanger = true) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModalConfig(null);
      },
      isDanger
    });
  };

  useEffect(() => {
    const checkUserAndFetchList = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      // Buscar se a lista com o slug pertence a este usuário logado
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', session.user.id)
        .single();

      if (listError || !listData) {
        router.push('/dashboard');
        return;
      }

      setSelectedList(listData);
      await fetchGifts(listData.id);
    };

    checkUserAndFetchList();
  }, [slug, router]);

  const fetchGifts = async (listId: string) => {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('list_id', listId)
      .eq('status', 'reservado')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGifts(data);
    }
    setLoading(false);
  };

  const releaseReservation = (id: string) => {
    showConfirm(
      'Liberar Reserva 🔓',
      'Deseja liberar a reserva deste presente para que outros convidados possam escolher?',
      async () => {
        const { error } = await supabase
          .from('gifts')
          .update({
            status: 'disponivel',
            reserved_by: null,
            reserved_at: null
          })
          .eq('id', id);

        if (error) {
          alert('Erro ao liberar presente.');
        } else {
          fetchGifts(selectedList.id);
        }
      },
      false
    );
  };

  if (loading || !selectedList) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p>Carregando produtos reservados...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header} className="glass-card">
        <div className="dashboard-header-container">
          <Link href="/dashboard" style={{ ...styles.logo, cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <div style={styles.logoIcon}>
              <Gift size={18} color="#ffffff" />
            </div>
            <span style={styles.logoName}>Convitin</span>
          </Link>
        </div>
      </header>

      <main style={styles.main}>
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          
          {/* Título e Botão Voltar alinhados na primeira linha, Descrição na segunda linha (fora do card) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} />
              </Link>
              <h2 style={{ ...styles.viewTitle, margin: 0 }}>Reservados</h2>
            </div>
            <p style={{ ...styles.viewSubtitle, margin: 0 }}>Acompanhe quem reservou cada item para controle do evento.</p>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', background: '#ffffff', borderRadius: '24px', width: '100%' }}>

          <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            {gifts.length === 0 ? (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                <Gift size={48} style={{ marginBottom: '1rem', color: '#cbd5e1', display: 'inline-block' }} />
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Nenhum presente reservado nesta lista ainda.</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Assim que os convidados começarem a escolher, as informações aparecerão aqui.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '1rem', fontWeight: '700', color: '#475569' }}>Presente</th>
                    <th style={{ padding: '1rem', fontWeight: '700', color: '#475569' }}>Quem Reservou</th>
                    <th style={{ padding: '1rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.map((gift: any) => (
                    <tr key={gift.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{gift.name}</td>
                      <td style={{ padding: '1rem', color: '#10B981', fontWeight: '700' }}>
                        {gift.reserved_by || 'Convidado Anônimo'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button onClick={() => releaseReservation(gift.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: '1px solid #cbd5e1' }}>
                          Liberar para Lista
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

      {/* CONFIRMAÇÃO */}
      {confirmModalConfig && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={{ padding: '2.5rem', width: '95%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', background: '#ffffff', borderRadius: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: confirmModalConfig.isDanger ? '#FEE2E2' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)' }}>
              <ArrowLeft size={28} style={{ transform: 'rotate(-90deg)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{confirmModalConfig.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.5rem', lineHeight: 1.5 }}>{confirmModalConfig.message}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button onClick={() => setConfirmModalConfig(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={confirmModalConfig.onConfirm} className="btn btn-primary" style={{ flex: 1, background: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)', borderColor: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f1f5f9',
  },
  header: {
    padding: '1rem 1.5rem',
    borderRadius: 0,
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoName: {
    fontSize: '1.15rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: 'var(--text-main)',
    fontFamily: "'Inter', sans-serif",
  },
  main: {
    flex: 1,
    padding: '1.5rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  viewTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  viewSubtitle: {
    fontSize: '0.875rem',
    color: '#64748B',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '500',
  }
};
