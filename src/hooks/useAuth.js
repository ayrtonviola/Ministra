// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ajuste o caminho se necessário

const useAuth = (toast) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); // A ser populado em algum lugar
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isLeaderPasswordDialogOpen, setIsLeaderPasswordDialogOpen] = useState(false);

  // Busca perfil no supabase
  const fetchUserProfile = useCallback(async (userId, email) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é 'No Rows In Results', que significa que o perfil não existe ainda
      console.error("Erro ao carregar perfil:", error.message);
      toast({ title: "Erro", description: "Não foi possível carregar seu perfil.", variant: "destructive" });
      return null;
    }

    if (!profile) {
      // Retorna um objeto base para um novo usuário sem perfil ainda
      // Isso é importante para que o currentUser não seja null após o login, mesmo sem perfil
      return { id: userId, email, username: null, full_name: null, type: null };
    }

    return profile;
  }, [toast]);

  // Efeito para verificar a sessão inicial e configurar o listener de autenticação
  useEffect(() => {
    // 1. Função assíncrona para verificar a sessão inicial (rodada uma vez na montagem)
    const checkAndSetSession = async () => {
      setIsLoading(true); // Inicia carregamento para a verificação inicial

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao obter sessão inicial:", error.message);
          toast({ title: "Erro de Sessão", description: error.message, variant: "destructive" });
          setCurrentUser(null);
          setIsAuthDialogOpen(true); // Abre diálogo de auth se erro de sessão
        } else if (session) {
          const user = session.user;
          const profile = await fetchUserProfile(user.id, user.email);
          const userWithProfile = { ...user, ...profile };
          setCurrentUser(userWithProfile);

          if (profile && !profile.type) {
            setIsUserTypeDialogOpen(true); // Abre diálogo de tipo se o perfil não tiver tipo
          } else {
            setIsUserTypeDialogOpen(false);
            setIsAuthDialogOpen(false); // Fecha diálogo de auth se logado e com tipo
          }
        } else {
          setCurrentUser(null);
          setIsAuthDialogOpen(true); // Abre diálogo de auth se não houver sessão
        }
      } catch (err) {
        console.error("Erro inesperado na verificação da sessão:", err.message);
        toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao verificar sua sessão.", variant: "destructive" });
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
      } finally {
        setIsLoading(false); // SEMPRE define isLoading como false ao final da verificação inicial
      }
    };

    // 2. Adiciona o listener para futuras mudanças de estado de autenticação (eventos como login, logout, etc.)
    // A destruturação aqui está correta para pegar o 'subscription'
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Esta callback é acionada por eventos. O `isLoading` deve ser gerenciado para cada evento.
        // Se um evento ocorre, geralmente estamos esperando alguma ação.
        setIsLoading(true); // Setar isLoading para true para o processamento do evento

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session) {
            const user = session.user;
            const profile = await fetchUserProfile(user.id, user.email);
            const userWithProfile = { ...user, ...profile };
            setCurrentUser(userWithProfile);

            if (profile && !profile.type) {
              setIsUserTypeDialogOpen(true);
            } else {
              setIsUserTypeDialogOpen(false);
              setIsAuthDialogOpen(false); // Fecha diálogo de auth se logado e com tipo
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setIsAuthDialogOpen(true); // Abre diálogo de auth após logout
          setIsUserTypeDialogOpen(false); // Garante que o diálogo de tipo está fechado
          toast({ title: "Você saiu com sucesso!", variant: "success" }); // Mensagem de logout aqui
        }
        setIsLoading(false); // Define isLoading como false após o evento ser processado
      }
    );

    // Chama a função para verificar a sessão inicial uma vez na montagem do componente
    checkAndSetSession();

    // Retorna a função de limpeza para o listener
    return () => {
      // Isso está correto para desinscrever o listener de autenticação
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserProfile, toast]); // fetchUserProfile é uma dependência correta aqui

  // Funções de Autenticação (handleRegister, handleLogin, handleLogout, handleUserTypeSelection)
  // Removi os setIsLoading internos e confiei no fluxo do useEffect principal para o loading.
  // No entanto, para ações diretas (botões), um setIsLoading(true/false) É RECOMENDADO
  // no `try...finally` de cada uma dessas funções, pois elas são chamadas por interação do usuário.

  // Re-adicionando setIsLoading nos handlers para melhor UX
  const handleRegister = useCallback(
    async (email, password, username) => {
      setIsLoading(true); // Inicia loading para a operação de registro
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
          return;
        }

        if (data?.user) {
          const userId = data.user.id;
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email, username }]);

          if (profileError) {
            toast({ title: "Erro ao salvar perfil", description: profileError.message, variant: "destructive" });
            return;
          }

          toast({ title: "Cadastro realizado", description: "Você pode fazer login agora.", variant: "success" });
          setAuthMode('login');
          setIsAuthDialogOpen(true);
        }
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      } finally {
        setIsLoading(false); // Finaliza loading
      }
    },
    [toast, setAuthMode, setIsAuthDialogOpen]
  );

  const handleLogin = useCallback(
    async (email, password) => {
      setIsLoading(true); // Inicia loading para a operação de login
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          toast({ title: "Erro no login", description: error.message, variant: "destructive" });
          return;
        }

        if (data?.user) {
          const profile = await fetchUserProfile(data.user.id, data.user.email);
          const userWithProfile = { ...data.user, ...profile };
          setCurrentUser(userWithProfile);
          setIsAuthDialogOpen(false); // Fecha o modal de autenticação após login
        }
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      } finally {
        setIsLoading(false); // Finaliza loading
      }
    },
    [toast, fetchUserProfile, setIsAuthDialogOpen]
  );

  const handleLogout = useCallback(async () => {
    setIsLoading(true); // Inicia loading para a operação de logout
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ title: "Erro no logout", description: error.message, variant: "destructive" });
      } else {
        // O onAuthStateChange com 'SIGNED_OUT' vai cuidar de setCurrentUser(null) e setIsAuthDialogOpen(true)
        // A mensagem de toast para logout já está lá no listener do useEffect.
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsLoading(false); // Finaliza loading
    }
  }, [toast]); // Não precisa de setIsAuthDialogOpen aqui, o listener cuida

  const handleSwitchUser = useCallback(() => {
    toast({ title: "Funcionalidade de troca de usuário", description: "Esta função ainda não foi implementada.", variant: "info" });
  }, [toast]);

  const handleUserTypeSelection = useCallback(
    async (type, username, fullName) => {
      setIsLoading(true); // Inicia loading para a operação de seleção de tipo
      if (!currentUser) {
        toast({ title: "Erro", description: "Nenhum usuário logado para atualizar.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      try {
        const updates = {
          id: currentUser.id,
          type,
          username,
          full_name: fullName,
          updated_at: new Date(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
          toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
          return; // Não finaliza loading aqui, o finally fará isso
        }

        setCurrentUser((prev) => ({ ...prev, type, username, full_name: fullName }));
        setIsUserTypeDialogOpen(false);
        toast({ title: "Perfil atualizado", variant: "success" });
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      } finally {
        setIsLoading(false); // Finaliza loading
      }
    },
    [currentUser, toast]
  );

  const handleLeaderPasswordConfirm = useCallback(() => {
    toast({ title: "Confirmação de senha do líder", description: "Esta função ainda não foi implementada.", variant: "info" });
  }, [toast]);

  return {
    currentUser,
    allRegisteredUsers,
    isLoading,
    isAuthDialogOpen,
    authMode,
    isUserTypeDialogOpen,
    isLeaderPasswordDialogOpen,
    handleRegister,
    handleLogin,
    handleUserTypeSelection,
    handleLeaderPasswordConfirm,
    handleLogout,
    handleSwitchUser,
    setIsAuthDialogOpen,
    setAuthMode,
    setIsUserTypeDialogOpen,
    setIsLeaderPasswordDialogOpen,
    setAllRegisteredUsers
  };
};

export default useAuth;