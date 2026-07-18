'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Plus, LogOut, Share2, Eye, Edit2, Trash2, ExternalLink, 
  Copy, Check, Sparkles, Image as ImageIcon, Calendar, FileText, Globe, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Settings, Share
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ListSubRoutePage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as 'meus-presentes' | 'reservados' | 'configuracoes' || 'meus-presentes';
  const { slug } = use(params);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Lista sendo gerenciada
  const [selectedList, setSelectedList] = useState<any>(null);

  // Abas de sub-seções internas da rota dinâmica
  // 'meus-presentes' -> Gerenciar presentes da lista
  // 'reservados' -> Visualizar convidados que reservaram produtos
  // 'configuracoes' -> Editar configurações (antigo edit_list)
  const [currentTab, setCurrentTab] = useState<'meus-presentes' | 'reservados' | 'configuracoes'>(initialTab);

  // Configurações da Lista (Campos de formulário)
  const [listTitle, setListTitle] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listEventType, setListEventType] = useState('birthday');
  const [listThemeColor, setListThemeColor] = useState('classic');
  const [listBannerUrl, setListBannerUrl] = useState('');
  const [listSlug, setListSlug] = useState('');
  const [listEventDate, setListEventDate] = useState('');
  const [customBannerFile, setCustomBannerFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listSaveLoading, setListSaveLoading] = useState(false);

  // Presentes
  const [gifts, setGifts] = useState<any[]>([]);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [giftName, setGiftName] = useState('');
  const [giftLinkMl, setGiftLinkMl] = useState('');
  const [giftLinkShopee, setGiftLinkShopee] = useState('');
  const [giftLinkAmazon, setGiftLinkAmazon] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftImageUrl, setGiftImageUrl] = useState('');
  const [giftIsSearchLink, setGiftIsSearchLink] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftSaveLoading, setGiftSaveLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

      // Buscar se a lista com o slug pertence a este usuário logado (Dono da Lista)
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', session.user.id)
        .single();

      if (listError || !listData) {
        // Redireciona para o painel principal se a lista não for dele ou não existir
        router.push('/dashboard');
        return;
      }

      setSelectedList(listData);
      
      // Carregar os campos da lista
      setListTitle(listData.title);
      setListDescription(listData.description || '');
      setListEventType(listData.event_type || 'other');
      setListThemeColor(listData.theme_color || 'classic');
      setListBannerUrl(listData.banner_url || '');
      setListSlug(listData.slug);
      setListEventDate(listData.event_date || '');

      // Buscar os presentes da lista
      await fetchGifts(listData.id);
    };

    checkUserAndFetchList();
  }, [slug, router]);

  // Sincronizar aba ativa quando mudar nos searchParams (ex: navegação de voltar/avançar do browser)
  useEffect(() => {
    const tab = searchParams.get('tab') as 'meus-presentes' | 'reservados' | 'configuracoes';
    if (tab && (tab === 'meus-presentes' || tab === 'reservados' || tab === 'configuracoes')) {
      setCurrentTab(tab);
    }
  }, [searchParams]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Tratar upload de imagem de capa
  const handleBannerUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('banners').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Salvar Lista (Configurações)
  const saveList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListSaveLoading(true);

    try {
      let finalBannerUrl = listBannerUrl;

      // Se houver arquivo customizado, faz upload
      if (customBannerFile) {
        finalBannerUrl = await handleBannerUpload(customBannerFile);
      }

      const listData = {
        title: listTitle,
        description: listDescription,
        event_type: listEventType,
        theme_color: listThemeColor,
        banner_url: finalBannerUrl,
        event_date: listEventDate || null,
      };

      const { error } = await supabase
        .from('lists')
        .update(listData)
        .eq('id', selectedList.id);

      if (error) throw error;

      setToastMessage('Alterações salvas com sucesso! 📝');
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setToastMessage('');
        // Atualiza os dados locais
        setSelectedList({ ...selectedList, ...listData });
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar a lista.');
    } finally {
      setListSaveLoading(false);
    }
  };

  const openGiftModal = (gift: any = null) => {
    setGiftSaveLoading(false);
    if (gift) {
      setGiftId(gift.id);
      setGiftName(gift.name);
      setGiftLinkMl(gift.link_ml || '');
      setGiftLinkShopee(gift.link_shopee || '');
      setGiftLinkAmazon(gift.link_amazon || '');
      setGiftPrice(gift.price ? gift.price.toString() : '');
      setGiftImageUrl(gift.image_url || '');
      setGiftIsSearchLink(gift.is_search_link || false);
    } else {
      setGiftId(null);
      setGiftName('');
      setGiftLinkMl('');
      setGiftLinkShopee('');
      setGiftLinkAmazon('');
      setGiftPrice('');
      setGiftImageUrl('');
      setGiftIsSearchLink(false);
    }
    setShowGiftModal(true);
  };

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
            console.warn('Erro ao buscar imagem no salvamento (timeout ou abort):', scrapeErr);
          }
        }
      }

      const giftData = {
        list_id: selectedList.id,
        name: giftName,
        link_ml: cleanedLinkMl,
        link_shopee: cleanedLinkShopee,
        link_amazon: cleanedLinkAmazon,
        price: giftPrice ? parseFloat(giftPrice) : null,
        image_url: scrapedImageUrl || null,
        is_search_link: finalIsSearchLink,
      };

      if (giftId) {
        const { error } = await supabase
          .from('gifts')
          .update(giftData)
          .eq('id', giftId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gifts')
          .insert([giftData]);
        if (error) throw error;
      }

      setShowGiftModal(false);
      setToastMessage(giftId ? 'Presente atualizado com sucesso! 🎁' : 'Presente cadastrado com sucesso! 🎁');
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        setToastMessage('');
        fetchGifts(selectedList.id);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar presente.');
    } finally {
      setGiftSaveLoading(false);
    }
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
          setToastMessage('Presente excluído com sucesso! 🗑️');
          setShowSuccessToast(true);
          setTimeout(() => {
            setShowSuccessToast(false);
            setToastMessage('');
          }, 1500);
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
          setToastMessage('Reserva liberada com sucesso! 🔓');
          setShowSuccessToast(true);
          setTimeout(() => {
            setShowSuccessToast(false);
            setToastMessage('');
          }, 1500);
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

  // Definições de Temas Conceituais de Cores e Capas recomendadas (Proporção 3:1 otimizada para celular)
  const THEMES_DATA: Record<string, { name: string; colors: string[]; banners: string[] }> = {
    classic: {
      name: 'Azul Minimal',
      colors: ['#4f46e5', '#818cf8', '#f8fafc'],
      banners: [
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    },
    wedding: {
      name: 'Champagne Chic',
      colors: ['#c5a880', '#e6e0d5', '#faf9f6'],
      banners: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1508349657170-2a2b25852528?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    },
    baby_boy: {
      name: 'Céu Suave',
      colors: ['#60a5fa', '#93c5fd', '#f0f7ff'],
      banners: [
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    },
    baby_girl: {
      name: 'Rosa Delicado',
      colors: ['#f9a8d4', '#fbcfe8', '#fff1f2'],
      banners: [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1579546929662-711aa81148cf?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    },
    baby_neutral: {
      name: 'Verde Menta',
      colors: ['#6ee7b7', '#a7f3d0', '#f0fdf4'],
      banners: [
        'https://images.unsplash.com/photo-1557682260-96773eb0237a?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    },
    birthday: {
      name: 'Sol Radiante',
      colors: ['#ea580c', '#f97316', '#fffbeb'],
      banners: [
        'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    },
    bridal_shower: {
      name: 'Vinho & Rosé',
      colors: ['#f43f5e', '#fda4af', '#fff1f2'],
      banners: [
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1516594709406-e8a79a18c6c6?auto=format&fit=crop&q=80&w=1200&h=400',
        'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?auto=format&fit=crop&q=80&w=1200&h=400'
      ]
    }
  };

  if (loading || !selectedList) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p>Carregando informações da lista...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header do Dashboard */}
      <header style={styles.header} className="glass-card">
        <div className="dashboard-header-container">
          <div className="dashboard-header-top-row">
            <Link href="/dashboard" style={{ ...styles.logo, cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
              <div style={styles.logoIcon}>
                <Gift size={18} color="#ffffff" />
              </div>
              <span style={styles.logoName}>Convitin</span>
            </Link>

            <button 
              onClick={handleLogout} 
              className="btn btn-secondary dashboard-logout-mobile" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0 }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>

          <div className="dashboard-user-bar">
            <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={styles.main}>
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          
          {/* Menu Superior com Apenas o Botão de Voltar (Seta) */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
          </div>

          {/* ABA 1: GERENCIAR MEUS PRESENTES */}
          {currentTab === 'meus-presentes' && (
            <div className="animate-fade-in">
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
                    <button onClick={() => openGiftModal()} className="btn btn-primary">
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
                    <button onClick={() => openGiftModal()} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                      Cadastrar Primeiro Presente
                    </button>
                  </div>
                ) : (
                  <div style={styles.giftsGrid}>
                    {gifts.map((gift) => (
                      <div key={gift.id} className="glass-card" style={{
                        ...styles.giftCard,
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
                              <button onClick={() => openGiftModal(gift)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
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
          )}

          {/* ABA 2: RESERVADOS / COMPRADOS */}
          {currentTab === 'reservados' && (
            <div className="animate-fade-in glass-card" style={{ padding: '2.5rem', background: '#ffffff', borderRadius: '24px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={styles.viewTitle}>Produtos Reservados por Convidados</h2>
                <p style={styles.viewSubtitle}>Acompanhe quem reservou cada item para controle do evento.</p>
              </div>

              <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                {(() => {
                  const reservedGifts = gifts.filter((g: any) => g.status === 'reservado') || [];
                  if (reservedGifts.length === 0) {
                    return (
                      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                        <Gift size={48} style={{ marginBottom: '1rem', color: '#cbd5e1', display: 'inline-block' }} />
                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Nenhum presente reservado nesta lista ainda.</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Assim que os convidados começarem a escolher, as informações aparecerão aqui.</p>
                      </div>
                    );
                  }

                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                          <th style={{ padding: '1rem', fontWeight: '700', color: '#475569' }}>Presente</th>
                          <th style={{ padding: '1rem', fontWeight: '700', color: '#475569' }}>Quem Reservou</th>
                          <th style={{ padding: '1rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservedGifts.map((gift: any) => (
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
                  );
                })()}
              </div>
            </div>
          )}

          {/* ABA 3: CONFIGURAR LISTA */}
          {currentTab === 'configuracoes' && (
            <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={styles.viewTitle}>Configurações da Lista</h2>
                <p style={styles.viewSubtitle}>Edite o título, descrição, data e aparência visual da lista.</p>
              </div>

              <form onSubmit={saveList} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', background: '#ffffff' }}>
                <div className="dashboard-form-columns">
                  
                  {/* COLUNA 1 */}
                  <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label htmlFor="title">Nome do Evento</label>
                      <input
                        id="title"
                        type="text"
                        className="input-field"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="eventDate">Data do Evento</label>
                      <input
                        id="eventDate"
                        type="date"
                        className="input-field"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        value={listEventDate}
                        onChange={(e) => setListEventDate(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="slug">Link da Lista (URL amigável)</label>
                      <div style={styles.inputWrapper}>
                        <Globe size={18} style={styles.inputIcon} />
                        <input
                          id="slug"
                          type="text"
                          className="input-field"
                          style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', width: '100%', boxSizing: 'border-box', paddingLeft: '38px' }}
                          value={`convitin.com.br/lista/${listSlug}`}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Descrição / Mensagem aos Convidados</label>
                      <textarea
                        id="description"
                        className="input-field"
                        style={{ minHeight: '110px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                        value={listDescription}
                        onChange={(e) => setListDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* COLUNA 2 */}
                  <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ marginBottom: '0.5rem', display: 'block' }}>Tema de Cores</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '0.5rem' }}>
                        {Object.entries(THEMES_DATA).map(([key, theme]) => {
                          const isSelected = listThemeColor === key;
                          return (
                            <div
                              key={key}
                              onClick={() => {
                                setListThemeColor(key);
                                setListBannerUrl(theme.banners[0]);
                                setCustomBannerFile(null);
                              }}
                              style={{
                                background: '#ffffff',
                                border: isSelected ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : '#475569' }}>
                                {theme.name}
                              </span>
                              <div style={{ display: 'flex', width: '70px', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
                                {theme.colors.map((color, idx) => (
                                  <div key={idx} style={{ flex: 1, background: color }} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Imagem de Capa (Opções combinando com o tema)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {THEMES_DATA[listThemeColor || 'classic']?.banners.map((url, index) => (
                          <div 
                            key={index} 
                            onClick={() => { setListBannerUrl(url); setCustomBannerFile(null); }}
                            style={{
                              height: '45px',
                              borderRadius: '6px',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              cursor: 'pointer',
                              backgroundImage: `url(${url})`,
                              border: listBannerUrl === url && !customBannerFile ? '2px solid var(--primary)' : '2px solid transparent',
                            }}
                          />
                        ))}
                      </div>

                      <div style={{ marginTop: '0.75rem' }}>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCustomBannerFile(e.target.files[0]);
                              setListBannerUrl(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
                          <UploadCloud size={14} style={{ marginRight: '0.25rem' }} /> Enviar Capa Personalizada
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={listSaveLoading}>
                    {listSaveLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* MODAL DE CADASTRO DE PRESENTE */}
      {showGiftModal && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={styles.modalCard}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {giftId ? 'Editar Presente' : 'Cadastrar Presente'}
            </h3>

            <form onSubmit={saveGift} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <div className="form-group">
                <label>Links das Lojas (Preenchimento automático ao colar)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={styles.linkInputRow}>
                    <span style={styles.marketLabel}>ML</span>
                    <input type="url" placeholder="https://produto.mercadolivre.com.br/..." className="input-field" style={{ flex: 1 }} value={giftLinkMl} onChange={(e) => setGiftLinkMl(e.target.value)} onBlur={(e) => triggerScrape(e.target.value)} />
                  </div>
                  <div style={styles.linkInputRow}>
                    <span style={styles.marketLabel}>Shopee</span>
                    <input type="url" placeholder="https://shopee.com.br/..." className="input-field" style={{ flex: 1 }} value={giftLinkShopee} onChange={(e) => setGiftLinkShopee(e.target.value)} onBlur={(e) => triggerScrape(e.target.value)} />
                  </div>
                  <div style={styles.linkInputRow}>
                    <span style={styles.marketLabel}>Amazon</span>
                    <input type="url" placeholder="https://www.amazon.com.br/..." className="input-field" style={{ flex: 1 }} value={giftLinkAmazon} onChange={(e) => setGiftLinkAmazon(e.target.value)} onBlur={(e) => triggerScrape(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="giftPrice">Preço Estimado (R$ - Opcional)</label>
                <input id="giftPrice" type="number" step="0.01" placeholder="Ex: 99.90" className="input-field" value={giftPrice} onChange={(e) => setGiftPrice(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isSearchLink" checked={giftIsSearchLink} onChange={(e) => { setGiftIsSearchLink(e.target.checked); if (e.target.checked) setGiftImageUrl(''); }} />
                <label htmlFor="isSearchLink" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>Este é um link de busca geral (busca facilitada)</label>
              </div>

              {(giftImageUrl || giftIsSearchLink) && (
                <div style={styles.giftPreviewBox}>
                  <div style={styles.giftMiniPreview}>
                    {giftImageUrl ? (
                      <img src={giftImageUrl} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gift size={20} color="var(--text-muted)" /></div>
                    )}
                    <div>
                      <h5 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{giftName || 'Nome do Presente'}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{giftIsSearchLink ? 'Usará imagem da busca facilitada' : 'Foto identificada'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowGiftModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={giftSaveLoading}>{giftSaveLoading ? 'Salvando...' : 'Salvar Presente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO */}
      {confirmModalConfig && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={{ padding: '2.5rem', width: '95%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', background: '#ffffff', borderRadius: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: confirmModalConfig.isDanger ? '#FEE2E2' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)' }}>
              <AlertTriangle size={28} />
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

      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={{ padding: '2rem 2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '350px', background: '#ffffff', borderRadius: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>{toastMessage}</h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>As informações foram salvas com sucesso.</p>
          </div>
        </div>
      )}

      {/* MOBILE FOOTER FIXED ACTIONS */}
      {currentTab === 'meus-presentes' && selectedList && (
        <div className="gifts-actions-mobile-footer animate-fade-in">
          <button onClick={() => window.open(`/lista/${selectedList.slug}`, '_blank')} className="btn btn-secondary">
            <span>Visualizar Lista</span>
            <ExternalLink size={18} />
          </button>
          <button onClick={() => openGiftModal()} className="btn btn-primary">
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
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
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
    gap: '1.25rem',
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
    padding: '1.25rem',
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
  modalCard: {
    width: '100%',
    maxWidth: '520px',
    background: '#ffffff',
    boxSizing: 'border-box',
    maxHeight: '90vh',
    overflowY: 'auto',
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
