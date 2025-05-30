import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast'; // Remova este import se useAuth já o importa
import { Loader2 } from 'lucide-react';

import useAuth from '@/hooks/useAuth'; // Agora este useAuth é o refatorado (ou useAuthFlow)
import useAppInitializer from '@/hooks/useAppInitializer';

import Header from '@/components/Header';
import MainAppTabs from '@/components/MainAppTabs';
import AuthDialog from '@/components/auth/AuthDialog';
import UserTypeDialog from '@/components/auth/UserTypeDialog';
import LeaderPasswordDialog from '@/components/auth/LeaderPasswordDialog';

const App = () => {
  // Remova esta linha se useAuth já importa e usa o useToast internamente
  // const { toast } = useToast();

  const {
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
  } = useAuth(); // Não precisa passar toast como prop agora que useAuth o importa

  useAppInitializer(isLoading); // Adapte este hook se ele usava 'toast' internamente ou não mais precisa dele

  // O componente de carregamento inicial, que agora usa o isLoading correto do AuthContext
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Carregando aplicativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* O Header agora pode depender do currentUser */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />

      <main className="container mx-auto py-8">
        {/*
          A lógica de renderização é controlada pelos estados de UI (isAuthDialogOpen, isUserTypeDialogOpen)
          que são definidos dentro do useAuth refatorado com base no currentUser e isLoading.
        */}
        {isAuthDialogOpen && (
          <AuthDialog
            isOpen={isAuthDialogOpen}
            onOpenChange={setIsAuthDialogOpen}
            authMode={authMode}
            onSwitchAuthMode={setAuthMode}
            onLogin={handleLogin}
            onRegister={handleRegister}
            // allRegisteredUsers={allRegisteredUsers} // Removido, pois AuthDialog não precisa disso
          />
        )}

        {isUserTypeDialogOpen && (
          <UserTypeDialog
            isOpen={isUserTypeDialogOpen} // Usar o estado isUserTypeDialogOpen
            onOpenChange={setIsUserTypeDialogOpen}
            username={currentUser?.username || currentUser?.email?.split('@')[0]}
            onSelectType={handleUserTypeSelection}
          />
        )}

        {/* Se o usuário estiver logado E tiver um tipo, mostra o MainAppTabs */}
        {!isAuthDialogOpen && !isUserTypeDialogOpen && currentUser && currentUser.type && (
          <MainAppTabs
            currentUser={currentUser}
            registeredUsers={allRegisteredUsers}
            setRegisteredUsers={setAllRegisteredUsers}
          />
        )}
      </main>

      <LeaderPasswordDialog
        isOpen={isLeaderPasswordDialogOpen}
        onOpenChange={setIsLeaderPasswordDialogOpen}
        onConfirm={handleLeaderPasswordConfirm}
        onBack={() => {
          setIsLeaderPasswordDialogOpen(false);
          // O UserTypeDialog será aberto automaticamente pelo useEffect do useAuth
          // se o currentUser não tiver um tipo, então não precisamos chamá-lo explicitamente aqui.
        }}
      />

      <Toaster /> {/* Mantenha o toaster aqui */}
    </div>
  );
};

export default App;