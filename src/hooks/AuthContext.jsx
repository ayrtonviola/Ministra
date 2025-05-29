// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Ajuste o caminho se necessário
import { useNavigate, useLocation } from 'react-router-dom'; // Importe do react-router-dom

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Indica se a sessão inicial está sendo carregada
  const navigate = useNavigate();
  const location = useLocation(); // Para obter a rota atual

  useEffect(() => {
    // Função para buscar o perfil do usuário
    const fetchProfile = async (userId) => {
      if (!userId) {
        setProfile(null);
        return;
      }
      try {
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`id, username, website, avatar_url, class`)
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
        console.error('Erro ao buscar perfil:', error.message);
        setProfile(null);
      }
    };

    // 1. Tenta obter a sessão inicial do Supabase e configura o listener
    const setupAuthListener = async () => {
      setLoading(true); // Começa carregando

      // Tenta obter a sessão atual imediatamente
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setUser(initialSession?.user || null);
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false); // Termina o carregamento inicial

      // Adiciona um listener para futuras mudanças de estado de autenticação
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event, 'Session:', session);
          setLoading(true); // Brevemente setar carregando para reavaliar a sessão

          if (session) {
            setUser(session.user);
            await fetchProfile(session.user.id);
            // Se o usuário está logado e está na página de login, redireciona para a raiz
            if (location.pathname === '/login') {
                navigate('/');
            }
          } else {
            setUser(null);
            setProfile(null);
            // Se não está logado e não está na página de login, redireciona para o login
            if (location.pathname !== '/login') {
              navigate('/login');
            }
          }
          setLoading(false); // Termina o carregamento após o evento
        }
      );

      // Função de limpeza para o listener
      return () => {
        authListener?.unsubscribe();
      };
    };

    const cleanup = setupAuthListener();

    // Retorna a função de limpeza do useEffect
    return () => {
      cleanup.then(unsub => unsub());
    };
  }, [navigate, location.pathname]); // Dependências para reatividade de roteamento

  const value = {
    user,
    profile,
    loading,
    signInWithOtp: async (email) => {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return data;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Ao deslogar, limpa o estado local
      setUser(null);
      setProfile(null);
      navigate('/login'); // Redireciona para o login após logout
    },
    updateProfile: async (updates) => {
      const { data, error } = await supabase.from('profiles').upsert(updates).select(); // Adicione .select() para retornar os dados atualizados
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};