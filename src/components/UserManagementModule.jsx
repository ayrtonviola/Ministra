import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, Edit3, Users, ShieldAlert, Loader2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth'; // Importe useAuth
import { supabase } from '@/lib/supabaseClient'; // Importe o cliente Supabase

const userTypes = [
  { value: 'leader', label: 'Líder' },
  { value: 'singer', label: 'Cantor(a)' },
  { value: 'drummer', label: 'Baterista' },
  { value: 'keyboardist', label: 'Tecladista' },
  { value: 'bassist', label: 'Baixista' },
  { value: 'guitarist', label: 'Guitarrista' },
  { value: 'acoustic_guitarist', label: 'Violonista' },
  { value: 'other_instrumentalist', label: 'Outro Instrumentista' },
];

const getUserFriendlyType = (typeValue) => {
  const typeObj = userTypes.find(t => t.value === typeValue);
  return typeObj ? typeObj.label : 'Não Definido';
};

const UserManagementModule = ({ currentUser }) => {
  const { toast } = useToast();
  // allRegisteredUsers e fetchAllProfiles agora vêm de useAuth
  const { fetchAllProfiles, allRegisteredUsers, setAllRegisteredUsers } = useAuth(toast); 
  const [newFullName, setNewFullName] = useState('');
  const [newUserName, setNewUserName] = useState(''); // Este será o email para o Supabase Auth
  const [newPassword, setNewPassword] = useState('');
  const [newUserType, setNewUserType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false); // Novo estado de loading para o módulo

  // Carrega os usuários (perfis) do Supabase quando o componente monta ou currentUser muda (se for líder)
  useEffect(() => {
    const loadUsers = async () => {
      setModuleLoading(true);
      if (currentUser?.type === 'leader') {
        const profiles = await fetchAllProfiles(); // Esta função já faz o toast em caso de erro
        setAllRegisteredUsers(profiles);
      } else {
        setAllRegisteredUsers([]); // Se não for líder, limpa a lista de usuários
      }
      setModuleLoading(false);
    };
    loadUsers();
  }, [currentUser, fetchAllProfiles, setAllRegisteredUsers]);


  const handleAddUser = async () => {
    if (!newFullName.trim() || !newUserName.trim() || !newPassword.trim() || !newUserType) {
      toast({ title: "Campos Obrigatórios", description: "Por favor, preencha todos os campos para adicionar um novo usuário.", variant: "destructive" });
      return;
    }
    // O username agora é o email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserName.trim())) {
      toast({ title: "Email Inválido", description: "Por favor, insira um endereço de e-mail válido para o novo usuário.", variant: "destructive" });
      return;
    }
    // Supabase Auth requer no mínimo 6 caracteres para senha por padrão
    if (newPassword.length < 6) {
      toast({ title: "Senha Fraca", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    setModuleLoading(true);
    try {
      // 1. Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserName.trim(),
        password: newPassword,
        options: {
          data: {
            full_name: newFullName.trim(),
            user_type: newUserType // Pode ser passado aqui ou apenas no perfil
          }
        }
      });

      if (authError) {
        console.error('Erro ao adicionar usuário (Auth):', authError.message);
        let errorMessage = "Erro ao adicionar usuário.";
        if (authError.message.includes("Users cannot be registered with an email address that is already registered.")) {
          errorMessage = "Este e-mail já está cadastrado.";
        }
        toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        setModuleLoading(false);
        return;
      }

      // 2. Inserir o perfil na tabela 'profiles'
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            username: newUserName.trim(), // Use o email como username inicial ou crie um campo "display_username"
            full_name: newFullName.trim(),
            user_type: newUserType
          }
        ]);

      if (profileError) {
        console.error('Erro ao adicionar usuário (Perfil):', profileError.message);
        toast({ title: "Erro", description: "Usuário criado na autenticação, mas erro ao salvar perfil. Tente novamente.", variant: "destructive" });
        // Considere deletar o usuário criado no auth.users se o perfil não puder ser criado
        await supabase.auth.admin.deleteUser(authData.user.id); // Requer service_role key
        setModuleLoading(false);
        return;
      }

      toast({ title: "Usuário Adicionado!", description: `${newFullName} (${getUserFriendlyType(newUserType)}) foi adicionado.` });
      
      // Recarregar a lista de usuários para refletir a mudança
      const updatedProfiles = await fetchAllProfiles();
      setAllRegisteredUsers(updatedProfiles);

      // Limpar formulário
      setNewFullName('');
      setNewUserName('');
      setNewPassword('');
      setNewUserType('');

    } catch (error) {
      console.error('Erro inesperado ao adicionar usuário:', error);
      toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao tentar adicionar o usuário.", variant: "destructive" });
    } finally {
      setModuleLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewFullName(user.name);
    setNewUserName(user.username); // Aqui, o username é o email
    setNewUserType(user.type);
    setIsEditing(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newFullName.trim() || !newUserName.trim() || !newUserType) {
      toast({ title: "Campos Obrigatórios", description: "Por favor, preencha todos os campos para atualizar o usuário.", variant: "destructive" });
      return;
    }
    // No momento, não permitimos alterar o email/username do Supabase Auth por aqui.
    // Se o email precisar ser alterado, precisaria de uma chamada separada para supabase.auth.admin.updateUserById.
    if (newUserName.trim() !== editingUser.username) {
        toast({ title: "Erro na Edição", description: "A alteração do e-mail do usuário não é permitida diretamente por aqui. Por favor, mantenha o e-mail original.", variant: "destructive" });
        setNewUserName(editingUser.username); // Reseta para o valor original
        return;
    }

    setModuleLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: newFullName.trim(),
          user_type: newUserType,
          username: newUserName.trim() // Atualiza no perfil caso seja um campo editável visualmente
        })
        .eq('user_id', editingUser.id); // Usa o user_id do Supabase Auth

      if (error) {
        console.error('Erro ao atualizar usuário:', error.message);
        toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
        setModuleLoading(false);
        return;
      }

      toast({ title: "Usuário Atualizado!", description: `${newFullName} foi atualizado.` });
      
      // Recarregar a lista de usuários para refletir a mudança
      const updatedProfiles = await fetchAllProfiles();
      setAllRegisteredUsers(updatedProfiles);

      // Resetar formulário
      setIsEditing(false);
      setEditingUser(null);
      setNewFullName('');
      setNewUserName('');
      setNewPassword(''); // Senha não é editada diretamente aqui
      setNewUserType('');

    } catch (error) {
      console.error('Erro inesperado ao atualizar usuário:', error);
      toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao tentar atualizar o usuário.", variant: "destructive" });
    } finally {
      setModuleLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Validação para não permitir que o líder se exclua ou exclua o último líder
    const isCurrentUser = currentUser?.id === userId;
    const isLeader = allRegisteredUsers.find(u => u.id === userId)?.type === 'leader';
    const numLeaders = allRegisteredUsers.filter(u => u.type === 'leader').length;

    if (isCurrentUser) {
      toast({ title: "Ação Não Permitida", description: "Você não pode excluir sua própria conta por aqui. Use a opção de logout.", variant: "destructive" });
      return;
    }
    if (isLeader && numLeaders <= 1) {
      toast({ title: "Ação Não Permitida", description: "Não é possível excluir o último líder do sistema.", variant: "destructive" });
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) {
      return;
    }

    setModuleLoading(true);
    try {
      // 1. Excluir o perfil da tabela 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError.message);
        toast({ title: "Erro", description: "Não foi possível excluir o perfil do usuário.", variant: "destructive" });
        setModuleLoading(false);
        return;
      }

      // 2. Excluir o usuário do Supabase Auth (requer service_role key - CUIDADO!)
      // Esta operação só funciona com a chave `service_role` no ambiente de backend (server-side).
      // Se você está fazendo isso no frontend, a menos que o Supabase permita, a exclusão direta pode falhar.
      // Para fins de desenvolvimento, vamos assumir que você está usando uma RPC ou uma Cloud Function
      // se a exclusão de usuários Auth do frontend não for permitida pela sua configuração de RLS/Policies.
      // Para o propósito deste app de exemplo, assumimos que esta operação será bem-sucedida ou será movida para uma RPC.
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Erro ao excluir usuário (Auth):', authError.message);
        toast({ title: "Erro", description: "Perfil excluído, mas não foi possível excluir a conta de autenticação. Contate o suporte.", variant: "destructive" });
        setModuleLoading(false);
        return;
      }

      toast({ title: "Usuário Excluído!", description: "O usuário foi removido com sucesso." });
      
      // Recarregar a lista de usuários para refletir a mudança
      const updatedProfiles = await fetchAllProfiles();
      setAllRegisteredUsers(updatedProfiles);

    } catch (error) {
      console.error('Erro inesperado ao excluir usuário:', error);
      toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao tentar excluir o usuário.", variant: "destructive" });
    } finally {
      setModuleLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUser(null);
    setNewFullName('');
    setNewUserName('');
    setNewPassword('');
    setNewUserType('');
  };

  // Se não for líder, exibe uma mensagem de acesso restrito
  if (currentUser?.type !== 'leader') {
    return (
      <div className="bg-red-500/20 text-red-300 p-4 rounded-lg flex items-center gap-2 mb-6">
        <ShieldAlert className="h-5 w-5" />
        <p>Acesso restrito: A gestão de usuários é apenas para líderes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-800/40 to-indigo-800/40 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="full-name" className="text-gray-300">Nome Completo</Label>
            <Input
              id="full-name"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Nome Completo"
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="username" className="text-gray-300">Email (Será o Nome de Usuário)</Label>
            <Input
              id="username"
              type="email" // Mude para email
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="email@exemplo.com"
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isEditing} // Não permite mudar o email em modo edição
            />
          </div>
          {!isEditing && ( // Senha só é necessária ao adicionar
            <div>
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          )}
          <div>
            <Label htmlFor="user-type" className="text-gray-300">Tipo de Usuário</Label>
            <Select onValueChange={setNewUserType} value={newUserType}>
              <SelectTrigger id="user-type" className="w-full bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                {userTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleUpdateUser} disabled={moduleLoading} className="bg-blue-600 hover:bg-blue-700">
                {moduleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                Atualizar Usuário
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={handleAddUser} disabled={moduleLoading} className="bg-purple-600 hover:bg-purple-700">
              {moduleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Adicionar Usuário
            </Button>
          )}
        </div>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Lista de Usuários Cadastrados ({allRegisteredUsers.length})
          {moduleLoading && <Loader2 className="ml-4 h-5 w-5 animate-spin text-primary" />}
        </h3>
        {allRegisteredUsers.length === 0 && !moduleLoading ? (
          <p className="text-gray-400">Nenhum usuário cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {allRegisteredUsers.map(user => (
                <li key={user.id} className="flex justify-between items-center p-3 bg-white/10 rounded-md">
            <div>
              {/* ALTERADO: Mostrar nome completo e email */}
              <p className="font-medium">{user.name} <span className="text-xs text-gray-400">({user.email})</span></p>
              <p className="text-xs text-purple-300">
                {getUserFriendlyType(user.type)}
              </p>
            </div>
            {/* ... */}
          </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserManagementModule;