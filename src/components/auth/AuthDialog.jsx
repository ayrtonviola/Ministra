// src/components/auth/AuthDialog.jsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AuthDialog = ({ isOpen, onOpenChange, authMode, onSwitchAuthMode, onLogin, onRegister, allRegisteredUsers }) => {
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState(''); // ALTERADO
  const [passwordInput, setPasswordInput] = useState('');
  const { toast } = useToast();

  const clearInputs = () => {
    setFullNameInput('');
    setEmailInput(''); // ALTERADO
    setPasswordInput('');
  };

  const handleSubmit = () => {
    // Validação de E-MAIL e Senha
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex simples para email

    if (!emailInput.trim() || !emailRegex.test(emailInput.trim())) { // ALTERADO
      toast({ title: "Email Inválido", description: "Por favor, insira um endereço de email válido.", variant: "destructive" });
      return;
    }

    if (passwordInput.length < 6) { // Supabase recomenda 6 caracteres no mínimo para senha
      toast({ title: "Senha Inválida", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (authMode === 'login') {
      // Passando email real
      const success = onLogin(emailInput, passwordInput); // ALTERADO
      if (success) clearInputs();
    } else { // register mode
      if (!fullNameInput.trim()) {
        toast({ title: "Nome Completo Inválido", description: "Por favor, insira seu nome completo.", variant: "destructive" });
        return;
      }
      // A validação de email e senha já foi feita acima

      // Passando email real e nome completo para registro
      const success = onRegister(fullNameInput, emailInput, passwordInput); // ALTERADO
      if (success) clearInputs();
    }
  };

  const handleSwitchMode = () => {
    onSwitchAuthMode(authMode === 'login' ? 'register' : 'login');
    clearInputs();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>
            {authMode === 'login' ? 'Fazer Login' : 'Criar Conta'}
          </DialogTitle>
          <DialogDescription>
            {authMode === 'login' ? 'Entre com seu email e senha.' : 'Preencha os campos abaixo para criar sua conta.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {authMode === 'register' && (
            <div>
              <Label htmlFor="auth-full-name">Nome Completo</Label>
              <Input 
                id="auth-full-name" 
                type="text" 
                value={fullNameInput} 
                onChange={(e) => setFullNameInput(e.target.value)} 
                placeholder="Seu nome completo" 
                className="bg-gray-700 border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}
          {/* CAMPO DE EMAIL - ALTERADO */}
          <div>
            <Label htmlFor="auth-email">Email</Label>
            <Input 
              id="auth-email" 
              type="email" // Definir como type="email" para teclado de email no celular
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