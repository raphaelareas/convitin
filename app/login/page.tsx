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

  // Mapear erros em inglês para português
  const translateError = (msg: string) => {
    if (!msg) return '';
    const m = msg.toLowerCase();
    if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (m.includes('user already registered')) return 'Este e-mail já está cadastrado.';
    if (m.includes('password should be at least')) return 'A senha deve conter no mínimo 6 caracteres.';
    if (m.includes('signup disabled')) return 'Cadastro temporariamente indisponível.';
    if (m.includes('email not confirmed')) return 'Por favor, confirme seu e-mail antes de acessar.';
    if (m.includes('invalid signup')) return 'Os dados de cadastro fornecidos são inválidos.';
    if (m.includes('token has expired') || m.includes('otp expired')) return 'O código informado expirou. Solicite um novo.';
    if (m.includes('invalid grant') || m.includes('invalid token')) return 'Código de verificação incorreto ou inválido.';
    return msg;
  };

  const [activeView, setActiveView] = useState<'login' | 'signUp' | 'recover' | 'reset'>('login');
  const [resetCode, setResetCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    // Se o hash contém informações de recuperação (quando clica no link do email do Supabase)
    // O Supabase pode lidar com isso. Mas para o fluxo de código OTP inserido direto na tela de recuperação,
    // nós cuidamos disso manualmente no formulário.
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && activeView !== 'reset') {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router, activeView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (activeView === 'signUp') {
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
        
        if (data.session) {
          router.push('/dashboard');
        } else {
          setSuccessMsg('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta.');
        }
      } else if (activeView === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push('/dashboard');
      } else if (activeView === 'recover') {
        // Envia código de recuperação de senha por email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login', // Fallback, mas usaremos fluxo de Código OTP na tela
        });
        if (error) throw error;

        setSuccessMsg('Código de recuperação enviado para o seu e-mail! Verifique sua caixa de entrada.');
        setActiveView('reset'); // Vai para a tela de digitar o código e nova senha
      } else if (activeView === 'reset') {
        // Fluxo de verificação de código OTP e redefinição de senha
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        if (password.length < 6) {
          throw new Error('A senha deve conter no mínimo 6 caracteres.');
        }

        // 1. Verificar OTP de recuperação de senha
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: resetCode,
          type: 'recovery',
        });
        if (verifyError) throw verifyError;

        // 2. Atualizar a senha
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });
        if (updateError) throw updateError;

        setSuccessMsg('Senha alterada com sucesso! Redirecionando para o painel...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(translateError(err.message || 'Ocorreu um erro ao processar sua solicitação.'));
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

        {activeView !== 'recover' && activeView !== 'reset' && (
          <div style={styles.toggleContainer}>
            <button 
              style={{
                ...styles.toggleBtn, 
                borderBottom: activeView === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeView === 'login' ? 'var(--primary)' : 'var(--text-muted)'
              }}
              onClick={() => { setActiveView('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              Entrar
            </button>
            <button 
              style={{
                ...styles.toggleBtn, 
                borderBottom: activeView === 'signUp' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeView === 'signUp' ? 'var(--primary)' : 'var(--text-muted)'
              }}
              onClick={() => { setActiveView('signUp'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              Criar Conta
            </button>
          </div>
        )}

        {activeView === 'recover' && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Recuperar Senha</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Insira seu e-mail para receber o código de verificação.</p>
          </div>
        )}

        {activeView === 'reset' && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Definir Nova Senha</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preencha o código enviado ao seu e-mail e sua nova senha.</p>
          </div>
        )}

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
          {activeView === 'signUp' && (
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
                  required={activeView === 'signUp'}
                />
              </div>
            </div>
          )}

          {activeView !== 'reset' && (
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
          )}

          {activeView === 'reset' && (
            <div className="form-group">
              <label htmlFor="resetCode">Código de Verificação</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="resetCode"
                  type="text"
                  placeholder="Código de 6 dígitos"
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required={activeView === 'reset'}
                />
              </div>
            </div>
          )}

          {activeView !== 'recover' && (
            <div className="form-group" style={{ marginBottom: activeView === 'login' ? '0.5rem' : '1.5rem' }}>
              <label htmlFor="password">{activeView === 'reset' ? 'Nova Senha' : 'Senha'}</label>
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
                  required={(activeView as string) !== 'recover'}
                />
              </div>
            </div>
          )}

          {activeView === 'reset' && (
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  style={styles.inputWithIcon}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={activeView === 'reset'}
                />
              </div>
            </div>
          )}

          {activeView === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => { setActiveView('recover'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

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
                {activeView === 'login' && 'Entrar no Painel'}
                {activeView === 'signUp' && 'Cadastrar e Começar'}
                {activeView === 'recover' && 'Enviar Código'}
                {activeView === 'reset' && 'Alterar Senha'}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {(activeView === 'recover' || activeView === 'reset') && (
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => { setActiveView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Voltar para o Login
              </button>
            </div>
          )}
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
