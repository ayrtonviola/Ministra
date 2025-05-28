// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
// REMOVA: import { simpleHash } from '@/lib/utils'; // Esta linha será removida

// IMPORTAR O CLIENTE SUPABASE
import { supabase } from '@/lib/supabaseClient'; // Certifique-se que você tem este arquivo ou importe de onde seu cliente Supabase é inicializado

// ... (restante do código, como userTypes)

const useAuth = (toast) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); // Ainda manteremos para gerenciamento de perfis na UI
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isLeaderPasswordDialogOpen, setIsLeaderPasswordDialogOpen] = useState(false);

  // NOVO: Função para buscar o perfil do Supabase
  const fetchUserProfile = useCallback(async (userId, email) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 é "No rows found", que é esperado se o perfil ainda não foi criado
      console.error("Error fetching user profile:", error);
      toast({ title: "Erro", description: "Não foi possível carregar seu perfil de usuário.", variant: "destructive" });
      return null;
    }

    if (profile) {
      return { id: profile.id, name: profile.full_name, email: profile.email, type: profile.type };
    } else {
      // Perfil não encontrado, retornar um usuário básico com email e ID
      return { id: userId, name: null, email: email, type: null };
    }
  }, [toast]);

  // Modificado para lidar com autenticação Supabase
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session) {
        // Usuário logado, buscar perfil
        const user = await fetchUserProfile(session.user.id, session.user.email);
        setCurrentUser(user);
        setIsAuthDialogOpen(false); // Fechar o diálogo de autenticação
        // Se o tipo de usuário não estiver definido, abrir UserTypeDialog
        if (user && !user.type) {
          setIsUserTypeDialogOpen(true);
        }
      } else {
        // Usuário deslogado
        setCurrentUser(null);
        setIsAuthDialogOpen(true); // Abrir o diálogo de autenticação
        setAuthMode('login');
      }
      setIsLoading(false);
    });

    // Tentar buscar a sessão inicial
    const getSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = await fetchUserProfile(session.user.id, session.user.email);
        setCurrentUser(user);
        if (user && !user.type) {
          setIsUserTypeDialogOpen(true);
        }
      } else {
        setCurrentUser(null);
        setIsAuthDialogOpen(true);
        setAuthMode('login');
      }
      setIsLoading(false);
    };

    getSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // Adicionado fetchUserProfile como dependência

  // NOVO: Função para carregar todos os perfis do Supabase para o UserManagementModule
  const loadAllUserProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*'); // Seleciona todos os campos, incluindo o email

    if (error) {
      console.error("Error loading all user profiles:", error);
      toast({ title: "Erro", description: "Não foi possível carregar a lista de usuários.", variant: "destructive" });
      return [];
    }
    // Mapear para o formato esperado pelo `allRegisteredUsers` se houver alguma diferença
    return data.map(profile => ({
      id: profile.id,
      name: profile.full_name,
      username: profile.username, // Manter username se ainda usar para exibição em algum lugar
      email: profile.email, // Adicionar o email real
      type: profile.type
    }));
  }, [toast]);

  useEffect(() => {
    if (!isLoading && currentUser?.type === 'leader') { // Carregar usuários apenas se for líder e não estiver carregando
      loadAllUserProfiles().then(setAllRegisteredUsers);
    } else if (!currentUser) {
      // Limpar a lista se não houver usuário ou não for líder
      setAllRegisteredUsers([]);
    }
  }, [isLoading, currentUser, loadAllUserProfiles]);


  // Função de Registro (handleRegister) - ATUALIZADA
  const handleRegister = useCallback(async (fullName, email, password) => { // Recebe email real
    setIsLoading(true);
    try {
      // 1. Verificar se o e-mail já está em uso via Supabase Auth
      // (O Supabase Auth já faz isso automaticamente com o signUp, mas podemos adicionar um check antes)
      const { data: existingUser, error: existingUserError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        toast({ title: "Email já Cadastrado", description: "Este email já está em uso.", variant: "destructive" });
        setIsLoading(false);
        return false;
      }

      // 2. Registrar no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError) {
        console.error("Registration error:", signUpError);
        toast({ title: "Erro no Cadastro", description: signUpError.message, variant: "destructive" });
        setIsLoading(false);
        return false;
      }

      const user = data.user;

      // 3. Criar perfil no banco de dados 'profiles'
      // A coluna 'username' na tabela 'profiles' pode ser removida ou usada para algo opcional,
      // mas o 'email' será o identificador principal.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          email: email, // Armazenar o email real
          username: null, // Definir como null ou remover da tabela se não for usar
          type: null,
        })
        .select(); // Retornar os dados inseridos

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Se o perfil falhar, talvez seja necessário tentar reverter o signUp ou limpar o usuário Supabase
        // Mas o Supabase Auth geralmente lida com isso se a transação falhar.
        toast({ title: "Erro no Perfil", description: "Não foi possível criar seu perfil de usuário.", variant: "destructive" });
        setIsLoading(false);
        return false;
      }

      const newProfile = profileData[0]; // Pega o primeiro (e único) item retornado
      const newUser = { id: user.id, name: newProfile.full_name, email: newProfile.email, type: newProfile.type };
      setCurrentUser(newUser);

      toast({ title: "Cadastro Concluído!", description: "Sua conta foi criada com sucesso.", duration: 3000 });
      setIsAuthDialogOpen(false);
      setIsUserTypeDialogOpen(true); // Abrir diálogo de tipo de usuário
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Unexpected error during registration:", err);
      toast({ title: "Erro Inesperado", description: "Ocorreu um erro inesperado durante o cadastro.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  }, [toast]);

  // Função de Login (handleLogin) - ATUALIZADA
  const handleLogin = useCallback(async (email, password) => { // Recebe email real
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Login error:", error);
        toast({ title: "Erro no Login", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return false;
      }

      const user = data.user;
      const userProfile = await fetchUserProfile(user.id, user.email); // Usar a nova função
      if (userProfile) {
        setCurrentUser(userProfile);
        toast({ title: "Login Bem-sucedido", description: `Bem-vindo, ${userProfile.name || userProfile.email}!`, duration: 3000 });
        setIsAuthDialogOpen(false);
        if (!userProfile.type) {
          setIsUserTypeDialogOpen(true); // Abrir diálogo de tipo de usuário se o tipo não estiver definido
        }
      } else {
        // Este caso não deve acontecer se fetchUserProfile funcionar corretamente, mas para segurança
        toast({ title: "Erro no Perfil", description: "Não foi possível carregar seu perfil após o login.", variant: "destructive" });
        setCurrentUser(null);
      }
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Unexpected error during login:", err);
      toast({ title: "Erro Inesperado", description: "Ocorreu um erro inesperado durante o login.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  }, [toast, fetchUserProfile]);

  // handleUserTypeSelection - ATUALIZADA
  const handleUserTypeSelection = useCallback(async (type) => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ type: type })
          .eq('id', currentUser.id)
          .select() // Retorna os dados atualizados
          .single();

        if (error) {
          console.error("Error updating user type:", error);
          toast({ title: "Erro", description: "Não foi possível definir seu tipo de usuário.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const updatedUser = { ...currentUser, type: data.type };
        setCurrentUser(updatedUser);
        // Atualizar allRegisteredUsers também
        setAllRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

        if (type === 'leader') {
          setIsLeaderPasswordDialogOpen(true); // Abrir diálogo de senha de líder
        } else {
          setIsUserTypeDialogOpen(false); // Fechar diálogo de tipo de usuário
          toast({ title: "Tipo de Usuário Definido", description: `Seu papel foi definido como ${userTypes.find(t => t.value === type)?.label}.` });
        }
      } catch (err) {
        console.error("Unexpected error updating user type:", err);
        toast({ title: "Erro Inesperado", description: "Ocorreu um erro inesperado ao definir seu tipo de usuário.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser, toast]);

  // handleLeaderPasswordConfirm - ATUALIZADA
  const handleLeaderPasswordConfirm = useCallback(async (masterPassword) => {
    // Obter a senha mestra do Supabase (ex: de uma tabela 'settings' ou variável de ambiente)
    // Por simplicidade, vamos usar uma senha fixa por enquanto.
    // EM PRODUÇÃO, VOCÊ DEVE BUSCAR ISSO DE FORMA SEGURA OU USAR FUNÇÕES EDGE DO SUPABASE.
    const masterPasswordFromEnv = import.meta.env.VITE_LEADER_MASTER_PASSWORD || 'ministerio123'; // DEFINA NO SEU .env

    if (masterPassword === masterPasswordFromEnv) {
      // Atualizar o tipo de usuário para 'leader' no banco de dados (se já não estiver como 'leader')
      // (A transição para 'leader_pending_password' já ocorre em handleUserTypeSelection)
      const { data, error } = await supabase
        .from('profiles')
        .update({ type: 'leader' })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user to actual leader type:", error);
        toast({ title: "Erro", description: "Não foi possível atualizar seu tipo para líder.", variant: "destructive" });
        return false;
      }

      const updatedUser = { ...currentUser, type: data.type };
      setCurrentUser(updatedUser);
      setAllRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      setIsLeaderPasswordDialogOpen(false);
      toast({ title: "Acesso de Líder Concedido!", description: "Você tem acesso total." });
      return true;
    } else {
      toast({ title: "Senha Mestra Incorreta", description: "A senha mestra do líder está incorreta.", variant: "destructive" });
      return false;
    }
  }, [currentUser, toast]);

  // handleLogout - ATUALIZADA
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast({ title: "Erro no Logout", description: error.message, variant: "destructive" });
    } else {
      setCurrentUser(null);
      toast({ title: "Logout", description: "Você foi desconectado." });
    }
    setIsLoading(false);
    setIsAuthDialogOpen(true);
    setAuthMode('login');
    setIsUserTypeDialogOpen(false);
    setIsLeaderPasswordDialogOpen(false);
  }, [toast]);

  // handleSwitchUser - ATUALIZADA (agora é efetivamente um logout para iniciar um novo login)
  const handleSwitchUser = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut(); // Desloga o usuário atual
    if (error) {
      console.error("Switch user error:", error);
      toast({ title: "Erro ao Trocar Usuário", description: error.message, variant: "destructive" });
      setIsLoading(false);
    } else {
      setCurrentUser(null);
      setIsAuthDialogOpen(true);
      setAuthMode('login');
      setIsUserTypeDialogOpen(false);
      setIsLeaderPasswordDialogOpen(false);
      toast({ title: "Trocar Usuário", description: "Por favor, faça login com outra conta." });
      setIsLoading(false);
    }
  }, [toast]);


  return {
    currentUser,
    allRegisteredUsers, // allRegisteredUsers agora vem do Supabase
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
    setAllRegisteredUsers // Pode ser útil ainda se UserManagementModule precisar setar diretamente
  };
};

export default useAuth;