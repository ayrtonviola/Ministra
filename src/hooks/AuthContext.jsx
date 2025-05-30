// src/hooks/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Indica se a sessão inicial está sendo carregada
  const navigate = useNavigate();
  const location = useLocation();

  // Função para buscar o perfil do usuário
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, username, full_name, email, type, updated_at, website, avatar_url, class`) // Certifique-se que 'class' está aqui se for o campo do tipo
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 é 'No Rows In Results', o que pode ser normal para novos usuários
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        setProfile(null); // Se não encontrar perfil, define como null
      }
    } catch (error) {
      console.error("Erro ao carregar perfil no AuthContext:", error.message);
      setProfile(null); // Em caso de erro, garante que o perfil seja null
    }
  }, []); // Dependências vazias, pois não depende de props/state

  useEffect(() => {
    const setupAuthListener = async () => {
      setLoading(true); // Começa carregando

      // Tenta obter a sessão atual imediatamente
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
        // Se já está logado e não está na rota principal, navega para a rota principal
        if (location.pathname === '/login') {
            navigate('/', { replace: true });
        }
      } else {
        setProfile(null);
        // Se não está logado e não está na rota de login, navega para o login
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
      setLoading(false); // Termina o carregamento inicial

      // Adiciona um listener para futuras mudanças de estado de autenticação
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event, 'Session:', session);
          setLoading(true); // Seta loading brevemente para reavaliar a sessão

          if (session) {
            setUser(session.user);
            await fetchProfile(session.user.id);
            if (location.pathname === '/login') {
                navigate('/', { replace: true });
            }
          } else {
            setUser(null);
            setProfile(null);
            if (location.pathname !== '/login') {
              navigate('/login', { replace: true });
            }
          }
          setLoading(false); // Termina o carregamento após o evento
        }
      );

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    };

    const cleanup = setupAuthListener();

    // Retorna a função de limpeza do useEffect
    return () => {
      cleanup.then(unsub => unsub());
    };
  }, [navigate, location.pathname, fetchProfile]); // Adicione fetchProfile como dependência

  const value = {
    user,
    profile,
    loading,
    // Função para login com OTP
    signInWithOtp: async (email) => {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return data;
    },
    // Função para login com senha
    signInWithPassword: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    // Função de logout
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Ao deslogar, limpa o estado local
      setUser(null);
      setProfile(null);
      navigate('/login', { replace: true }); // Redireciona para o login após logout
    },
    // Função para atualizar perfil
    updateProfile: async (updates) => {
      // Importante: Supabase upsert por padrão não retorna os dados atualizados. Adicione .select()
      const { data, error } = await supabase.from('profiles').upsert(updates).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setProfile(data[0]); // Atualiza o perfil no contexto
      }
      return data;
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para consumir o AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};