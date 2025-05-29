// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ajuste o caminho se necessário

const useAuth = (toast) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); // Ainda não vejo onde isso é populado
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isLeaderPasswordDialogOpen, setIsLeaderPasswordDialogOpen] = useState(false);

  // Busca perfil no supabase - SEM MUDANÇAS AQUI
  const fetchUserProfile = useCallback(async (userId, email) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é 'No Rows In Results', que significa que o perfil não existe ainda
      toast({ title: "Erro", description: "Não foi possível carregar seu perfil.", variant: "destructive" });
      return null;
    }

    if (!profile) {
      // Retorna um objeto base para um novo usuário sem perfil ainda
      return { id: userId, email, username: null, full_name: null, type: null };
    }

    return profile;
  }, [toast]);

  // Efeito para verificar a sessão inicial e configurar o listener de autenticação
  useEffect(() => {
    // Função assíncrona para verificar a sessão inicial
    const checkAndSetSession = async () => {
      setIsLoading(true); // Inicia carregamento ao verificar a sessão

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
        setIsLoading(false); // SEMPRE define isLoading como false ao final
      }
    };

    // Adiciona o listener para futuras mudanças de estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ao invés de setIsLoading(true) a cada evento, reagimos ao novo estado.
        // O `isLoading` já foi definido pela `checkAndSetSession`.
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
        }
        // Não precisamos setar isLoading(false) aqui, pois o initial check já cuida disso
        // e o App.jsx já gerencia o loading baseado no estado de `currentUser` e `isAuthDialogOpen`
      }
    );

    // Chama a função para verificar a sessão inicial uma vez
    checkAndSetSession();

    // Retorna a função de limpeza para o listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile, toast]); // Adicione fetchUserProfile como dependência

  // Cadastro - SEM MUDANÇAS RELEVANTES, APENAS REMOÇÃO DO setIsLoading(true/false) interno
  const handleRegister = useCallback(
    async (email, password, username) => {
      // Não manipule setIsLoading aqui, a chamada inicial já cobre o loading
      // O `App.jsx` já mostra o loader
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
      }
    },
    [toast, setAuthMode, setIsAuthDialogOpen]
  );

  // Login - SEM MUDANÇAS RELEVANTES, APENAS REMOÇÃO DO setIsLoading(true/false) interno
  const handleLogin = useCallback(
    async (email, password) => {
      // Não manipule setIsLoading aqui, a chamada inicial já cobre o loading
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
          // A lógica de isUserTypeDialogOpen será acionada pelo onAuthStateChange ou pelo useEffect principal
        }
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      }
    },
    [toast, fetchUserProfile, setIsAuthDialogOpen]
  );

  // Logout - SEM MUDANÇAS RELEVANTES, APENAS REMOÇÃO DO setIsLoading(true/false) interno
  const handleLogout = useCallback(async () => {
    // Não manipule setIsLoading aqui
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ title: "Erro no logout", description: error.message, variant: "destructive" });
      } else {
        // o onAuthStateChange com 'SIGNED_OUT' vai cuidar de setCurrentUser(null) e setIsAuthDialogOpen(true)
        toast({ title: "Você saiu com sucesso!", variant: "success" });
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
    }
  }, [toast]);

  // Switch User (placeholder, ajuste conforme sua lógica)
  const handleSwitchUser = useCallback(() => {
    // Lógica para troca de usuário
    toast({ title: "Funcionalidade de troca de usuário", description: "Esta função ainda não foi implementada.", variant: "info" });
  }, [toast]);

  // Seleção de tipo do usuário - SEM MUDANÇAS RELEVANTES, APENAS REMOÇÃO DO setIsLoading(true/false) interno
  const handleUserTypeSelection = useCallback(
    async (type, username, fullName) => {
      // Não manipule setIsLoading aqui
      if (!currentUser) {
        toast({ title: "Erro", description: "Nenhum usuário logado para atualizar.", variant: "destructive" });
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
          return;
        }

        // Atualiza o currentUser no estado do hook para refletir as mudanças
        setCurrentUser((prev) => ({ ...prev, type, username, full_name: fullName }));
        setIsUserTypeDialogOpen(false); // Fecha o modal de tipo
        toast({ title: "Perfil atualizado", variant: "success" });
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      }
    },
    [currentUser, toast]
  );

  // Confirmação da senha do líder (placeholder)
  const handleLeaderPasswordConfirm = useCallback(() => {
    // Sua lógica aqui
    toast({ title: "Confirmação de senha do líder", description: "Esta função ainda não foi implementada.", variant: "info" });
  }, [toast]);

  return {
    currentUser,
    allRegisteredUsers,
    isLoading, // Este isLoading agora deve funcionar de forma mais consistente
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
    setAllRegisteredUsers // Ainda não vejo onde isso é usado/populado
  };
};

export default useAuth;