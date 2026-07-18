'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Plus, Trash2, ExternalLink, Globe, ArrowLeft, Loader2, Check, Share
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ManageGiftsPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [gifts, setGifts] = useState<any[]>([]);

  // Auxiliares
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGifts(data);
    }
    setLoading(false);
  };

  const deleteGift = (id: string) => {
    showConfirm(
      'Excluir Presente 🗑️',
      'Tem certeza que deseja remover este presente da sua lista? Esta ação não pode ser desfeita.',
      async () => {
        const { error } = await supabase
          .from('gifts')
          .delete()
          .eq('id', id);

        if (error) {
          alert('Erro ao excluir presente.');
        } else {
          fetchGifts(selectedList.id);
        }
      }
    );
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

  const copyShareLink = (slug: string, id: string) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${domain}/lista/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading || !selectedList) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p>Carregando presentes...</p>
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
          
          {/* Menu Superior com Apenas o Botão de Voltar (Seta) */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
          </div>

          <div className="gifts-header-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ ...styles.viewTitle, margin: 0 }}>Meus Presentes — {selectedList.title}</h2>
                <p style={{ ...styles.viewSubtitle, marginTop: '2px', margin: 0 }}>Adicione, edite ou remova presentes da sua lista</p>
              </div>
              
              <div className="gifts-actions-desktop-header">
                <button onClick={() => window.open(`/lista/${selectedList.slug}`, '_blank')} className="btn btn-secondary">
                  <span>Visualizar Lista</span>
                  <ExternalLink size={18} />
                </button>
                <button onClick={() => router.push(`/dashboard/${slug}/meus-presentes/novo-presente`)} className="btn btn-primary">
                  <Plus size={18} />
                  Novo Presente
                </button>
              </div>
            </div>

            <div className="gifts-share-row">
              <div className="gifts-share-input-wrapper">
                <div style={styles.inputWrapper}>
                  <Globe size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ 
                      ...styles.inputWithIcon, 
                      background: '#f1f5f9', 
                      cursor: 'not-allowed', 
                      color: '#64748b', 
                      width: '100%', 
                      boxSizing: 'border-box'
                    }}
                    value={`convitin.com.br/lista/${selectedList.slug}`}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <button 
                onClick={() => copyShareLink(selectedList.slug, selectedList.id)} 
                className="btn btn-secondary gifts-share-btn"
                style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {copiedId === selectedList.id ? (
                  <><Check size={18} color="var(--success)" /> Copiado!</>
                ) : (
                  <><Share size={18} /> Compartilhar</>
                )}
              </button>
            </div>
          </div>

          <div className="gifts-list-container">
            {gifts.length === 0 ? (
              <div className="glass-card" style={styles.emptyState}>
                <div style={styles.emptyIconCircle}>
                  <Gift size={40} color="var(--primary)" />
                </div>
                <h3>Sua lista de presentes está vazia</h3>
                <p>Comece a cadastrar os presentes que você gostaria de ganhar neste evento.</p>
                <button onClick={() => router.push(`/dashboard/${slug}/meus-presentes/novo-presente`)} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                  Cadastrar Primeiro Presente
                </button>
              </div>
            ) : (
              <div style={styles.giftsGrid}>
                {gifts.map((gift) => (
                  <div key={gift.id} className="glass-card" style={{
                    ...styles.giftCard,
                    padding: '0px',
                    opacity: gift.status === 'reservado' ? 0.85 : 1,
                    border: gift.status === 'reservado' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--card-border)'
                  }}>
                    <div style={styles.giftCardImageContainer}>
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        {gift.is_search_link ? (
                          <><span>Busca Geral</span><span>🔍</span></>
                        ) : (
                          <><span>Modelo Exato</span><span>✅</span></>
                        )}
                      </div>

                      {gift.image_url ? (
                        <img src={gift.image_url} alt={gift.name} style={styles.giftCardImage} />
                      ) : (
                        <div style={styles.giftCardPlaceholder}>
                          {gift.is_search_link ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem', gap: '0.4rem' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Gift size={18} color="var(--primary)" />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Busca Facilitada 🔍</span>
                            </div>
                          ) : (
                            <><Gift size={32} color="var(--text-muted)" /><span style={{ fontSize: '0.75rem' }}>Sem Imagem</span></>
                          )}
                        </div>
                      )}

                      {gift.status === 'reservado' && (
                        <div style={styles.reservedOverlay}>
                          <span style={styles.reservedBadge}>Reservado por {gift.reserved_by}</span>
                        </div>
                      )}
                    </div>

                    <div style={styles.giftCardBody}>
                      <h4 style={styles.giftCardTitle}>{gift.name}</h4>
                      <p style={gift.price ? styles.giftCardPrice : styles.giftCardPriceMuted}>
                        {gift.price ? `R$ ${gift.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Preço estimado não informado'}
                      </p>

                      <div style={styles.giftCardActions}>
                        {gift.status === 'reservado' ? (
                          <button onClick={() => releaseReservation(gift.id)} className="btn btn-secondary" style={{ flex: 1, color: 'var(--success)', border: '1px solid var(--success)', fontSize: '0.8rem' }}>
                            Liberar Reserva
                          </button>
                        ) : (
                          <button onClick={() => router.push(`/dashboard/${slug}/meus-presentes/editar-presente/${gift.id}`)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
                            Editar
                          </button>
                        )}
                        <button onClick={() => deleteGift(gift.id)} className="btn btn-secondary" style={{ color: 'var(--accent)', padding: '0.6rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* MOBILE FOOTER FIXED ACTIONS */}
      {selectedList && (
        <div className="gifts-actions-mobile-footer animate-fade-in">
          <button onClick={() => window.open(`/lista/${selectedList.slug}`, '_blank')} className="btn btn-secondary">
            <span>Visualizar Lista</span>
            <ExternalLink size={18} />
          </button>
          <button onClick={() => router.push(`/dashboard/${slug}/meus-presentes/novo-presente`)} className="btn btn-primary">
            <Plus size={18} />
            Novo Presente
          </button>
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
  },
  emptyState: {
    padding: '5rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  emptyIconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(79, 70, 229, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  giftsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  giftCard: {
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    transition: 'var(--transition-smooth)',
  },
  giftCardImageContainer: {
    position: 'relative',
    height: '180px',
    width: '100%',
    background: '#f8fafc',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '0.5rem',
  },
  giftCardPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    color: 'var(--text-muted)',
    width: '100%',
    height: '100%',
  },
  giftCardBody: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  giftCardTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    lineHeight: 1.3,
  },
  giftCardPrice: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: 'var(--primary)',
    margin: 0,
  },
  giftCardPriceMuted: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    margin: 0,
    fontWeight: '600',
  },
  giftCardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '0.5rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#a1a1aa',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    width: '100%',
    paddingLeft: '38px',
  },
  reservedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  reservedBadge: {
    background: 'var(--success)',
    color: '#ffffff',
    padding: '0.35rem 0.75rem',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
  }
};
