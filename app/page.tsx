'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Gift, Sparkles, Heart, Baby, PartyPopper, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
      }
    };
    checkUser();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header / Navbar */}
      <header style={styles.header}>
        <div style={styles.navContainer}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Gift size={20} color="#ffffff" />
            </div>
            <span style={styles.logoName}>Convitin</span>
          </div>
          <nav style={styles.navLinks}>
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary" style={styles.navBtn}>
                Ir para o Painel
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary" style={styles.navBtn}>
                Entrar / Criar Conta
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main style={styles.main}>
        <section style={styles.heroSection}>
          <div style={styles.badge} className="animate-fade-in">
            <Sparkles size={14} color="var(--primary)" />
            <span>100% Gratuito e Sem Limites</span>
          </div>
          <h1 style={styles.heroTitle} className="serif-font animate-fade-in">
            Crie listas de presentes que <span style={styles.heroHighlight}>realmente funcionam</span>
          </h1>
          <p style={styles.heroDescription} className="animate-fade-in">
            Unifique seus desejos em um único link. Insira produtos da <strong>Amazon</strong>, <strong>Shopee</strong> ou <strong>Mercado Livre</strong> e deixe seus convidados escolherem o que comprar. Sem taxas de resgate, sem intermediários.
          </p>
          <div style={styles.heroButtons} className="animate-fade-in">
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="btn btn-primary" style={styles.ctaBtn}>
              Começar minha Lista Grátis
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* Feature Event Categories Grid */}
        <section style={styles.categoriesSection}>
          <h2 style={styles.sectionTitle} className="serif-font">Personalização para qualquer ocasião</h2>
          <div style={styles.categoriesGrid}>
            <div className="glass-card" style={styles.categoryCard}>
              <div style={{ ...styles.categoryIconCircle, background: 'var(--warning-surface)' }}>
                <Heart size={24} color="var(--warning)" />
              </div>
              <h3 style={styles.categoryName}>Casamentos</h3>
              <p style={styles.categoryDesc}>Design clássico e minimalista com detalhes em champagne para listas de casamento elegantes.</p>
            </div>

            <div className="glass-card" style={styles.categoryCard}>
              <div style={{ ...styles.categoryIconCircle, background: 'var(--info-surface)' }}>
                <Baby size={24} color="var(--info)" />
              </div>
              <h3 style={styles.categoryName}>Chá de Bebê</h3>
              <p style={styles.categoryDesc}>Temas azul, rosa e neutro com cores pastéis fofas. Perfeito para chás de fralda e revelação.</p>
            </div>

            <div className="glass-card" style={styles.categoryCard}>
              <div style={{ ...styles.categoryIconCircle, background: 'var(--danger-surface)' }}>
                <PartyPopper size={24} color="var(--danger)" />
              </div>
              <h3 style={styles.categoryName}>Aniversários</h3>
              <p style={styles.categoryDesc}>Cores festivas e vibrantes para listas de aniversário infantil ou adulto que se destacam.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={styles.stepsSection}>
          <h2 style={styles.sectionTitle} className="serif-font">Como funciona?</h2>
          <div style={styles.stepsGrid}>
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>1</div>
              <h4 style={styles.stepTitle}>Crie sua Lista</h4>
              <p style={styles.stepText}>Cadastre-se, defina o tipo do seu evento e escolha um tema visual lindo, além de colocar sua foto de capa.</p>
            </div>
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>2</div>
              <h4 style={styles.stepTitle}>Insira os Presentes</h4>
              <p style={styles.stepText}>Cole o link do produto. Nosso sistema busca a foto e o título automaticamente para Mercado Livre, Amazon e Shopee.</p>
            </div>
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>3</div>
              <h4 style={styles.stepTitle}>Compartilhe e Acompanhe</h4>
              <p style={styles.stepText}>Envie o link para os convidados. Quando alguém escolhe um item e confirma, a lista atualiza na hora para evitar presentes repetidos.</p>
            </div>
          </div>
        </section>

        {/* Highlight Checklist */}
        <section style={styles.benefitsSection} className="glass-card">
          <div style={styles.benefitsContent}>
            <h2 style={styles.benefitsTitle} className="serif-font">Por que usar o Convitin?</h2>
            <div style={styles.benefitsList}>
              <div style={styles.benefitItem}>
                <CheckCircle2 size={20} color="var(--success)" />
                <span><strong>Links Diretos:</strong> Seus convidados são direcionados para comprar na loja oficial que você escolheu.</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle2 size={20} color="var(--success)" />
                <span><strong>Sem Taxas Ocultas:</strong> Não cobramos comissões nem porcentagens sobre o valor dos presentes.</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle2 size={20} color="var(--success)" />
                <span><strong>Livre de "Click Ghost":</strong> Os botões de compra só aparecem para as lojas com links preenchidos.</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle2 size={20} color="var(--success)" />
                <span><strong>Sincronização em Tempo Real:</strong> Evita que dois convidados comprem o mesmo presente por engano.</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Convitin. Criado com carinho para momentos especiais.</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    width: '100%',
    padding: '1.25rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContainer: {
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
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px var(--primary-soft)',
  },
  logoName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
  },
  navBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '3rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '5rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '3rem 0',
    maxWidth: '800px',
    margin: '0 auto',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '30px',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xs)',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--primary)',
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontSize: '3rem',
    lineHeight: '1.15',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    marginBottom: '1.5rem',
  },
  heroHighlight: {
    color: 'var(--primary)',
    background: 'var(--primary-soft)',
    padding: '0 0.5rem',
    borderRadius: '8px',
  },
  heroDescription: {
    fontSize: '1.125rem',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    marginBottom: '2.5rem',
  },
  heroButtons: {
    display: 'flex',
    gap: '1rem',
  },
  ctaBtn: {
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    borderRadius: '12px',
  },
  categoriesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '2rem',
    textAlign: 'center',
    fontWeight: '700',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    width: '100%',
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  categoryIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: '1.25rem',
    fontWeight: '700',
  },
  categoryDesc: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  },
  stepsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '3rem',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '1rem',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: 'var(--text-inverse)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1.125rem',
    boxShadow: '0 4px 8px var(--primary-soft)',
  },
  stepTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
  },
  stepText: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  },
  benefitsSection: {
    display: 'flex',
    flexDirection: 'column',
    padding: '3rem',
    background: 'var(--surface-elevated)',
  },
  benefitsContent: {
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  benefitsTitle: {
    fontSize: '1.75rem',
    textAlign: 'left',
  },
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    fontSize: '1rem',
    lineHeight: '1.5',
  },
  footer: {
    width: '100%',
    padding: '2.5rem 1.5rem',
    background: 'var(--surface-hover)',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    marginTop: 'auto',
  },
};
