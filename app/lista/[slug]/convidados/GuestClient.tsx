'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Gift, Heart, ArrowRight, LogOut, Users, CheckCircle2, Loader2, Minus, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GuestClientProps {
  list: any;
}

export default function GuestClient({ list }: GuestClientProps) {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [hasCompanion, setHasCompanion] = useState(false);
  const [companions, setCompanions] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const storageKey = `convitin_rsvp_${list.id}`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session ? session.user : null);
    });
    // Verificar se ja confirmou
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setAlreadyConfirmed(true);
    } catch {}
    return () => subscription.unsubscribe();
  }, [list.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setShowValidation(true); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('guests').insert([{
        list_id: list.id,
        name: name.trim(),
        companions: hasCompanion ? companions : 0,
      }]);

      if (error) throw error;

      // Salvar no localStorage
      localStorage.setItem(storageKey, JSON.stringify({ name: name.trim(), companions: hasCompanion ? companions : 0, confirmedAt: new Date().toISOString() }));

      setSubmitted(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['var(--primary)', '#10b981', '#f59e0b', '#f43f5e', '#a7f3d0'] });
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar presenca.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRSVP = async () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const entry = JSON.parse(stored);
      // Remove do banco pelo nome (trust-based, sem login)
      await supabase.from('guests').delete().eq('list_id', list.id).eq('name', entry.name);
      localStorage.removeItem(storageKey);
      setAlreadyConfirmed(false);
      setSubmitted(false);
      setName('');
      setHasCompanion(false);
      setCompanions(1);
    } catch {
      localStorage.removeItem(storageKey);
      setAlreadyConfirmed(false);
      setSubmitted(false);
    }
  };

  const eventDate = list.event_date
    ? new Date(list.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className={`theme-${list.theme_color}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, var(--background-start) 0%, var(--background-end) 100%)', backgroundAttachment: 'fixed', fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Convitin</span>
          </Link>
          {user ? (
            <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', padding: '0.5rem 0.85rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.06)', background: '#ffffff', color: 'var(--text-main)' }}>
              <LogOut size={15} /> Logout
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
              Crie sua lista gratis <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </header>

      {/* Banner — mesmo padrão da lista principal */}
      <div className="public-list-banner-wrapper" style={{ width: '100%', background: 'transparent' }}>
        <div
          className="public-list-banner-el"
          style={{
            backgroundImage: list.banner_url ? `url(${list.banner_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            width: '100%',
          }}
        />
      </div>

      {/* Título e descrição do evento diretamente sobre o fundo */}
      <div className="container" style={{ maxWidth: '550px', margin: '1.5rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
        {eventDate && (
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', background: 'var(--button-bg)', padding: '0.35rem 0.85rem', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {eventDate}
          </span>
        )}
        <h1 style={{ fontWeight: '800', color: 'var(--text-main)', margin: '0.2rem 0 0', lineHeight: 1.1, fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>
          {list.title}
        </h1>
        {list.description && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, maxWidth: '440px', lineHeight: 1.4, fontWeight: '600' }}>{list.description}</p>
        )}
      </div>

      {/* Formulario / Estado de sucesso */}
      <div style={{ maxWidth: '550px', margin: '1.25rem auto 0', padding: '0 1.5rem 1.5rem', width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 10 }}>

        {submitted || alreadyConfirmed ? (
          /* Estado de sucesso / ja confirmou */
          <div className="glass-card animate-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} color="#10B981" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Presenca confirmada! 🎉
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              {alreadyConfirmed && !submitted
                ? 'Voce ja confirmou sua presenca neste evento.'
                : 'Sua presenca foi registrada com sucesso. Nos vemos em breve!'}
            </p>
            <button
              onClick={handleCancelRSVP}
              style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancelar minha confirmacao
            </button>
          </div>
        ) : (
          /* Formulario de RSVP */
          <div className="glass-card animate-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <Users size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>Confirmação de Presença</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nome e Sobrenome */}
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="guestName" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Nome e Sobrenome
                </label>
                <input
                  id="guestName"
                  type="text"
                  placeholder="Maria Silva"
                  className="input-field"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setShowValidation(false); }}
                  style={{ border: showValidation && !name.trim() ? '1.5px solid #ef4444' : undefined }}
                />
                {showValidation && !name.trim() && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '4px 0 0' }}>Por favor, informe seu nome.</p>
                )}
              </div>

              {/* Toggle: vai levar acompanhante? */}
              <div className="form-group" style={{ margin: 0 }}>
                <div
                  onClick={() => setHasCompanion(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer', userSelect: 'none', padding: '0 0.125rem' }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: hasCompanion ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.3 }}>
                    Vai levar acompanhante?
                  </span>
                  <div style={{ width: '38px', height: '22px', borderRadius: '11px', background: hasCompanion ? 'var(--primary)' : '#cbd5e1', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '3px', left: hasCompanion ? '19px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>

              {/* Seletor de quantidade de acompanhantes */}
              {hasCompanion && (
                <div className="form-group animate-fade-in" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
                    Quantos acompanhantes?
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setCompanions(v => Math.max(1, v - 1))}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--card-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 }}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={companions}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') { setCompanions(1); return; }
                        const n = parseInt(val);
                        if (!isNaN(n)) setCompanions(Math.min(20, Math.max(1, n)));
                      }}
                      onBlur={() => { if (!companions || companions < 1) setCompanions(1); }}
                      className="input-field no-spinners"
                      style={{ width: '70px', textAlign: 'center', padding: '0.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setCompanions(v => Math.min(20, v + 1))}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--card-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 }}
                    >
                      <Plus size={16} />
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {companions === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>
                </div>
              )}

              {/* Botao de confirmar */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Confirmando...</>
                ) : (
                  <><CheckCircle2 size={18} /> Confirmar Presenca</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
        Feito com ❤️ no{' '}
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Convitin</Link>
      </div>
    </div>
  );
}