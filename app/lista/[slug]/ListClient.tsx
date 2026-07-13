'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Gift, ExternalLink, Heart, CheckCircle2, User, Loader2, Sparkles, Copy, Check, LayoutGrid, Square, List, ArrowRight, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';

// Logos de marketplace — limpos, sem fundo retangular, 36x36
const MercadoLivreIcon = () => (
  <svg viewBox="0 0 200 130" width="48" height="32" style={{ flexShrink: 0 }}>
    {/* Elipse externa amarela — esta É a logo do ML */}
    <ellipse cx="100" cy="65" rx="98" ry="63" fill="#FFE600" stroke="#2D3277" strokeWidth="5"/>
    {/* Faixa branca central */}
    <ellipse cx="100" cy="65" rx="72" ry="38" fill="white" stroke="#2D3277" strokeWidth="4"/>
    {/* Mão esquerda */}
    <path d="M58 60 C62 52, 72 50, 80 56 L90 65 C84 70, 76 72, 68 68 Z" fill="white" stroke="#2D3277" strokeWidth="2"/>
    {/* Mão direita */}
    <path d="M142 60 C138 52, 128 50, 120 56 L110 65 C116 70, 124 72, 132 68 Z" fill="white" stroke="#2D3277" strokeWidth="2"/>
    {/* Aperto */}
    <ellipse cx="100" cy="65" rx="14" ry="10" fill="#FFE600" stroke="#2D3277" strokeWidth="2"/>
  </svg>
);

const ShopeeIcon = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" style={{ flexShrink: 0 }}>
    <rect width="48" height="48" rx="10" fill="#EE4D2D"/>
    {/* Alça da sacola */}
    <path d="M18 18 C18 13, 21 10, 24 10 C27 10, 30 13, 30 18" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    {/* Corpo da sacola */}
    <rect x="12" y="18" width="24" height="20" rx="3" fill="white"/>
    {/* S */}
    <text x="24" y="32" textAnchor="middle" fill="#EE4D2D" fontSize="12" fontWeight="bold" fontFamily="Arial">S</text>
  </svg>
);

const AmazonIcon = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" style={{ flexShrink: 0 }}>
    {/* 'a' minúsculo */}
    <text x="24" y="29" textAnchor="middle" fill="#232F3E" fontSize="26" fontWeight="bold" fontFamily="Georgia, serif">a</text>
    {/* Seta sorriso laranja */}
    <path d="M10 36 Q24 44 38 36" stroke="#FF9900" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M35 33 L38 36 L35 39" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ListClientProps {
  list: any;
  initialGifts: any[];
}

