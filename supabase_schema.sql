-- =========================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE SQL EDITOR)
-- Copie e cole este script no SQL Editor do seu projeto Supabase para criar as tabelas e políticas.
-- =========================================================================

-- 1. Habilitar a extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (Profiles)
-- Vinculada automaticamente ao auth.users do Supabase Auth via triggers
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security) em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Permitir leitura pública de perfis" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente quando um usuário se cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'Usuário Convitin')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Tabela de Listas de Presentes (Lists)
CREATE TABLE public.lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'baby_shower', 'birthday', 'bridal_shower', 'other')),
    theme_color TEXT NOT NULL DEFAULT 'classic',
    banner_url TEXT,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em lists
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- Políticas para lists
CREATE POLICY "Permitir leitura pública de listas por slug" ON public.lists
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar suas próprias listas" ON public.lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias listas" ON public.lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias listas" ON public.lists
    FOR DELETE USING (auth.uid() = user_id);


-- 4. Tabela de Presentes (Gifts)
CREATE TABLE public.gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    link_ml TEXT,
    link_shopee TEXT,
    link_amazon TEXT,
    price NUMERIC,
    image_url TEXT,
    is_search_link BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado')),
    reserved_by TEXT,
    reserved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em gifts
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Políticas para gifts
CREATE POLICY "Permitir leitura pública de presentes" ON public.gifts
    FOR SELECT USING (true);

-- Apenas o dono da lista pode inserir/editar/deletar presentes de suas listas
CREATE POLICY "Dono da lista pode gerenciar presentes" ON public.gifts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.lists
            WHERE public.lists.id = public.gifts.list_id
            AND public.lists.user_id = auth.uid()
        )
    );

-- Convidados podem atualizar apenas o status de reserva dos presentes (reserva / cancelamento de reserva)
CREATE POLICY "Convidados podem reservar presentes" ON public.gifts
    FOR UPDATE USING (true)
    WITH CHECK (
        -- Garante que convidados só alterem os campos de reserva
        (status = 'reservado' AND reserved_by IS NOT NULL AND reserved_at IS NOT NULL) OR
        (status = 'disponivel' AND reserved_by IS NULL AND reserved_at IS NULL)
    );


-- 5. Ativar replicação em tempo real (Realtime) para atualizar reservas na tela instantaneamente
ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;

-- MIGRATION: Adicionar coluna de data do evento na tabela de listas
ALTER TABLE public.lists ADD COLUMN event_date DATE;
