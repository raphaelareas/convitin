'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Gift, ArrowLeft, Loader2, UploadCloud
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default function EditGiftPage({ params }: PageProps) {
  const router = useRouter();
  const { slug, id } = use(params);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<any>(null);

  // Campos do Presente
  const [giftName, setGiftName] = useState('');
  const [giftLinkMl, setGiftLinkMl] = useState('');
  const [giftLinkShopee, setGiftLinkShopee] = useState('');
  const [giftLinkAmazon, setGiftLinkAmazon] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftImageUrl, setGiftImageUrl] = useState('');
  const [giftIsSearchLink, setGiftIsSearchLink] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [giftSaveLoading, setGiftSaveLoading] = useState(false);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
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

      // Buscar presente
      const { data: giftData, error: giftError } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', id)
        .eq('list_id', listData.id)
        .single();

      if (giftError || !giftData) {
        router.push(`/dashboard/${slug}/meus-presentes`);
        return;
      }

      setGiftName(giftData.name);
      setGiftLinkMl(giftData.link_ml || '');
      setGiftLinkShopee(giftData.link_shopee || '');
      setGiftLinkAmazon(giftData.link_amazon || '');
      setGiftPrice(giftData.price ? giftData.price.toString() : '');
      setGiftImageUrl(giftData.image_url || '');
      setGiftIsSearchLink(giftData.is_search_link || false);

      setLoading(false);
    };

    checkUserAndFetchData();
  }, [slug, id, router]);

  // Aciona o Scraper ao colar ou tirar o foco do input de links
  const triggerScrape = async (url: string) => {
    if (!url || scraping) return;
    if (!/^https?:\/\//i.test(url)) return;

    setScraping(true);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.name && !giftName) {
          setGiftName(data.name);
        }
        if (data.image_url) {
          setGiftImageUrl(data.image_url);
          setGiftIsSearchLink(false);
        } else if (data.is_search_link) {
          setGiftIsSearchLink(true);
          setGiftImageUrl(''); 
        }
      }
    } catch (err) {
      console.error('Erro no auto-scrape do produto:', err);
    } finally {
      setScraping(false);
    }
  };

  const saveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftName.trim()) {
      alert('Nome do presente é obrigatório.');
      return;
    }
    if (!giftLinkMl && !giftLinkShopee && !giftLinkAmazon) {
      alert('Preencha o link de pelo menos uma loja (Mercado Livre, Shopee ou Amazon).');
      return;
    }

    const cleanProductUrl = (url: string) => {
      if (!url) return null;
      const isSearch = /lista\.mercadolivre\.com\.br/i.test(url) || 
                       /\/search/i.test(url) || 
                       /&search/i.test(url) || 
                       /\/s\?/i.test(url) || 
                       /busca/i.test(url);
      if (isSearch) return url.trim();
      return url.trim().split('?')[0].split('#')[0];
    };

    const cleanedLinkMl = cleanProductUrl(giftLinkMl);
    const cleanedLinkShopee = cleanProductUrl(giftLinkShopee);
    const cleanedLinkAmazon = cleanProductUrl(giftLinkAmazon);

    setGiftSaveLoading(true);
    try {
      let scrapedImageUrl = giftImageUrl;
      let finalIsSearchLink = giftIsSearchLink;

      // Se a imagem estiver em branco, roda o scraper final antes do update
      if (!giftImageUrl) {
        const isSearchUrl = (url: string) => 
          /lista\.mercadolivre\.com\.br/i.test(url) || 
          /\/search/i.test(url) || 
          /&search/i.test(url) || 
          /\/s\?/i.test(url) || 
          /busca/i.test(url);

        const links = [cleanedLinkMl, cleanedLinkShopee, cleanedLinkAmazon].filter(Boolean) as string[];
        const directLink = links.find(lnk => !isSearchUrl(lnk));
        const firstLink = directLink || links[0];

        if (firstLink && /^https?:\/\//i.test(firstLink)) {
          try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => {
              try { controller.abort(); } catch(e) {}
            }, 8000) : null;
 
            const fetchOptions: RequestInit = {};
            if (controller) {
              fetchOptions.signal = controller.signal;
            }
 
            const res = await fetch(`/api/scrape?url=${encodeURIComponent(firstLink)}`, fetchOptions);
            if (timeoutId) clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              if (data.image_url) {
                scrapedImageUrl = data.image_url;
              }
              if (data.is_search_link) {
                finalIsSearchLink = true;
              }
            }
          } catch (scrapeErr) {
            console.warn('Erro ao buscar imagem no salvamento:', scrapeErr);
          }
        }
      }

      const giftData = {
        name: giftName,
        link_ml: cleanedLinkMl,
        link_shopee: cleanedLinkShopee,
        link_amazon: cleanedLinkAmazon,
        price: giftPrice ? parseFloat(giftPrice) : null,
        image_url: scrapedImageUrl || null,
        is_search_link: finalIsSearchLink,
      };

      const { error } = await supabase
        .from('gifts')
        .update(giftData)
        .eq('id', id);
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
        <p>Carregando tela de edição...</p>
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
              <h2 style={{ ...styles.viewTitle, margin: 0 }}>Editar Presente</h2>
            </div>
            <p style={{ ...styles.viewSubtitle, margin: 0 }}>Edite as informações cadastrais do presente selecionado.</p>
          </div>

          <form onSubmit={saveGift} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', background: '#ffffff', padding: '1rem', borderRadius: '24px' }}>
            
            <div className="form-group">
              <label htmlFor="giftName">Nome do Presente</label>
              <input
                id="giftName"
                type="text"
                className="input-field"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Links das Lojas (Preenchimento automático ao colar)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={styles.linkInputRow}>
                  <span style={styles.marketLabel}>ML</span>
                  <input 
                    type="url" 
                    placeholder="https://produto.mercadolivre.com.br/..." 
                    className="input-field" 
                    style={{ flex: 1 }}
                    value={giftLinkMl}
                    onChange={(e) => setGiftLinkMl(e.target.value)}
                    onBlur={(e) => triggerScrape(e.target.value)}
                  />
                </div>

                <div style={styles.linkInputRow}>
                  <span style={styles.marketLabel}>Shopee</span>
                  <input 
                    type="url" 
                    placeholder="https://shopee.com.br/..." 
                    className="input-field" 
                    style={{ flex: 1 }}
                    value={giftLinkShopee}
                    onChange={(e) => setGiftLinkShopee(e.target.value)}
                    onBlur={(e) => triggerScrape(e.target.value)}
                  />
                </div>

                <div style={styles.linkInputRow}>
                  <span style={styles.marketLabel}>Amazon</span>
                  <input 
                    type="url" 
                    placeholder="https://www.amazon.com.br/..." 
                    className="input-field" 
                    style={{ flex: 1 }}
                    value={giftLinkAmazon}
                    onChange={(e) => setGiftLinkAmazon(e.target.value)}
                    onBlur={(e) => triggerScrape(e.target.value)}
                  />
                </div>
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>Preencha pelo menos um campo acima.</small>
            </div>

            <div className="form-group">
              <label htmlFor="giftPrice">Preço Estimado (R$ - Opcional)</label>
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

            {/* CHECKBOX LINK DE BUSCA MANUAL */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
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
                      {giftIsSearchLink ? 'Usará a imagem da busca facilitada' : 'Foto identificada'}
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
                {giftSaveLoading ? 'Salvando...' : 'Salvar Alterações'}
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
  linkInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  marketLabel: {
    width: '60px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textAlign: 'right',
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
