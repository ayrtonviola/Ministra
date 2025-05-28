// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const useAuth = (toast) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
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

    if (error && error.code !== 'PGRST116') {
      toast({ title: "Erro", description: "Não foi possível carregar seu perfil.", variant: "destructive" });
      return null;
    }

    if (!profile) {
      return { id: userId, email, username: null, full_name: null, type: null };
    }

    return profile;
  }, [toast]);

  // Listener de autenticação
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);

        if (session) {
          const user = session.user;
          const profile = await fetchUserProfile(user.id, user.email);
          const userWithProfile = { ...user, ...profile };
          setCurrentUser(userWithProfile);

          if (profile && !profile.type) {
            setIsUserTypeDialogOpen(true);
          } else {
            setIsUserTypeDialogOpen(false);
          }
        } else {
          setCurrentUser(null);
          setIsAuthDialogOpen(true);
          setIsUserTypeDialogOpen(false);
        }

        setIsLoading(false);
      }
    );

    const checkInitialSession = async () => {
      setIsLoading(true);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
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
        }
      } else {
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
      }
      setIsLoading(false);
    };

    checkInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile, toast]);

  // Cadastro
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

  // Login
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

  // Logout
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ title: "Erro no logout", description: error.message, variant: "destructive" });
      } else {
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, setIsAuthDialogOpen]);

  // Switch User (placeholder, ajuste conforme sua lógica)
  const handleSwitchUser = useCallback(() => {
    // Lógica para troca de usuário
  }, []);

  // Seleção de tipo do usuário
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

  // Confirmação da senha do líder (placeholder)
  const handleLeaderPasswordConfirm = useCallback(() => {
    // Sua lógica aqui
  }, []);

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
