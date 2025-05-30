// src/components/auth/AuthDialog.jsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Mantenha aqui para validações locais

const AuthDialog = ({ isOpen, onOpenChange, authMode, onSwitchAuthMode, onLogin, onRegister }) => {
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const { toast } = useToast();

  const clearInputs = () => {
    setFullNameInput('');
    setEmailInput('');
    setPasswordInput('');
  };

  const handleSubmit = async () => { // Tornar async para await as chamadas de login/registro
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput.trim() || !emailRegex.test(emailInput.trim())) {
      toast({ title: "Email Inválido", description: "Por favor, insira um endereço de email válido.", variant: "destructive" });
      return;
    }

    if (passwordInput.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    if (authMode === 'login') {
      await onLogin(emailInput, passwordInput); // Chame a função e deixe que ela lide com o toast e estado
      // Não limpe os inputs aqui imediatamente, deixe o sucesso ser sinalizado pelo hook useAuth
      // para que o usuário possa corrigir o erro ou a dialog feche
    } else { // register mode
      if (!fullNameInput.trim()) {
        toast({ title: "Nome Completo Necessário", description: "Por favor, insira seu nome completo.", variant: "destructive" });
        return;
      }
      await onRegister(fullNameInput, emailInput, passwordInput); // Chame a função
      // Não limpe os inputs aqui imediatamente
    }
    // Opcional: Se as operações de login/registro forem bem-sucedidas e fecharem o diálogo,
    // os inputs serão redefinidos no próximo 'open' do diálogo, ou você pode limpar aqui se preferir.
    // clearInputs(); // Você pode descomentar se quiser limpar sempre após a tentativa
  };

  const handleSwitchMode = () => {
    onSwitchAuthMode(authMode === 'login' ? 'register' : 'login');
    clearInputs(); // Limpa os inputs ao trocar de modo
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{authMode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}</DialogTitle>
          <DialogDescription>
            {authMode === 'login'
              ? 'Faça login para acessar o aplicativo do ministério.'
              : 'Cadastre-se para começar a usar o aplicativo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {authMode === 'register' && (
            <div>
              <Label htmlFor="auth-full-name">Nome Completo</Label>
              <Input
                id="auth-full-name"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="Seu nome completo"
                className="bg-gray-700 border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}
          {/* CAMPO DE E-MAIL */}
          <div>
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="bg-gray-700 border-gray-600"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          {/* CAMPO DE SENHA */}
          <div>
            <Label htmlFor="auth-password">Senha</Label>
            <Input
              id="auth-password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="bg-gray-700 border-gray-600"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {authMode === 'register' && <p className="text-xs text-gray-400 mt-1">Deve ter pelo menos 6 caracteres.</p>}

          </div>
        </div>
        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <Button variant="link" onClick={handleSwitchMode} className="text-purple-400 hover:text-purple-300">
            {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
          </Button>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
            {authMode === 'login' ? <><LogIn className="mr-2 h-4 w-4" /> Entrar</> : <><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
