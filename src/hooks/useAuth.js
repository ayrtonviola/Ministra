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
      .select('id, username, full_name, email, type, updated_at')  // Só colunas existentes
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é 'No Rows In Results', perfil ainda não existe
      console.error("Erro ao carregar perfil:", error.message);
      toast({ title: "Erro", description: "Não foi possível carregar seu perfil.", variant: "destructive" });
      return null;
    }

    if (!profile) {
      // Retorna um objeto base para um novo usuário sem perfil ainda
      // Isso evita que currentUser seja null após o login, mesmo sem perfil
      return { id: userId, email, username: null, full_name: null, type: null };
    }

    return profile;
  }, [toast]);

  // Efeito para verificar a sessão inicial e configurar o listener de autenticação
  useEffect(() => {
    // Função assíncrona para verificar a sessão inicial (uma vez na montagem)
    const checkAndSetSession = async () => {
      setIsLoading(true);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao obter sessão inicial:", error.message);
          toast({ title: "Erro de Sessão", description: error.message, variant: "destructive" });
          setCurrentUser(null);
          setIsAuthDialogOpen(true);
        } else if (session) {
          const user = session.user;
          const profile = await fetchUserProfile(user.id, user.email);
          const userWithProfile = { ...user, ...profile };
          setCurrentUser(userWithProfile);

          if (profile && !profile.type) {
            setIsUserTypeDialogOpen(true);
          } else {
            setIsUserTypeDialogOpen(false);
            setIsAuthDialogOpen(false);
          }
        } else {
          setCurrentUser(null);
          setIsAuthDialogOpen(true);
        }
      } catch (err) {
        console.error("Erro inesperado na verificação da sessão:", err.message);
        toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao verificar sua sessão.", variant: "destructive" });
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Adiciona listener para mudanças de autenticação
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);

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
              setIsAuthDialogOpen(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setIsAuthDialogOpen(true);
          setIsUserTypeDialogOpen(false);
          toast({ title: "Você saiu com sucesso!", variant: "success" });
        }
        setIsLoading(false);
      }
    );

    // Executa a verificação inicial da sessão
    checkAndSetSession();

    // Cleanup do listener de auth
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserProfile, toast]);

  // Funções de autenticação

  const handleRegister = useCallback(
    async (email, password, username) => {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    },
    [toast, setAuthMode, setIsAuthDialogOpen]
  );

  const handleLogin = useCallback(
    async (email, password) => {
      setIsLoading(true);
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
          setIsAuthDialogOpen(false);
        }
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, fetchUserProfile, setIsAuthDialogOpen]
  );

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ title: "Erro no logout", description: error.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSwitchUser = useCallback(() => {
    toast({ title: "Funcionalidade de troca de usuário", description: "Esta função ainda não foi implementada.", variant: "info" });
  }, [toast]);

  const handleUserTypeSelection = useCallback(
    async (type, username, fullName) => {
      setIsLoading(true);
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
          return;
        }

        setCurrentUser((prev) => ({ ...prev, type, username, full_name: fullName }));
        setIsUserTypeDialogOpen(false);
        toast({ title: "Perfil atualizado", variant: "success" });
      } catch (err) {
        toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
      } finally {
        setIsLoading(false);
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
