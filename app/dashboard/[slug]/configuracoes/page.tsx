'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Gift, ArrowLeft, Loader2, UploadCloud
} from 'lucide-react';

import ThemePicker from './ThemePicker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ListConfigurationsPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<any>(null);

  // Campos de Configuração
  const [listTitle, setListTitle] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listEventType, setListEventType] = useState('birthday');
  const [listThemeColor, setListThemeColor] = useState('base-azul-minimal');
  const [listBannerUrl, setListBannerUrl] = useState('');
  const [listSlug, setListSlug] = useState('');
  const [listEventDate, setListEventDate] = useState('');
  const [allowCompanions, setAllowCompanions] = useState(true);
  const [customBannerFile, setCustomBannerFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listSaveLoading, setListSaveLoading] = useState(false);

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
      setListTitle(listData.title);
      setListDescription(listData.description || '');
      setListEventType(listData.event_type || 'other');
      
      // Mapear tema antigo (classic, champagne, forest, sweet, modern) para novo token slug
      let themeMapping: Record<string, string> = {
        'classic': 'base-azul-minimal',
        'champagne': 'champagne-chic',
        'forest': 'eucalipto-organico',
        'sweet': 'algodao-rosa',
        'modern': 'cyberpunk'
      };
      const activeTheme = themeMapping[listData.theme_color] || listData.theme_color || 'base-azul-minimal';
      setListThemeColor(activeTheme);

      const defaultBanners: Record<string, string[]> = {
        'base-azul-minimal': [
          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop'
        ],
        'algodao-rosa': [
          'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop'
        ],
        'champagne-chic': [
          'https://images.unsplash.com/photo-1507504038482-7621fe583dc5?q=80&w=1200&auto=format&fit=crop'
        ],
        'eucalipto-organico': [
          'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop'
        ],
        'oceano': [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'
        ],
        'pessego': [
          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop'
        ],
        'terracota': [
          'https://images.unsplash.com/photo-1507504038482-7621fe583dc5?q=80&w=1200&auto=format&fit=crop'
        ],
        'grafite': [
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop'
        ],
        'cyberpunk': [
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
        ]
      };
      const fallbackBanner = defaultBanners[activeTheme]?.[0] || defaultBanners['base-azul-minimal'][0];
      setListBannerUrl(listData.banner_url || fallbackBanner);

      setListSlug(listData.slug);
      setListEventDate(listData.event_date || '');
      setAllowCompanions(listData.allow_companions !== false); // default to true
      setLoading(false);
    };

    checkUserAndFetchList();
  }, [slug, router]);

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

  const saveList = async (e: React.FormEvent) => {
    e.preventDefault();
    setListSaveLoading(true);

    try {
      if (!listSlug.trim()) throw new Error('A URL da lista é obrigatória.');

      let finalBannerUrl = listBannerUrl;

      if (customBannerFile) {
        finalBannerUrl = await handleBannerUpload(customBannerFile);
      }

      // Validar slug único
      const { data: existingSlug } = await supabase
        .from('lists')
        .select('id')
        .eq('slug', listSlug)
        .neq('id', selectedList.id);
      
      if (existingSlug && existingSlug.length > 0) {
        throw new Error('Esta URL já está em uso por outra lista. Escolha outro nome.');
      }

      const listData = {
        title: listTitle,
        description: listDescription,
        event_type: listEventType,
        theme_color: listThemeColor,
        banner_url: finalBannerUrl,
        slug: listSlug,
        event_date: listEventDate || null,
        allow_companions: allowCompanions,
      };

      const { error } = await supabase
        .from('lists')
        .update(listData)
        .eq('id', selectedList.id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar a lista.');
    } finally {
      setListSaveLoading(false);
    }
  };

  if (loading || !selectedList) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p>Carregando configurações...</p>
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
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          
          {/* Título e Botão Voltar alinhados na primeira linha, Descrição na segunda linha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.5rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} />
              </Link>
              <h2 style={{ ...styles.viewTitle, margin: 0 }}>Configurações</h2>
            </div>
            <p style={{ ...styles.viewSubtitle, margin: 0 }}>Edite o título, descrição, data e aparência visual da lista.</p>
          </div>

          <form onSubmit={saveList} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', background: '#ffffff', padding: '1rem', borderRadius: '24px' }}>
            <div className="dashboard-form-columns" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>

              {/* COLUNA 1: DADOS DO EVENTO */}
              <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0px' }}>
                <div className="form-group">
                  <label htmlFor="title">Nome do Evento</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="Ex: Chá de Bebê da Valentina"
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
                  <input
                    id="slug"
                    type="text"
                    className="input-field"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={listSlug}
                    onChange={(e) => setListSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: '0 0 1rem 0' }}>
                  <div
                    onClick={() => setAllowCompanions(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer', userSelect: 'none', padding: '0.25rem 0.125rem' }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: allowCompanions ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.3 }}>
                      Permitir acompanhantes na lista de convidados?
                    </span>
                    <div style={{ width: '38px', height: '22px', borderRadius: '11px', background: allowCompanions ? 'var(--primary)' : '#cbd5e1', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '3px', left: allowCompanions ? '19px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descrição / Mensagem aos Convidados</label>
                  <textarea
                    id="description"
                    placeholder="Escreva uma mensagem especial para seus convidados..."
                    className="input-field"
                    style={{ width: '100%', minHeight: '110px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* COLUNA 2: TEMAS */}
              <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0px' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ marginBottom: '0.5rem', display: 'block' }}>Tema de Cores</label>
                  <ThemePicker 
                    value={listThemeColor} 
                    onChange={(newTheme: string) => {
                      setListThemeColor(newTheme);
                      // Usar banners correspondentes aos temas
                      const defaultBanners: Record<string, string[]> = {
                        'base-azul-minimal': [
                          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'algodao-rosa': [
                          'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1488900128323-24ddcef409f7?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'champagne-chic': [
                          'https://images.unsplash.com/photo-1507504038482-7621fe583dc5?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'eucalipto-organico': [
                          'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'oceano': [
                          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'pessego': [
                          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'terracota': [
                          'https://images.unsplash.com/photo-1507504038482-7621fe583dc5?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'grafite': [
                          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'cyberpunk': [
                          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop'
                        ]
                      };
                      const selectedBanners = defaultBanners[newTheme] || defaultBanners['base-azul-minimal'];
                      setListBannerUrl(selectedBanners[0]);
                      setCustomBannerFile(null);
                    }} 
                  />
                </div>

                <div className="form-group">
                  <label>Imagem de Capa | 1200x400px</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {(() => {
                      const defaultBanners: Record<string, string[]> = {
                        'base-azul-minimal': [
                          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'algodao-rosa': [
                          'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1488900128323-24ddcef409f7?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'champagne-chic': [
                          'https://images.unsplash.com/photo-1507504038482-7621fe583dc5?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'eucalipto-organico': [
                          'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'oceano': [
                          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'pessego': [
                          'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'terracota': [
                          'https://images.unsplash.com/photo-1507504038482-7621fe583dc5?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'grafite': [
                          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
                        ],
                        'cyberpunk': [
                          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
                          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop'
                        ]
                      };
                      const activeBanners = defaultBanners[listThemeColor] || defaultBanners['base-azul-minimal'];
                      return activeBanners.map((url, index) => (
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
                          }}
                        />
                      ));
                    })()}
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
              </div>
            </div>

            <div className="dashboard-form-actions">
              <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-secondary dashboard-form-actions-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary dashboard-form-actions-save" disabled={listSaveLoading}>
                {listSaveLoading ? 'Salvando...' : 'Salvar Alterações'}
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
  }
};
