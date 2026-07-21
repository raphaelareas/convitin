'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Gift, Plus, LogOut, Share2, Eye, Edit2, Trash2, ExternalLink, 
  Copy, Check, Sparkles, Image as ImageIcon, Calendar, FileText, Globe, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, UploadCloud, Settings, Share
} from 'lucide-react';


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

// Preset de logos de marketplaces
const PLATFORM_LOGOS = {
  mercadolivre: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/navigation/1.21.0/logo__large_plus.png',
  shopee: 'https://logodownload.org/wp-content/uploads/2021/03/shopee-logo-1.png',
  amazon: 'https://logodownload.org/wp-content/uploads/2014/04/amazon-logo-2.png'
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Listas
  const [lists, setLists] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'lists' | 'create_list'>('lists');
  
  // Lista sendo criada/editada
  const [selectedList, setSelectedList] = useState<any>(null);
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
  const [slugSuffix, setSlugSuffix] = useState('');

  // Auxiliares
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Formatar nome do usuário no padrão "Primeiro L."
  const formatDisplayName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    return `${parts[0]} ${lastName.charAt(0).toUpperCase()}.`;
  };

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
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      
      // Buscar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      
      // Buscar listas
      fetchLists(session.user.id);
    };

    checkUser();
  }, [router]);

  const fetchLists = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lists')
      .select('*, gifts(id, status, name, reserved_by, quantity, quantity_reserved)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLists(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Gerador de Suffix Alternado (6 caracteres: número e letra alternados)
  const generateAlternatingSuffix = (): string => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      } else {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
    }
    return result;
  };

  // Gerador de Slugs
  const handleTitleChange = (val: string) => {
    setListTitle(val);
    if (activeView === 'create_list') {
      const cleanSlug = val
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // remove chars especiais
        .replace(/[\s_]+/g, '-') // espaços/underscores para hifens
        .replace(/-+/g, '-'); // remove hifens repetidos
      
      setListSlug(cleanSlug ? `${cleanSlug}-${slugSuffix}` : '');
    }
  };

  // Abrir criação de lista
  const openCreateList = () => {
    setSelectedList(null);
    setListTitle('');
    setListDescription('');
    setListEventType('other');
    setListThemeColor('base-azul-minimal');
    setListBannerUrl('https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200&h=400');
    setListEventDate('');
    
    // Gera um sufixo aleatório único de 6 caracteres alternando número e letra
    const suffix = generateAlternatingSuffix();
    setSlugSuffix(suffix);
    setListSlug('');
    
    setCustomBannerFile(null);
    setActiveView('create_list');
  };

  // Tratar upload de imagem de capa
  const handleBannerUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get Public URL
    const { data } = supabase.storage.from('banners').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Salvar Lista (Apenas Nova Lista)
  const saveList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListSaveLoading(true);

    try {
      if (!listSlug.trim()) throw new Error('A URL da lista é obrigatória.');

      let finalBannerUrl = listBannerUrl;

      // Se houver arquivo customizado, faz upload
      if (customBannerFile) {
        finalBannerUrl = await handleBannerUpload(customBannerFile);
      }

      // Validar slug único
      const { data: existingSlug } = await supabase
        .from('lists')
        .select('id')
        .eq('slug', listSlug);
      
      if (existingSlug && existingSlug.length > 0) {
        throw new Error('Esta URL já está em uso por outra lista. Escolha outro nome.');
      }

      const listData = {
        user_id: user.id,
        title: listTitle,
        description: listDescription,
        event_type: listEventType,
        theme_color: listThemeColor,
        banner_url: finalBannerUrl,
        slug: listSlug,
        event_date: listEventDate || null,
      };

      // Inserir
      const { error } = await supabase
        .from('lists')
        .insert([listData]);

      if (error) throw error;

      setActiveView('lists');
      fetchLists(user.id);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar a lista.');
    } finally {
      setListSaveLoading(false);
    }
  };

  // Excluir Lista
  const deleteList = (listId: string) => {
    showConfirm(
      'Excluir Lista 🚨',
      'Tem certeza que deseja excluir esta lista? Todos os presentes vinculados a ela serão perdidos permanentemente.',
      async () => {
        const { error } = await supabase
          .from('lists')
          .delete()
          .eq('id', listId);

        if (error) {
          alert('Erro ao excluir lista.');
        } else {
          // Toast de confirmação
          setToastMessage('Lista excluída com sucesso! 🗑️');
          setShowSuccessToast(true);
          setTimeout(() => {
            setShowSuccessToast(false);
            setToastMessage('');
          }, 1500);
          fetchLists(user.id);
        }
      }
    );
  };


      // Copiar link de compartilhamento
  const copyShareLink = (slug: string, id: string) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${domain}/lista/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={styles.container}>
      {/* Header do Dashboard */}
      <header style={styles.header} className="glass-card">
        <div className="dashboard-header-container">
          {/* Linha superior: Logo à esquerda e botão Logout à direita (no mobile) */}
          <div className="dashboard-header-top-row">
            <div onClick={() => setActiveView('lists')} style={{ ...styles.logo, cursor: 'pointer' }}>
              <div style={styles.logoIcon}>
                <Gift size={18} color="#ffffff" />
              </div>
              <span style={styles.logoName}>Convitin</span>
            </div>

            {/* Botão Logout exclusivo para mobile */}
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary dashboard-logout-mobile" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0 }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>

          {/* Painel do usuário exclusivo para desktop */}
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
        {loading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={40} className="animate-spin" color="var(--primary)" />
            <p>Buscando suas informações...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: LISTAGEM DE EVENTOS/LISTAS */}
            {activeView === 'lists' && (
              <div className="animate-fade-in lists-main-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="dashboard-view-header">
                  <div>
                    {profile?.name && (
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Olá, {formatDisplayName(profile.name)}
                      </span>
                    )}
                    <h2 style={styles.viewTitle}>Minhas Listas</h2>
                    <p style={styles.viewSubtitle}>Crie listas, gerencie presentes e muito mais:</p>
                  </div>
                  <div className="lists-actions-desktop-header">
                    <button onClick={openCreateList} className="btn btn-primary dashboard-nova-lista-btn">
                      <Plus size={20} />
                      Nova Lista
                    </button>
                  </div>
                </div>



                {lists.length === 0 ? (
                  <div className="glass-card" style={styles.emptyState}>
                    <div style={styles.emptyIconCircle}>
                      <Gift size={40} color="var(--primary)" />
                    </div>
                    <h3>Você ainda não tem nenhuma lista</h3>
                    <p>Crie sua primeira lista de presentes para casamentos, chás de bebê ou aniversários e compartilhe com convidados.</p>
                    <button onClick={openCreateList} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                      Criar minha primeira Lista
                    </button>
                  </div>
                ) : (
                  <div style={styles.listsGrid}>
                    {lists.map((list) => (
                      <div key={list.id} className="glass-card" style={styles.listCard}>
                        {/* Botão de excluir flutuante no topo direito do card, alinhado a 16px */}
                        <button
                          onClick={() => deleteList(list.id)}
                          style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            padding: '0.45rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            cursor: 'pointer',
                            zIndex: 2,
                            transition: 'var(--transition-smooth)',
                            outline: 'none',
                          }}
                          title="Excluir lista"
                        >
                          <Trash2 size={14} />
                        </button>

                        {list.banner_url && (
                          <div 
                            style={{ 
                              ...styles.listCardBanner, 
                              backgroundImage: `url(${list.banner_url})`,
                              position: 'relative'
                            }} 
                          >
                            {/* Link de Visualizar Lista flutuante no topo esquerdo do banner, alinhado a 16px */}
                            <a 
                              href={`/lista/${list.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                background: 'rgba(255, 255, 255, 0.85)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                padding: '0.4rem 0.75rem',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                color: '#1e293b',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                zIndex: 2,
                                textDecoration: 'none',
                              }}
                            >
                              <span>Visualizar Lista</span>
                              <ExternalLink size={11} color="#1e293b" />
                            </a>
                          </div>
                        )}
                        <div style={styles.listCardContent}>
                          {/* Tags de Presentes na horizontal, com emojis, alinhadas à esquerda e sem quebrar linha */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', flexWrap: 'nowrap', width: '100%' }}>
                            {(() => {
                              const totalCadastrados = list.gifts ? list.gifts.reduce((sum: number, g: any) => sum + (g.quantity != null ? g.quantity : 1), 0) : 0;
                              const totalReservados = list.gifts ? list.gifts.reduce((sum: number, g: any) => {
                                if (g.quantity_reserved != null && g.quantity_reserved > 0) {
                                  return sum + g.quantity_reserved;
                                }
                                return sum + (g.status === 'reservado' ? 1 : 0);
                              }, 0) : 0;

                              return (
                                <>
                                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.62rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
                                    📦 {totalCadastrados} {totalCadastrados === 1 ? 'presente cadastrado' : 'presentes cadastrados'}
                                  </span>
                                  <span style={{ 
                                    background: totalReservados > 0 ? '#ECFDF5' : '#f1f5f9', 
                                    color: totalReservados > 0 ? '#10B981' : '#475569', 
                                    padding: '0.15rem 0.35rem', 
                                    borderRadius: '4px', 
                                    fontWeight: '700',
                                    fontSize: '0.62rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    🎁 {totalReservados} {totalReservados === 1 ? 'presente reservado' : 'presentes reservados'}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                          {/* Data do Evento e Botão Editar Lista (com ícone Edit2/lápis) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', margin: '0.35rem 0 0.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                              <Calendar size={12} color="var(--text-muted)" />
                              <span>
                                {list.event_date ? new Date(list.event_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date(list.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <button
                              onClick={() => router.push(`/dashboard/${list.slug}/configuracoes`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <Edit2 size={12} />
                              <span>Editar lista</span>
                            </button>
                          </div>

                          {/* Bloco de título e descrição com gap reduzido */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.3rem' }}>
                            <h3 className="list-card-title-heading" style={{ ...styles.listCardTitle, margin: 0 }}>{list.title}</h3>
                            <p style={{ ...styles.listCardDesc, margin: 0 }}>{list.description || 'Sem descrição cadastrada.'}</p>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                            {/* LINHA 1: Gerenciar meus presentes */}
                            <button 
                              onClick={() => router.push(`/dashboard/${list.slug}/meus-presentes`)} 
                              className="btn btn-primary" 
                              style={{ 
                                width: '100%', 
                                fontSize: '0.825rem', 
                                padding: '0.55rem 0.75rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.35rem', 
                                height: '38px', 
                                boxSizing: 'border-box', 
                                whiteSpace: 'nowrap' 
                              }}
                            >
                              <Gift size={14} />
                              <span>Gerenciar meus presentes</span>
                            </button>

                            {/* LINHA 2: Ver presentes reservados */}
                            <button 
                              onClick={() => router.push(`/dashboard/${list.slug}/reservados`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                padding: '0.55rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                width: '100%',
                                height: '38px',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                background: 'transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'var(--transition-smooth)',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <span>Ver presentes reservados</span>
                            </button>

                            {/* LINHA 3: Ver lista de convidados */}
                            <button 
                              onClick={() => router.push(`/dashboard/${list.slug}/lista-convidados`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                padding: '0.55rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                width: '100%',
                                height: '38px',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                background: 'transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'var(--transition-smooth)',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <span>Ver lista de convidados</span>
                            </button>

                            {/* LINHA 4: Compartilhar lista */}
                            <button 
                              onClick={() => copyShareLink(list.slug, list.id)} 
                              className="btn btn-secondary"
                              style={{
                                padding: '0.55rem 0.5rem',
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                height: '38px',
                                width: '100%',
                                boxSizing: 'border-box',
                                position: 'relative'
                              }}
                            >
                              <span>Compartilhar lista</span>
                              <Share size={13} />
                              {copiedId === list.id && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '125%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  background: '#1e293b',
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap',
                                  zIndex: 10,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  animation: 'fade-in 0.15s ease-out',
                                }}>
                                  Link copiado!
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    borderWidth: '4px',
                                    borderStyle: 'solid',
                                    borderColor: '#1e293b transparent transparent transparent'
                                  }} />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: FORMULÁRIO DE LISTA (CRIAR) */}
            {activeView === 'create_list' && (
              <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button onClick={() => setActiveView('lists')} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                  </button>
                  <h2 style={styles.viewTitle}>
                    Criar Nova Lista
                  </h2>
                </div>

                <form onSubmit={saveList} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                  <div className="dashboard-form-columns">

                    {/* COLUNA 1: DADOS DO EVENTO */}
                    <div style={{
                      flex: '1 1 280px',
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px'
                    }}>
                      {/* Nome do Evento */}
                      <div className="form-group">
                        <label htmlFor="title">Nome do Evento</label>
                        <input
                          id="title"
                          type="text"
                          placeholder="Ex: Chá de Bebê da Valentina ou Casamento de Ana & João"
                          className="input-field"
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          value={listTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          required
                        />
                      </div>

                      {/* Data do Evento */}
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

                      {/* Link da Lista */}
                      <div className="form-group">
                        <label htmlFor="slug">Link da Lista (URL amigável)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                          <div style={styles.inputWrapper}>
                            <Globe size={18} style={styles.inputIcon} />
                            <input
                              id="slug"
                              type="text"
                              className="input-field"
                              style={{ 
                                ...styles.inputWithIcon, 
                                background: '#f1f5f9', 
                                cursor: 'not-allowed', 
                                color: '#64748b', 
                                width: '100%', 
                                boxSizing: 'border-box',
                                overflowX: 'auto'
                              }}
                              value={listSlug ? `convitin.com.br/lista/${listSlug}` : 'convitin.com.br/lista/ ...'}
                              readOnly
                              disabled
                            />
                          </div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>
                            Gerado automaticamente a partir do nome do evento. Não editável.
                          </small>
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <label htmlFor="description">Descrição / Mensagem aos Convidados</label>
                        <textarea
                          id="description"
                          placeholder="Ex: Queridos amigos e familiares, criamos essa lista para organizar as ideias de presentes. Agradecemos muito o carinho de todos!"
                          className="input-field"
                          style={{ minHeight: '110px', resize: 'vertical', flex: 1, width: '100%', boxSizing: 'border-box' }}
                          value={listDescription}
                          onChange={(e) => setListDescription(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* COLUNA 2: TEMAS E APARÊNCIA */}
                    <div style={{
                      flex: '1 1 280px',
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px'
                    }}>
                      {/* Tema de Cores */}
                      <div className="form-group">
                        <label style={{ marginBottom: '0.5rem', display: 'block' }}>Tema de Cores</label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                          gap: '0.5rem',
                          width: '100%'
                        }}>
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
                                  transition: 'var(--transition-smooth)',
                                  boxShadow: isSelected ? '0 4px 10px rgba(var(--primary-rgb), 0.12)' : 'none',
                                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                }}
                              >
                                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : '#475569', textAlign: 'center' }}>
                                  {theme.name}
                                </span>
                                
                                {/* Paleta por barras horizontais (Color Hunt Style) */}
                                <div style={{ 
                                  display: 'flex', 
                                  width: '100%', 
                                  maxWidth: '70px', 
                                  height: '24px', 
                                  borderRadius: '6px', 
                                  overflow: 'hidden',
                                  border: '1px solid rgba(0,0,0,0.06)'
                                }}>
                                  {theme.colors.map((color, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        flex: 1,
                                        height: '100%',
                                        background: color,
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Imagem de Capa */}
                      <div className="form-group" style={{ marginBottom: 0 }}>

                        <label>Imagem de Capa | 1200x400px</label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.5rem',
                          marginTop: '0.25rem'
                        }}>
                          {THEMES_DATA[listThemeColor || 'classic']?.banners.map((url, index) => (
                            <div 
                              key={index} 
                              onClick={() => { setListBannerUrl(url); setCustomBannerFile(null); }}
                              style={{
                                height: '55px',
                                borderRadius: '8px',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer',
                                backgroundImage: `url(${url})`,
                                border: listBannerUrl === url && !customBannerFile ? '2px solid var(--primary)' : '2px solid transparent',
                                boxShadow: listBannerUrl === url && !customBannerFile ? '0 4px 8px rgba(var(--primary-rgb), 0.12)' : 'none',
                                transition: 'var(--transition-smooth)',
                              }}
                            />
                          ))}
                        </div>

                        {/* Card Dropzone para Enviar Capa Personalizada */}
                        <div style={{ 
                          marginTop: '0.85rem',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '12px',
                          padding: '1.25rem 1rem',
                          background: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          textAlign: 'center',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
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
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'rgba(79, 70, 229, 0.05)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--primary)'
                          }}>
                            <UploadCloud size={20} />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #cbd5e1' }}
                          >
                            Enviar Capa Personalizada
                          </button>
                          
                          {customBannerFile ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: '700' }}>
                              ✓ {customBannerFile.name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>
                              Formatos sugeridos: JPG, PNG (1200x400px)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preview do Topo */}
                      <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                        <label>Pré visualização do topo da lista</label>
                        <div style={{
                          borderRadius: '12px',
                          border: '1px solid var(--card-border)',
                          overflow: 'hidden',
                          background: '#f8fafc',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{ 
                            height: '100px', 
                            width: '100%', 
                            backgroundImage: `url(${listBannerUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }} />

                          <div style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <h4 className="serif-font" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                              {listTitle || 'Nome da Festa'}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#555555', margin: 0, fontWeight: '400', maxWidth: '300px', lineHeight: 1.3 }}>
                              {listDescription || 'Mensagem aos convidados'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-form-actions">
                    <button type="button" onClick={() => setActiveView('lists')} className="btn btn-secondary dashboard-form-actions-cancel">
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary dashboard-form-actions-save" disabled={listSaveLoading}>
                      {listSaveLoading ? 'Salvando...' : 'Salvar Lista'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL DE FEEDBACK DE SUCESSO (TOAST COM BLUR) */}
      {showSuccessToast && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={{
            padding: '2rem 2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '350px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
            background: 'rgba(255, 255, 255, 0.98)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
            }}>
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              {toastMessage}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              As informações foram salvas com sucesso.
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
      {confirmModalConfig && (
        <div className="dashboard-modal-overlay">
          <div className="glass-card animate-fade-in dashboard-modal-card" style={{
            padding: '2.5rem',
            width: '95%',
            maxWidth: '400px',
            borderRadius: '24px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.5rem',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: confirmModalConfig.isDanger ? '#FEE2E2' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)',
            }}>
              <AlertTriangle size={28} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {confirmModalConfig.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                {confirmModalConfig.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button 
                onClick={() => setConfirmModalConfig(null)} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModalConfig.onConfirm} 
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  background: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)',
                  borderColor: confirmModalConfig.isDanger ? '#EF4444' : 'var(--primary)',
                  color: '#ffffff'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão do Rodapé Fixo de Nova Lista (visível apenas no Mobile quando activeView === 'lists') */}
      {activeView === 'lists' && lists.length > 0 && (
        <div className="lists-actions-mobile-footer animate-fade-in">
          <button onClick={openCreateList} className="btn btn-primary" style={{ width: '100%' }}>
            <Plus size={20} />
            Nova Lista
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
  headerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
    fontSize: '1.125rem',
    fontWeight: '800',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  userName: {
    fontSize: '0.875rem',
  },
  logoutBtn: {
    padding: '0.4rem 1rem',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem',
    width: '100%',
    boxSizing: 'border-box',
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem',
    color: 'var(--text-muted)',
  },
  viewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  },

  viewSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '4rem 2rem',
    background: '#ffffff',
    maxWidth: '550px',
    margin: '3rem auto 0',
  },
  emptyIconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '24px',
    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  listsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
    gap: '2rem',
  },
  listCard: {
    background: '#ffffff',
    overflow: 'hidden',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },

  listCardBanner: {
    height: '110px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  listCardContent: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
  },
  listCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTag: {
    padding: '0.25rem 0.6rem',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  listCardDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  listCardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    lineHeight: 1.3,
  },
  listCardDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    height: '4.9rem',
    minHeight: '4.9rem',
  },
  listCardUrl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: 'var(--primary)',
    fontWeight: '600',
    background: 'rgba(var(--primary-rgb), 0.05)',
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    width: 'fit-content',
  },
  listCardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  presetsWrapper: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    padding: '0.25rem 0',
  },
  presetBannerOption: {
    width: '120px',
    height: '60px',
    borderRadius: '8px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'var(--transition-smooth)',
  },
  fileInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    border: '1px dashed rgba(0,0,0,0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    width: 'fit-content',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    background: 'rgba(255, 255, 255, 0.5)',
  },
  bannerPreviewContainer: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '1rem',
  },
  previewBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: '#ffffff',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: '700',
    zIndex: 2,
  },
  previewBanner: {
    height: '140px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  previewGlassCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    textAlign: 'center',
    maxWidth: '80%',
  },
  giftsViewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  slugTag: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    background: '#e2e8f0',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '500',
  },
  giftsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '2.5rem',
  },
  giftCard: {
    background: '#ffffff',
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
  },
  giftCardImageContainer: {
    width: '100%',
    aspectRatio: '1',
    position: 'relative',
    background: '#ffffff',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '0.75rem',
  },
  giftCardImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
  giftCardPlaceholder: {
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
    maxWidth: '70px',
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
    padding: '1rem',
    zIndex: 3,
  },
  reservedBadge: {
    background: 'var(--success)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  giftCardBody: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
  },
  giftCardTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '38px',
  },
  giftCardPrice: {
    fontSize: '1.125rem',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  giftCardPriceMuted: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    margin: 0,
  },
  giftMarketplaces: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    minHeight: '22px',
  },
  marketTag: {
    fontSize: '0.65rem',
    background: '#f1f5f9',
    color: 'var(--text-muted)',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
    fontWeight: '600',
  },
  giftCardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '0.5rem',
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
  scrapingAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    color: 'var(--primary)',
    fontSize: '0.8rem',
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
};
