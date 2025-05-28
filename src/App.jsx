import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

import useAuth from '@/hooks/useAuth';
import useAppInitializer from '@/hooks/useAppInitializer';

import Header from '@/components/Header';
import MainAppTabs from '@/components/MainAppTabs';
import AuthDialog from '@/components/auth/AuthDialog';
import UserTypeDialog from '@/components/auth/UserTypeDialog';
import LeaderPasswordDialog from '@/components/auth/LeaderPasswordDialog';

const App = () => {
  const { toast } = useToast();

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
  } = useAuth(toast);

  useAppInitializer(toast, isLoading);

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
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
      />

      <main className="container mx-auto py-8">
        {!currentUser ? (
          <AuthDialog
            isOpen={isAuthDialogOpen}
            onOpenChange={setIsAuthDialogOpen}
            authMode={authMode}
            onSwitchAuthMode={setAuthMode}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        ) : !currentUser.type || isUserTypeDialogOpen ? (
          <UserTypeDialog
            isOpen={true}
            onOpenChange={setIsUserTypeDialogOpen}
            username={currentUser?.username}
            onSelectType={handleUserTypeSelection}
          />
        ) : (
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
          setIsUserTypeDialogOpen(true);
        }}
      />

      <Toaster />
    </div>
  );
};

export default App;
