'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Gift, ArrowLeft, Loader2, Plus, Trash2, Check, ShoppingBag
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function NewGiftPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<any>(null);

  // Form Fields
  const [links, setLinks] = useState<string[]>(['']);
  const [giftName, setGiftName] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftImageUrl, setGiftImageUrl] = useState('');
  const [giftIsSearchLink, setGiftIsSearchLink] = useState(false);
  const [quantityEnabled, setQuantityEnabled] = useState(false);
  const [giftQuantity, setGiftQuantity] = useState<number | string>(1);
  
  // Scraper Options / Loading States
  const [scrapingIndex, setScrapingIndex] = useState<number | null>(null);
  const [giftSaveLoading, setGiftSaveLoading] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  useEffect(() => {
    const checkUserAndFetchList = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

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
      setLoading(false);
    };

    checkUserAndFetchList();
  }, [slug, router]);

  // Auxiliar para identificar plataforma
  const getPlatform = (url: string) => {
    if (!url) return 'other';
    if (/mercadolivre\.com/i.test(url) || /mercadolibre/i.test(url)) return 'mercadolivre';
    if (/shopee\.com/i.test(url) || /shp\.ee/i.test(url)) return 'shopee';
    if (/amazon\.com/i.test(url)) return 'amazon';
    return 'other';
  };

  const handleLinkChange = async (index: number, val: string) => {
    let cleanVal = val.trim();
    if (cleanVal && !/^https?:\/\//i.test(cleanVal)) {
      cleanVal = 'https://' + cleanVal;
    }

    const updatedLinks = [...links];
    updatedLinks[index] = cleanVal;
    setLinks(updatedLinks);

    if (!cleanVal || !/^https?:\/\//i.test(cleanVal)) return;

    // Apenas se for o primeiro link a ser preenchido (index === 0) ou se ainda não temos nome
    const isFirstLink = index === 0 || !giftName;

    if (isFirstLink) {
      setScrapingIndex(index);
      const startTime = Date.now();
      try {
        const res = await fetch(`/api/scrape?url=${encodeURIComponent(cleanVal)}`);
        if (res.ok) {
          const data = await res.json();
          
          // Calcular tempo restante para garantir pelo menos 1.5 segundos de loading
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 1500 - elapsed);
          
          setTimeout(() => {
            if (data.url) {
              cleanVal = data.url;
              const finalLinks = [...links];
              finalLinks[index] = cleanVal;
              setLinks(finalLinks);
            }
            if (data.name && data.name !== 'Produto sem Nome') {
              setGiftName(data.name);
            }
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
              setCandidateImages(data.images);
              setGiftImageUrl(data.images[0]);
              setSelectedImageIndex(0);
            } else if (data.image_url) {
              setCandidateImages([data.image_url]);
              setGiftImageUrl(data.image_url);
              setSelectedImageIndex(0);
            } else {
              setCandidateImages([]);
              setGiftImageUrl('');
            }

            const isSearch = (/lista\.mercadolivre\.com\.br/i.test(cleanVal) || 
                              /\/search/i.test(cleanVal) || 
                              /&search/i.test(cleanVal) || 
                              /\/s\?/i.test(cleanVal) || 
                              /busca/i.test(cleanVal)) && !/\/p\/MLB[0-9]+/i.test(cleanVal);
            setGiftIsSearchLink(isSearch);
            setScrapingIndex(null);
          }, remainingDelay);
        } else {
          setScrapingIndex(null);
        }
      } catch (err) {
        console.error('Erro ao ler produto:', err);
        setScrapingIndex(null);
      }
    }
  };

  const addLinkField = () => {
    if (links.length < 5) {
      setLinks([...links, '']);
    }
  };

  const removeLinkField = (index: number) => {
    if (links.length > 1) {
      const updated = links.filter((_, i) => i !== index);
      setLinks(updated);
    }
  };

  const saveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeLinks = links.filter(l => l.trim() !== '');
    if (activeLinks.length === 0) {
      alert('Por favor, insira pelo menos um link de presente.');
      return;
    }
    if (!giftName.trim()) {
      alert('Nome do presente é obrigatório.');
      return;
    }

    const cleanProductUrl = (url: string) => {
      if (!url) return '';
      const isSearch = /lista\.mercadolivre\.com\.br/i.test(url) || 
                       /\/search/i.test(url) || 
                       /&search/i.test(url) || 
                       /\/s\?/i.test(url) || 
                       /busca/i.test(url);
      if (isSearch) return url.trim();
      return url.trim().split('?')[0].split('#')[0];
    };

    // Mapear links ativos para as colunas do banco
    let linkMl: string | null = null;
    let linkShopee: string | null = null;
    let linkAmazon: string | null = null;

    activeLinks.forEach(lnk => {
      const platform = getPlatform(lnk);
      const cleaned = cleanProductUrl(lnk);
      if (platform === 'mercadolivre') linkMl = cleaned;
      else if (platform === 'shopee') linkShopee = cleaned;
      else if (platform === 'amazon') linkAmazon = cleaned;
      else {
        // Fallback: se for outra plataforma, associamos na primeira vaga livre
        if (!linkMl) linkMl = cleaned;
        else if (!linkShopee) linkShopee = cleaned;
        else if (!linkAmazon) linkAmazon = cleaned;
      }
    });

    setGiftSaveLoading(true);
    try {
      const giftData = {
        list_id: selectedList.id,
        name: giftName,
        link_ml: linkMl,
        link_shopee: linkShopee,
        link_amazon: linkAmazon,
        price: giftPrice ? parseFloat(giftPrice) : null,
        image_url: giftImageUrl || null,
        is_search_link: giftIsSearchLink,
        quantity: quantityEnabled ? (Math.max(1, parseInt(String(giftQuantity)) || 1)) : null,
        quantity_reserved: 0,
      };

      const { error } = await supabase
        .from('gifts')
        .insert([giftData]);
      if (error) throw error;

      router.push(`/dashboard/${slug}/meus-presentes`);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar presente.');
    } finally {
      setGiftSaveLoading(false);
    }
  };

  if (loading || !selectedList) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p>Carregando tela de cadastro...</p>
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
        <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          
          {/* Título e Botão Voltar alinhados na primeira linha, Descrição na segunda linha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => router.push(`/dashboard/${slug}/meus-presentes`)} className="btn btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ ...styles.viewTitle, margin: 0 }}>Cadastrar Presente</h2>
            </div>
            <p style={{ ...styles.viewSubtitle, margin: 0 }}>Insira as informações do presente que você quer ganhar.</p>
          </div>

          <form onSubmit={saveGift} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', background: '#ffffff', padding: '1rem', borderRadius: '24px' }}>
            
            {/* COMPONENTE DE MULTIPLOS LINKS */}
            <div className="form-group">
              <label>Links do Presente</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map((link, idx) => {
                  const plat = getPlatform(link);
                  const isScraping = scrapingIndex === idx;

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type="url"
                          placeholder="Cole o link aqui..."
                          className="input-field"
                          style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }}
                          value={link}
                          onChange={(e) => {
                            const updatedLinks = [...links];
                            updatedLinks[idx] = e.target.value;
                            setLinks(updatedLinks);
                          }}
                          onBlur={(e) => handleLinkChange(idx, e.target.value)}
                          required={idx === 0}
                        />
                        {isScraping ? (
                          <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--primary)' }} />
                        ) : plat !== 'other' && (
                          <ShoppingBag size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#10b981' }} />
                        )}
                      </div>
                      
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLinkField(idx)}
                          className="btn btn-secondary"
                          style={{ padding: '0.6rem', color: 'var(--accent)', border: '1px solid #cbd5e1' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {links.length < 5 && (
                <button
                  type="button"
                  onClick={addLinkField}
                  className="btn btn-secondary"
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: '1px dashed var(--primary)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    alignSelf: 'flex-start'
                  }}
                >
                  <Plus size={14} />
                  Adicionar outro link
                </button>
              )}
            </div>

            {/* CAMPOS COMPLEMENTARES (Nome do Presente e Preço Estimado) */}
            <div className="form-group">
              <label htmlFor="giftName">Nome do Presente</label>
              <input
                id="giftName"
                type="text"
                placeholder="Ex: Capa Bebê Conforto"
                className="input-field"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                required
              />
            </div>

            {/* SELETOR DE IMAGENS CANDIDATAS */}
            {scrapingIndex !== null ? (
              <div style={{ padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Loader2 size={24} className="animate-spin" color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Lendo informações e buscando imagens do produto...</span>
              </div>
            ) : candidateImages.length > 0 && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Selecione sua imagem preferida</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '4px', overflowX: 'auto', padding: '4px 0' }}>
                  {candidateImages.slice(0, 3).map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setGiftImageUrl(img);
                      }}
                      style={{
                        position: 'relative',
                        width: '76px',
                        height: '76px',
                        borderRadius: '8px',
                        border: selectedImageIndex === idx ? '2px solid var(--primary)' : '2px solid #e2e8f0',
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {selectedImageIndex === idx && (
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="giftPrice">
                Preço Estimado <small style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>(Opcional)</small>
              </label>
              <input
                id="giftPrice"
                type="number"
                step="0.01"
                placeholder="Ex: 99.90"
                className="input-field"
                value={giftPrice}
                onChange={(e) => setGiftPrice(e.target.value)}
              />
            </div>

            {/* TOGGLE QUANTIDADE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: quantityEnabled ? '0' : '0.5rem' }}>
              <div
                onClick={() => setQuantityEnabled(v => !v)}
                style={{
                  width: '38px', height: '22px', borderRadius: '11px',
                  background: quantityEnabled ? 'var(--primary)' : '#cbd5e1',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: quantityEnabled ? '19px' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#ffffff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
              <label onClick={() => setQuantityEnabled(v => !v)} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1.3 }}>
                Habilitar quantidade
              </label>
            </div>

            {quantityEnabled && (
              <div className="form-group" style={{ marginTop: '0.6rem', marginBottom: '0.5rem' }}>
                <label htmlFor="giftQuantity" style={{ fontSize: '0.8rem' }}>
                  Quantidade desejada <small style={{ fontWeight: 'normal', color: '#64748b' }}>(ex: 10 pacotes de fralda)</small>
                </label>
                <input
                  id="giftQuantity"
                  type="number"
                  min={1}
                  placeholder="Ex: 10"
                  className="input-field"
                  value={giftQuantity}
                  onChange={(e) => setGiftQuantity(e.target.value)}
                  onBlur={() => setGiftQuantity(v => {
                    const n = parseInt(String(v));
                    return isNaN(n) || n < 1 ? 1 : n;
                  })}
                />
              </div>
            )}

            {/* CHECKBOX LINK DE BUSCA MANUAL */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="isSearchLink"
                checked={giftIsSearchLink}
                style={{ marginTop: '0.2rem' }}
                onChange={(e) => {
                  setGiftIsSearchLink(e.target.checked);
                  if (e.target.checked) setGiftImageUrl('');
                }}
              />
              <label htmlFor="isSearchLink" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1.3 }}>
                Este é um link de busca geral (busca facilitada)
              </label>
            </div>

            {/* IMAGEM PREVIEW */}
            {(giftImageUrl || giftIsSearchLink) && (
              <div style={styles.giftPreviewBox}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>Visualização no Card:</label>
                <div style={styles.giftMiniPreview}>
                   {giftImageUrl ? (
                     <img src={giftImageUrl} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Gift size={20} color="var(--text-muted)" />
                     </div>
                   )}
                  <div>
                    <h5 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{giftName || 'Nome do Presente'}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Imagem ilustrativa
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="dashboard-form-actions">
              <button type="button" onClick={() => router.push(`/dashboard/${slug}/meus-presentes`)} className="btn btn-secondary dashboard-form-actions-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary dashboard-form-actions-save" disabled={giftSaveLoading}>
                {giftSaveLoading ? 'Salvando...' : 'Salvar Presente'}
              </button>
            </div>
          </form>
        </div>
      </main>
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
  giftPreviewBox: {
    background: '#f8fafc',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  giftMiniPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.5rem',
  }
};
