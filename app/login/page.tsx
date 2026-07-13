'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Gift, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Por favor, informe seu nome.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) throw error;
        
        // No Supabase, se a confirmação de e-mail estiver ativada, o usuário precisa confirmar.
        // Mas a conta é criada. Mostramos uma mensagem informativa ou logamos direto se não exigir conf.
        if (data.session) {
          router.push('/dashboard');
        } else {
          setSuccessMsg('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <Gift size={32} color="#ffffff" />
          </div>
          <h1 style={styles.logoText}>Convitin</h1>
          <p style={styles.logoSubtext}>Suas listas de presentes em um só lugar</p>
        </div>

        <div style={styles.toggleContainer}>
          <button 
            style={{
              ...styles.toggleBtn, 
              borderBottom: !isSignUp ? '2px solid var(--primary)' : '2px solid transparent',
              color: !isSignUp ? 'var(--primary)' : 'var(--text-muted)'
            }}
            onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Entrar
          </button>
          <button 
            style={{
              ...styles.toggleBtn, 
              borderBottom: isSignUp ? '2px solid var(--primary)' : '2px solid transparent',
              color: isSignUp ? 'var(--primary)' : 'var(--text-muted)'
            }}
            onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Criar Conta
          </button>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={styles.successAlert}>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  id="name"
                  type="text"
                  placeholder="Maria Silva"
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                className="input-field"
                style={styles.inputWithIcon}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="password">Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={styles.inputWithIcon}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? (
              'Carregando...'
            ) : (
              <>
                {isSignUp ? 'Cadastrar e Começar' : 'Entrar no Painel'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footerText}>
          <Sparkles size={14} color="var(--primary)" />
          <span>Crie listas para aniversários, casamentos e chás gratuitamente.</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.2)',
    marginBottom: '1rem',
  },
  logoText: {
    fontSize: '1.875rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    marginBottom: '0.25rem',
  },
  logoSubtext: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  toggleContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    marginBottom: '1.5rem',
  },
  toggleBtn: {
    flex: 1,
    padding: '0.75rem',
    background: 'none',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
  submitBtn: {
    width: '100%',
    padding: '0.875rem',
    fontSize: '1rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderLeft: '4px solid var(--accent)',
    color: '#9f1239',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderLeft: '4px solid var(--success)',
    color: '#065f46',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  footerText: {
    marginTop: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontWeight: '500',
  },
};