export default function ListClient({ list, initialGifts }: ListClientProps) {
  const [gifts, setGifts] = useState<any[]>(initialGifts);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  
  // Reserva
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);

  // Estados para seleção de loja e redirecionamento
  const [selectedStore, setSelectedStore] = useState<'ml' | 'shopee' | 'amazon' | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectStoreName, setRedirectStoreName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showValidationTip, setShowValidationTip] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'large' | 'horizontal'>('grid');
  const [filterMode, setFilterMode] = useState<'all' | 'available'>('all');
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check current session to display either 'Crie sua lista' or 'Logout / Dashboard'
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Escutar atualizações do banco em tempo real via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`gifts-list-${list.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gifts',
          filter: `list_id=eq.${list.id}`
        },
        (payload) => {
          // Recarregar os presentes para garantir consistência
          refreshGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [list.id]);

  // Efeito do countdown para redirecionar ao marketplace
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showRedirectModal && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (showRedirectModal && redirectCountdown === 0) {
      if (redirectUrl) {
        window.open(redirectUrl, '_blank');
      }
    }
    return () => clearTimeout(timer);
  }, [showRedirectModal, redirectCountdown, redirectUrl]);

  const refreshGifts = async () => {
    const { data } = await supabase
      .from('gifts')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setGifts(data);
    }
  };

  const handleOpenReserve = (gift: any) => {
    setSelectedGift(gift);
    setFirstName('');
    setLastName('');
    
    // Auto-seleção se houver apenas uma loja disponível
    const stores = [];
    if (gift.link_ml) stores.push('ml');
    if (gift.link_shopee) stores.push('shopee');
    if (gift.link_amazon) stores.push('amazon');
    
    if (stores.length === 1) {
      setSelectedStore(stores[0] as any);
    } else {
      setSelectedStore(null);
    }
    
    setShowModal(true);
  };

  const handleConfirmReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setReserveLoading(true);
    try {
      // Validar se o presente ainda está disponível
      const { data: currentGift } = await supabase
        .from('gifts')
        .select('status')
        .eq('id', selectedGift.id)
        .single();

      if (currentGift?.status === 'reservado') {
        throw new Error('Ops! Alguém acabou de reservar este presente primeiro.');
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const { error } = await supabase
        .from('gifts')
        .update({
          status: 'reservado',
          reserved_by: fullName,
          reserved_at: new Date().toISOString()
        })
        .eq('id', selectedGift.id);

      if (error) throw error;

      // Definir URL e nome do marketplace para redirecionamento
      let storeUrl = '';
      let storeName = '';
      if (selectedStore === 'ml') {
        storeUrl = selectedGift.link_ml;
        storeName = 'Mercado Livre';
      } else if (selectedStore === 'shopee') {
        storeUrl = selectedGift.link_shopee;
        storeName = 'Shopee';
      } else if (selectedStore === 'amazon') {
        storeUrl = selectedGift.link_amazon;
        storeName = 'Amazon';
      }

      // Sucesso!
      setShowModal(false);
      setRedirectUrl(storeUrl);
      setRedirectStoreName(storeName);
      setRedirectCountdown(3);
      setCopied(false);
      setShowRedirectModal(true);
      
      // Animação de confetes premium
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#a7f3d0']
      });

      // Atualizar lista localmente
      refreshGifts();
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar reserva.');
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <div className={`theme-${list.theme_color}`} style={styles.pageWrapper}>

      {/* Navbar Fixo */}
      <header style={styles.navbar}>
        <div style={styles.navInner}>
          {/* Logo */}
          <Link 
            href={user ? '/dashboard' : '/'} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', cursor: 'pointer' }}
          >
            <div style={styles.navLogoIcon}>
              <Gift size={18} color="#ffffff" />
            </div>
            <span style={styles.navLogoName}>Convitin</span>
          </Link>
          {/* CTA */}
          {user ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#ffffff',
                color: 'var(--text-main)',
                transition: 'var(--transition-smooth)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                outline: 'none',
              }}
            >
              <LogOut size={15} />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              Crie sua lista grátis
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </header>

      {/* Banner de Capa Estilo Facebook (Plano de ponta a ponta) */}
      <div className="public-list-banner-wrapper" style={{
        width: '100%',
        background: 'transparent',
      }}>
        <div 
          className="public-list-banner-el"
          style={{ 
            ...styles.banner, 
            backgroundImage: list.banner_url ? `url(${list.banner_url})` : 'none',
            position: 'relative'
          }}
        />
      </div>

      {/* Caixa de Informações do Evento (Posicionada logo abaixo da Capa) */}
      <div className="container public-list-info-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem', marginTop: '-120px', position: 'relative', zIndex: 10 }}>
        <div className="glass-card animate-fade-in" style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid var(--card-border)',
          padding: '1.5rem 1.5rem 1.25rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.5rem',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(var(--primary-rgb), 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.08)',
            marginBottom: '0.15rem',
          }}>
            <Heart size={22} fill="var(--primary)" />
          </div>
          
          <h1 className="public-list-title" style={{ fontWeight: '800', color: 'var(--text-main)', margin: 0, lineHeight: 1.1, fontFamily: "'Playfair Display', serif" }}>
            {list.title}
          </h1>

          {list.description && (
            <p style={{ fontSize: '0.9rem', color: '#555555', margin: 0, fontWeight: '400', maxWidth: '600px', lineHeight: 1.4 }}>
              {list.description}
            </p>
          )}

          <div style={{ width: '48px', height: '2px', background: 'rgba(var(--primary-rgb), 0.15)', margin: '0.25rem 0' }} />

          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Mini-card: Presentes */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#f9f9f9',
              borderRadius: '10px',
              padding: '8px 16px',
              gap: '2px',
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🎁</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: '800', lineHeight: 1 }}>{gifts.length}</strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Presentes</span>
            </div>
            {/* Mini-card: Reservados */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#f9f9f9',
              borderRadius: '10px',
              padding: '8px 16px',
              gap: '2px',
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✅</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--success)', fontWeight: '800', lineHeight: 1 }}>
                {gifts.filter(g => g.status === 'reservado').length}
              </strong>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Reservados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Presentes */}
      <div className="container" style={styles.container}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>Escolha um Presente</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem', fontFamily: "'Open Sans', sans-serif" }}>Navegue pela lista, compre nas lojas parceiras e marque aqui para reservar.</p>
            
            {/* Controles de Visualização e Filtro (Linha única) */}
            {gifts.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'stretch',
                alignItems: 'center',
                width: '100%',
                margin: '0 auto 8px',
                gap: '8px',
                position: 'relative',
                padding: '0',
                boxSizing: 'border-box'
              }}>
              
              {/* 1. Filtros de Status (Card Único - flex: 1) */}
              <div style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '40px',
                boxSizing: 'border-box'
              }}>
                <button
                  onClick={() => setFilterMode('all')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    borderRadius: '7px',
                    border: 'none',
                    background: filterMode === 'all' ? 'var(--primary)' : 'transparent',
                    color: filterMode === 'all' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    height: '100%',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                >
                  Todos ({gifts.length})
                </button>
                <button
                  onClick={() => setFilterMode('available')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    borderRadius: '7px',
                    border: 'none',
                    background: filterMode === 'available' ? 'var(--primary)' : 'transparent',
                    color: filterMode === 'available' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    height: '100%',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                >
                  Disponíveis ({gifts.filter(g => g.status !== 'reservado').length})
                </button>
              </div>

              {/* 2. Seletor de Modo de Grid com Dropdown (Direita) */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowGridDropdown(!showGridDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    height: '40px',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    outline: 'none'
                  }}
                >
                  {viewMode === 'grid' && <><LayoutGrid size={16} /> <span>Grid</span></>}
                  {viewMode === 'large' && <><Square size={16} /> <span>Grande</span></>}
                  {viewMode === 'horizontal' && <><List size={16} /> <span>Lista</span></>}
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginLeft: '2px' }}>▼</span>
                </button>

                {showGridDropdown && (
                  <>
                    <div 
                      onClick={() => setShowGridDropdown(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998,
                        background: 'transparent'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '46px',
                      right: 0,
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '10px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      padding: '6px',
                      zIndex: 999,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minWidth: '120px'
                    }}>
                      <button
                        onClick={() => {
                          setViewMode('grid');
                          setShowGridDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          border: 'none',
                          background: viewMode === 'grid' ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                          color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        <LayoutGrid size={15} />
                        <span>Grid</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setViewMode('large');
                          setShowGridDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          border: 'none',
                          background: viewMode === 'large' ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                          color: viewMode === 'large' ? 'var(--primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        <Square size={15} />
                        <span>Grande</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setViewMode('horizontal');
                          setShowGridDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          border: 'none',
                          background: viewMode === 'horizontal' ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                          color: viewMode === 'horizontal' ? 'var(--primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        <List size={15} />
                        <span>Lista</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}
          </div>
        </div>

        {gifts.length === 0 ? (
          <div className="glass-card" style={styles.emptyState}>
            <Gift size={48} color="var(--text-muted)" />
            <h3>Nenhum presente na lista</h3>
            <p>O dono deste evento ainda não cadastrou nenhum presente.</p>
          </div>
        ) : (
          <div className={`gifts-grid-container view-mode-${viewMode}`}>
            {gifts
              .filter((gift) => {
                if (filterMode === 'available') return gift.status !== 'reservado';
                return true;
              })
              .map((gift) => {
                const isReserved = gift.status === 'reservado';
                return (
                  <div 
                    key={gift.id} 
                    className="glass-card" 
                    style={{
                      ...styles.giftCard,
                      background: isReserved ? '#fafafa' : 'var(--card-bg)',
                      border: isReserved ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--card-border)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Ribbon de "Reservado" no canto superior direito */}
                    {isReserved && (
                      <div className="gift-ribbon" style={{
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 28,
                        height: 36,
                        background: 'linear-gradient(160deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        clipPath: 'polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                        flexShrink: 0,
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}

                    {/* Foto */}
                    <div className="gift-img" style={{
                      ...styles.imageContainer,
                      opacity: isReserved ? 0.6 : 1,
                    }}>
                      {gift.image_url ? (
                        <img 
                          src={gift.image_url} 
                          alt={gift.name} 
                          style={{
                            ...styles.image,
                            filter: isReserved ? 'blur(3px)' : 'none',
                          }} 
                        />
                      ) : (
                        <div style={styles.placeholder}>
                          {gift.is_search_link ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem', gap: '0.4rem' }}>
                              <div style={{ 
                                width: '44px', 
                                height: '44px', 
                                borderRadius: '12px', 
                                background: 'rgba(var(--primary-rgb), 0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                marginBottom: '0.25rem'
                              }}>
                                <Gift size={20} color="var(--primary)" />
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Busca Facilitada 🔍</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', lineHeight: 1.3 }}>
                                Escolha o modelo ideal acessando os links de busca abaixo.
                              </span>
                            </div>
                          ) : (
                            <>
                              <Gift size={32} color="var(--text-muted)" />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem Imagem</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detalhes do Presente */}
                    <div className="gift-body" style={styles.giftBody}>
                      {/* Badge de tipo acima do nome */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        background: gift.is_search_link ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                        border: gift.is_search_link ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '5px',
                        fontSize: '0.6rem',
                        fontWeight: '700',
                        color: gift.is_search_link ? '#b45309' : '#059669',
                        alignSelf: 'flex-start',
                        marginBottom: '0.15rem',
                      }}>
                        {gift.is_search_link ? (
                          <><span>Busca facilitada</span><span>🔍</span></>
                        ) : (
                          <><span>Modelo Exato</span><span>✅</span></>
                        )}
                      </div>

                      <h3 style={{
                        ...styles.giftTitle,
                        opacity: isReserved ? 0.6 : 1,
                      }}>{gift.name}</h3>
                      {gift.price ? (
                        <p style={{
                          ...styles.giftPrice,
                          opacity: isReserved ? 0.6 : 1,
                        }}>
                          {gift.is_search_link ? 'A partir de ' : ''}R$ {gift.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      ) : null}

                      {isReserved ? (
                        <div style={{
                          ...styles.reservedInfo,
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}>
                          <CheckCircle2 size={14} color="var(--success)" />
                          <span style={{ color: 'var(--success)', fontWeight: '600' }}>Já reservado 🎁</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleOpenReserve(gift)} 
                          className="btn btn-primary" 
                          style={styles.reserveBtn}
                        >
                          <Gift size={14} />
                          Selecionar presente
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Rodapé de Branding */}
      <footer style={styles.footer}>
        <p>Crie sua própria lista de presentes grátis com o <strong style={{color: 'var(--primary)'}}>Convitin</strong></p>
      </footer>

      {/* MODAL DE RESERVA */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.modalCard}>
            {/* Header: eyebrow + título (nome do produto) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={styles.giftIconBox}>
                  <Gift size={16} color="#ffffff" />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Reservar Presente
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, lineHeight: 1.2, color: 'var(--text-main)' }}>
                {selectedGift?.name}
              </h2>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // Validate and show floating tip if needed
              if (!firstName.trim() && !lastName.trim()) {
                setValidationMsg('Preencha seu nome e sobrenome para continuar.');
                setShowValidationTip(true);
                setTimeout(() => setShowValidationTip(false), 3000);
                return;
              }
              if (!firstName.trim() || !lastName.trim()) {
                setValidationMsg(!firstName.trim() ? 'Informe seu nome.' : 'Informe seu sobrenome.');
                setShowValidationTip(true);
                setTimeout(() => setShowValidationTip(false), 3000);
                return;
              }
              if (!selectedStore) {
                setValidationMsg('Selecione onde deseja comprar o presente.');
                setShowValidationTip(true);
                setTimeout(() => setShowValidationTip(false), 3000);
                return;
              }
              handleConfirmReserve(e);
            }} style={styles.modalForm}>

              {/* Nome */}
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="firstName" style={{ fontSize: '0.8rem' }}>Nome</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="João"
                  className="input-field"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setShowValidationTip(false); }}
                />
              </div>

              {/* Sobrenome */}
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="lastName" style={{ fontSize: '0.8rem' }}>Sobrenome</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Silva"
                  className="input-field"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setShowValidationTip(false); }}
                />
              </div>

              {/* Tip abaixo dos nomes */}
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0.4rem 0 0', lineHeight: 1.4 }}>
                💡 Preencha seu nome e selecione a loja para confirmar sua reserva.
              </p>

              {/* Seleção de Loja */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>
                  Onde deseja comprar?
                </label>
                {selectedGift?.is_search_link && (
                  <p style={{ fontSize: '0.75rem', color: '#b45309', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 12px', borderRadius: '8px', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    <strong>Busca facilitada:</strong> Os botões abaixo te levam para uma página com diversas opções onde você pode escolher o presente ideal.
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedGift?.link_ml && (
                    <button
                      type="button"
                      onClick={() => { setSelectedStore('ml'); setShowValidationTip(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 1rem', borderRadius: '10px',
                        border: selectedStore === 'ml' ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                        background: selectedStore === 'ml' ? 'rgba(var(--primary-rgb),0.06)' : 'var(--card-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        fontWeight: '600', fontSize: '0.875rem',
                        color: 'var(--text-main)', textAlign: 'left', width: '100%',
                      }}
                    >
                      <MercadoLivreIcon />
                      Mercado Livre
                      {selectedStore === 'ml' && <CheckCircle2 size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
                    </button>
                  )}
                  {selectedGift?.link_shopee && (
                    <button
                      type="button"
                      onClick={() => { setSelectedStore('shopee'); setShowValidationTip(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 1rem', borderRadius: '10px',
                        border: selectedStore === 'shopee' ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                        background: selectedStore === 'shopee' ? 'rgba(var(--primary-rgb),0.06)' : 'var(--card-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        fontWeight: '600', fontSize: '0.875rem',
                        color: 'var(--text-main)', textAlign: 'left', width: '100%',
                      }}
                    >
                      <ShopeeIcon />
                      Shopee
                      {selectedStore === 'shopee' && <CheckCircle2 size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
                    </button>
                  )}
                  {selectedGift?.link_amazon && (
                    <button
                      type="button"
                      onClick={() => { setSelectedStore('amazon'); setShowValidationTip(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 1rem', borderRadius: '10px',
                        border: selectedStore === 'amazon' ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                        background: selectedStore === 'amazon' ? 'rgba(var(--primary-rgb),0.06)' : 'var(--card-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        fontWeight: '600', fontSize: '0.875rem',
                        color: 'var(--text-main)', textAlign: 'left', width: '100%',
                      }}
                    >
                      <AmazonIcon />
                      Amazon
                      {selectedStore === 'amazon' && <CheckCircle2 size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div style={{ marginTop: '1.25rem', position: 'relative' }}>
                {/* Floating validation tip */}
                {showValidationTip && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1e293b',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: '500',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                    zIndex: 10,
                    animation: 'fadeIn 0.15s ease',
                    pointerEvents: 'none',
                  }}>
                    ⚠️ {validationMsg}
                    {/* Arrow */}
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #1e293b',
                    }} />
                  </div>
                )}
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={reserveLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={reserveLoading || !firstName.trim() || !lastName.trim() || !selectedStore}
                  >
                    {reserveLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Reservando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Confirmar Reserva
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REDIRECIONAMENTO */}
      {showRedirectModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={{ ...styles.modalCard, maxWidth: '420px', textAlign: 'center' }}>
            {/* Ícone de sucesso */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--success) 0%, #34d399 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
              }}>
                <CheckCircle2 size={30} color="#fff" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>Presente Reservado! 🎁</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Você será redirecionado para o{' '}
              <strong style={{ color: 'var(--primary)' }}>{redirectStoreName}</strong>{' '}
              em instantes para concluir a compra.
            </p>

            {/* Countdown */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '72px', height: '72px', borderRadius: '50%',
              border: '3px solid var(--primary)',
              margin: '0 auto 1.5rem',
              fontSize: redirectCountdown > 0 ? '2rem' : '1rem',
              fontWeight: '800',
              color: 'var(--primary)',
            }}>
              {redirectCountdown > 0 ? redirectCountdown : '↗'}
            </div>

            {/* Botões de ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                <ExternalLink size={16} />
                Ir para o {redirectStoreName}
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(redirectUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                {copied ? 'Link copiado!' : 'Copiar link do presente'}
              </button>
              <button
                type="button"
                onClick={() => setShowRedirectModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.25rem', marginTop: '0.25rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, var(--background-start) 0%, var(--background-end) 100%)',
    backgroundAttachment: 'fixed',
  },
  navbar: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 200,
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    boxSizing: 'border-box' as const,
  },
  navInner: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navLogoIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 7px rgba(var(--primary-rgb), 0.2)',
    flexShrink: 0,
  },
  navLogoName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: 'var(--text-main)',
    fontFamily: "'Inter', sans-serif",
  },
  banner: {
    height: '160px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    width: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0 1rem 1.5rem',
    boxSizing: 'border-box',
  },
  infoCard: {
    width: '100%',
    maxWidth: '550px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
  },
  heartCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  description: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    maxWidth: '440px',
  },
  divider: {
    width: '60px',
    height: '2px',
    backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
    margin: '0.5rem 0',
  },
  stats: {
    display: 'flex',
    gap: '3rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  container: {
    marginTop: '0.5rem',
    flex: 1,
    boxSizing: 'border-box',
    padding: '1rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '4rem 2rem',
    maxWidth: '500px',
    margin: '0 auto',
    gap: '1rem',
  },
  giftsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: '1.25rem',
    marginTop: '2rem',
  },
  giftCard: {
    background: 'var(--card-bg)',
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'var(--transition-smooth)',
    borderRadius: '14px',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: '1',
    position: 'relative',
    background: '#ffffff',
    borderBottom: '1px solid rgba(var(--primary-rgb), 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '0.6rem',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  platformLogoSmall: {
    height: '20px',
    maxWidth: '80px',
    objectFit: 'contain',
  },
  reservedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  reservedBadge: {
    background: 'var(--success)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  giftBody: {
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  giftTitle: {
    fontSize: '0.875rem',
    fontWeight: '700',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  giftPrice: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--primary)',
    margin: 0,
  },
  giftPriceMuted: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    margin: 0,
  },
  reservedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: 'auto',
    background: 'rgba(0,0,0,0.03)',
    padding: '0.5rem',
    borderRadius: '6px',
  },
  actionsContainer: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  storeButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  storeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '700',
    width: '100%',
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
  },
  storeIcon: {
    width: '16px',
    height: '16px',
    objectFit: 'contain',
  },
  reserveBtn: {
    width: '100%',
    padding: '0.55rem 0.75rem',
    fontSize: '0.75rem',
    marginTop: 'auto',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  },
  footer: {
    padding: '3rem 1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '460px',
    background: '#ffffff',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  giftIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(var(--primary-rgb), 0.15)',
  },
  modalInstruction: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
};
