// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Apenas para o signUp inicial
import { useAuth as useAuthContext } from './AuthContext'; // Importe o hook do AuthContext
import { useToast } from '@/components/ui/use-toast'; // Importe o useToast diretamente aqui

const useAuth = () => { // Não precisa mais receber toast como prop, pois será importado
  const { toast } = useToast(); // Obtém a função toast diretamente aqui

  // Consome os estados e funções do AuthContext
  const {
    user: userFromContext,
    profile: profileFromContext,
    loading: isLoadingAuthContext,
    signInWithPassword,
    signOut: signOutContext,
    updateProfile: updateProfileContext,
  } = useAuthContext();

  // Combina user e profile do contexto para o currentUser completo
  // O campo 'class' do perfil é o que você usa para 'type'
  const currentUser = userFromContext && profileFromContext
    ? { ...userFromContext, ...profileFromContext, type: profileFromContext.class }
    : (userFromContext || null); // Se não há perfil, ainda pode ter o user inicial

  // O isLoading principal agora vem do AuthContext
  const isLoading = isLoadingAuthContext;

  // Estados locais para controle das dialogs de UI
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'register'
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [isLeaderPasswordDialogOpen, setIsLeaderPasswordDialogOpen] = useState(false);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]); // A ser populado do backend, se necessário

  // Efeito para controlar a abertura/fechamento das dialogs de autenticação/tipo de usuário
  useEffect(() => {
    // Se ainda está carregando a autenticação, não faça nada
    if (isLoading) {
      return;
    }

    if (!currentUser) {
      // Se não há usuário, abre o diálogo de autenticação
      setIsAuthDialogOpen(true);
      setIsUserTypeDialogOpen(false);
    } else if (!currentUser.type) { // Assumindo que 'type' é o campo que indica se o usuário já selecionou a classe
      // Se há usuário mas não tem tipo selecionado, abre o diálogo de seleção de tipo
      setIsUserTypeDialogOpen(true);
      setIsAuthDialogOpen(false); // Fecha o diálogo de auth se estava aberto
    } else {
      // Se há usuário e ele tem tipo, fecha todos os diálogos de autenticação/tipo
      setIsAuthDialogOpen(false);
      setIsUserTypeDialogOpen(false);
    }
  }, [isLoading, currentUser]);


  // Funções de Autenticação
  const handleRegister = useCallback(
    async (fullName, email, password) => {
      try {
        // Usa supabase.auth.signUp diretamente para registrar um novo usuário
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data?.user) {
          const userId = data.user.id;
          // Cria um perfil inicial para o novo usuário
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email, username: fullName, full_name: fullName, class: null }]); // Inicializa 'class' como null
          if (profileError) throw profileError;

          toast({ title: "Cadastro realizado", description: "Verifique seu e-mail para confirmar a conta. Após a confirmação, você poderá fazer login.", variant: "success" });
          setAuthMode('login'); // Após o registro, sugere login
          setIsAuthDialogOpen(true); // Mantém o diálogo aberto para o login
        }
      } catch (err) {
        console.error("Erro no cadastro:", err);
        toast({ title: "Erro no cadastro", description: err.message || "Erro desconhecido ao cadastrar.", variant: "destructive" });
      }
    },
    [toast, setAuthMode, setIsAuthDialogOpen]
  );

  const handleLogin = useCallback(
    async (email, password) => {
      try {
        const { error } = await signInWithPassword({ email, password }); // Chama a função do AuthContext
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!", variant: "success" });
        setIsAuthDialogOpen(false); // Fecha o diálogo após o login bem-sucedido
      } catch (err) {
        console.error("Erro no login:", err);
        toast({ title: "Erro no login", description: err.message || "Erro desconhecido ao logar.", variant: "destructive" });
      }
    },
    [toast, signInWithPassword, setIsAuthDialogOpen]
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOutContext(); // Chama a função do AuthContext
      toast({ title: "Você saiu com sucesso!", variant: "success" });
    } catch (err) {
      console.error("Erro no logout:", err);
      toast({ title: "Erro no logout", description: err.message || "Erro desconhecido ao sair.", variant: "destructive" });
    }
  }, [toast, signOutContext]);

  const handleUserTypeSelection = useCallback(
    async (type) => {
      if (!currentUser) {
        toast({ title: "Erro", description: "Nenhum usuário logado para atualizar o tipo.", variant: "destructive" });
        return;
      }
      try {
        // Chama a função de atualização do perfil do AuthContext
        await updateProfileContext({ id: currentUser.id, class: type, updated_at: new Date() }); // Use 'class' se for o nome da coluna no Supabase
        toast({ title: "Perfil atualizado", description: "Seu tipo de usuário foi salvo.", variant: "success" });
        setIsUserTypeDialogOpen(false); // Fecha o diálogo após a seleção
      } catch (err) {
        console.error("Erro ao selecionar tipo de usuário:", err);
        toast({ title: "Erro", description: err.message || "Não foi possível atualizar seu tipo de usuário.", variant: "destructive" });
      }
    },
    [currentUser, toast, updateProfileContext, setIsUserTypeDialogOpen]
  );

  const handleLeaderPasswordConfirm = useCallback(() => {
    // Lógica para confirmar a senha do líder
    toast({ title: "Confirmação de senha do líder", description: "Esta função ainda não foi implementada.", variant: "info" });
    setIsLeaderPasswordDialogOpen(false); // Fecha o diálogo após a tentativa (ou sucesso)
  }, [toast, setIsLeaderPasswordDialogOpen]);

  const handleSwitchUser = useCallback(() => {
    toast({ title: "Funcionalidade de troca de usuário", description: "Esta função ainda não foi implementada.", variant: "info" });
  }, [toast]);

  return {
    currentUser,
    allRegisteredUsers, // Você precisará popular isso de algum lugar (ex: carregar do Supabase para líderes)
    isLoading, // Agora reflete o loading do AuthContext
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
    setAllRegisteredUsers // Se você tiver uma função para carregar todos os usuários
  };
};

export default useAuth; // Mantendo o nome useAuth para não ter que mudar em App.jsx
