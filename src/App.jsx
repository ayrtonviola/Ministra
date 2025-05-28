// src/App.jsx
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import useAuth from '@/hooks/useAuth';
import useAppInitializer from '@/hooks/useAppInitializer';

import Header from '@/components/Header';
import MainAppTabs from '@/components/MainAppTabs';
// CORREÇÃO AQUI: Certifique-se de que o caminho inclua 'auth/'
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
    setAllRegisteredUsers,
    fetchAllProfiles
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
        {currentUser ? (
          <MainAppTabs 
            currentUser={currentUser} 
          />
        ) : (
          !isLoading && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-effect rounded-xl p-8 shadow-xl text-center max-w-lg mx-auto"
             >
                <h2 className="text-2xl font-bold text-white mb-4">Bem-vindo ao App Ministério de Louvor</h2>
                <p className="text-gray-300 mb-6">Por favor, faça login ou cadastre-se para acessar as funcionalidades.</p>
                <p className="text-sm text-gray-400 mt-2">Se os diálogos não aparecerem, tente recarregar a página.</p>
             </motion.div>
          )
        )}
      </main>

      <AuthDialog
        isOpen={isAuthDialogOpen && !currentUser}
        onOpenChange={(open) => { 
          if(!open && !currentUser) { /* User closed dialog without logging in */ }
          setIsAuthDialogOpen(open);
        }}
        authMode={authMode}
        onSwitchAuthMode={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <UserTypeDialog
        isOpen={isUserTypeDialogOpen && !!currentUser && !currentUser.type}
        onOpenChange={(open) => {
          if(!open && currentUser && !currentUser.type) { /* User closed dialog without selecting type */ }
          setIsUserTypeDialogOpen(open)
        }}
        username={currentUser?.username}
        onSelectType={handleUserTypeSelection}
      />
      
      <LeaderPasswordDialog
        isOpen={isLeaderPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsLeaderPasswordDialogOpen(open);
        }}
        onConfirm={handleLeaderPasswordConfirm}
        onBack={() => {setIsLeaderPasswordDialogOpen(false); setIsUserTypeDialogOpen(true);}}
      />
      
      <Toaster />
    </div>
  );
};

export default App;