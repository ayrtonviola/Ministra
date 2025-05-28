// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ... (restante do código)

const useAuth = (toast) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // <-- Estado inicial

  console.log('useAuth: Estado inicial de isLoading:', isLoading); // ADICIONE AQUI

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isLeaderPasswordDialogOpen, setIsLeaderPasswordDialogOpen] = useState(false);

  const fetchUserProfile = useCallback(async (userId, email) => {
    console.log('fetchUserProfile: Buscando perfil para userId:', userId, 'email:', email); // ADICIONE AQUI
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("fetchUserProfile: Erro ao buscar perfil:", error); // ADICIONE AQUI
      toast({ title: "Erro", description: "Não foi possível carregar seu perfil de usuário.", variant: "destructive" });
      return null;
    }

    if (!profile) {
      console.log("fetchUserProfile: Perfil não encontrado para o usuário:", userId, "Retornando estrutura básica."); // ADICIONE AQUI
      return { id: userId, email: email, username: null, full_name: null, type: null };
    }

    console.log("fetchUserProfile: Perfil carregado:", profile); // ADICIONE AQUI
    return profile;
  }, [toast]);

  useEffect(() => {
    console.log('useEffect: Iniciando listener de autenticação e verificação inicial.'); // ADICIONE AQUI

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("onAuthStateChange: Evento de autenticação:", event, "Sessão:", session); // ADICIONE AQUI
        setIsLoading(true);
        console.log("onAuthStateChange: setIsLoading(true)"); // ADICIONE AQUI

        if (session) {
          const user = session.user;
          const profile = await fetchUserProfile(user.id, user.email);
          const userWithProfile = { ...user, ...profile };
          setCurrentUser(userWithProfile);
          console.log("onAuthStateChange: currentUser definido como:", userWithProfile); // ADICIONE AQUI

          if (profile && !profile.type) {
            setIsUserTypeDialogOpen(true);
            console.log("onAuthStateChange: isUserTypeDialogOpen definido como TRUE (perfil sem tipo)."); // ADICIONE AQUI
          } else {
            setIsUserTypeDialogOpen(false);
            console.log("onAuthStateChange: isUserTypeDialogOpen definido como FALSE (perfil já tem tipo ou não encontrado)."); // ADICIONE AQUI
          }

        } else {
          setCurrentUser(null);
          setIsAuthDialogOpen(true);
          setIsUserTypeDialogOpen(false);
          console.log("onAuthStateChange: Nenhuma sessão, isAuthDialogOpen TRUE, isUserTypeDialogOpen FALSE."); // ADICIONE AQUI
        }
        setIsLoading(false);
        console.log("onAuthStateChange: setIsLoading(false)"); // ADICIONE AQUI
      }
    );

    const checkInitialSession = async () => {
      console.log('checkInitialSession: Verificando sessão inicial.'); // ADICIONE AQUI
      setIsLoading(true);
      console.log("checkInitialSession: setIsLoading(true)"); // ADICIONE AQUI

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("checkInitialSession: Erro ao obter sessão inicial:", error); // ADICIONE AQUI
        toast({ title: "Erro de Sessão", description: error.message, variant: "destructive" });
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
      } else if (session) {
        const user = session.user;
        const profile = await fetchUserProfile(user.id, user.email);
        const userWithProfile = { ...user, ...profile };
        setCurrentUser(userWithProfile);
        console.log("checkInitialSession: currentUser definido como:", userWithProfile); // ADICIONE AQUI

        if (profile && !profile.type) {
          setIsUserTypeDialogOpen(true);
          console.log("checkInitialSession: isUserTypeDialogOpen definido como TRUE (perfil sem tipo)."); // ADICIONE AQUI
        } else {
          setIsUserTypeDialogOpen(false);
          console.log("checkInitialSession: isUserTypeDialogOpen definido como FALSE (perfil já tem tipo ou não encontrado)."); // ADICIONE AQUI
        }

      } else {
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
      }
      setIsLoading(false);
      console.log("checkInitialSession: setIsLoading(false)"); // ADICIONE AQUI
    };

    checkInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile, toast]);

  // ... (restante do código, como handleRegister, handleLogin, etc.)

  // NO handleUserTypeSelection, adicione logs também
  const handleUserTypeSelection = useCallback(async (type, username, fullName) => {
    setIsLoading(true);
    console.log("handleUserTypeSelection: setIsLoading(true) - Salvando tipo:", type); // ADICIONE AQUI
    if (!currentUser) {
      console.error("handleUserTypeSelection: Nenhum usuário logado para atualizar."); // ADICIONE AQUI
      toast({ title: "Erro", description: "Nenhum usuário logado para atualizar.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // ... (restante do código)

    try {
      // ...
    } catch (err) {
      console.error("handleUserTypeSelection: Erro inesperado ao salvar perfil:", err); // ADICIONE AQUI
      // ...
    } finally {
      setIsLoading(false);
      console.log("handleUserTypeSelection: setIsLoading(false) - Finalizado."); // ADICIONE AQUI
    }
  }, [currentUser, toast]);


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