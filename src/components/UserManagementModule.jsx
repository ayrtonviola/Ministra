import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, Edit3, Users, ShieldAlert, Loader2 } from 'lucide-react';
// import useAuth from '@/hooks/useAuth'; // Não vamos mais pegar allRegisteredUsers de useAuth neste componente
// VAMOS USAR O SUPABASE DIRETAMENTE AQUI PARA BUSCAR OS USUÁRIOS!
import { supabase } from '@/lib/supabaseClient'; // <--- ESSENCIAL: DESCOMENTE OU ADICIONE ESTA LINHA!

const userTypes = [
  { value: 'leader', label: 'Líder' },
  { value: 'singer', label: 'Cantor(a)' },
  { value: 'drummer', label: 'Baterista' },
  { value: 'keyboardist', label: 'Tecladista' },
  { value: 'bassist', 'label': 'Baixista' },
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
  // allRegisteredUsers e setAllRegisteredUsers AGORA SERÃO ESTADOS LOCAIS NESTE COMPONENTE
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); // Estado de carregamento para a lista de usuários

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditedUser, setCurrentEditedUser] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    username: '',
    full_name: '',
    type: '',
    // password: '' // Senha não deve ser gerenciada aqui no cliente
  });

  // Função para buscar todos os usuários - ESSA FUNÇÃO ESTAVA COMENTADA!
  const fetchAllUsers = useCallback(async () => {
    setIsLoadingUsers(true); // Inicia o carregamento
    try {
      // Faz a consulta no Supabase. Certifique-se que a RLS de SELECT permite isso.
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*'); // Seleciona todos os campos dos perfis

      if (error) {
        console.error("Erro ao carregar usuários:", error.message);
        toast({ title: "Erro de Carregamento", description: "Não foi possível carregar a lista de usuários.", variant: "destructive" });
        setAllRegisteredUsers([]); // Reseta a lista em caso de erro
        return;
      }

      setAllRegisteredUsers(users); // Popula a lista de usuários
    } catch (error) {
      console.error("Erro inesperado ao carregar usuários:", error.message);
      toast({ title: "Erro Inesperado", description: "Ocorreu um erro ao carregar os usuários.", variant: "destructive" });
      setAllRegisteredUsers([]);
    } finally {
      setIsLoadingUsers(false); // Finaliza o carregamento
    }
  }, [toast]); // fetchAllUsers depende do toast

  // Efeito para carregar usuários quando o componente é montado ou o currentUser muda
  // ESTE useEffect ESTAVA COMENTADO!
  useEffect(() => {
    // Apenas busca se o usuário atual for líder
    if (currentUser?.type === 'leader') {
      fetchAllUsers();
    }
  }, [currentUser, fetchAllUsers]); // currentUser e fetchAllUsers são dependências

  // Handler para adicionar novo usuário
  const handleAddUser = () => {
    setFormData({
      id: '',
      email: '',
      username: '',
      full_name: '',
      type: '',
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  // Handler para editar usuário
  const handleEditUser = (user) => {
    setCurrentEditedUser(user);
    setFormData({
      id: user.id,
      // O email pode estar no perfil ou no auth.users. Se não vier do perfil, precisaria de ajuste.
      email: user.email || '', // Garante que é uma string vazia se não tiver email
      username: user.username || '',
      full_name: user.full_name || '',
      type: user.type || '',
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // Handler para deletar usuário
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja deletar este usuário?")) {
      return;
    }
    setIsLoadingUsers(true); // Inicia loading para a operação de delete
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Usuário deletado", description: "O usuário foi removido com sucesso.", variant: "success" });
        fetchAllUsers(); // Recarrega a lista após a exclusão
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handler para salvar (adicionar/editar) usuário
  const handleSaveUser = async () => {
    setIsLoadingUsers(true);
    try {
      const { password, ...profileData } = formData; // Garante que a senha não seja enviada

      let finalUpdates = {
        id: profileData.id, // O ID deve vir do formulário para edição
        username: profileData.username,
        full_name: profileData.full_name,
        type: profileData.type,
        updated_at: new Date().toISOString()
      };

      // Se for um novo usuário, a criação é mais complexa e geralmente envolve supabase.auth.admin.createUser
      // o que não é seguro fazer no cliente. Mantenha essa parte em mente.
      if (!isEditMode) {
          toast({ title: "Funcionalidade de Adicionar Usuário", description: "A criação de novos usuários por líderes no cliente é complexa e requer considerações de segurança. Geralmente, usuários se registram por conta própria.", variant: "info" });
          setIsLoadingUsers(false);
          return;
      }

      const { error } = await supabase.from('profiles').upsert(finalUpdates);

      if (error) {
        toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Perfil salvo", variant: "success" });
        setIsDialogOpen(false);
        fetchAllUsers(); // Recarrega a lista após salvar
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Renderização
  if (isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <p className="ml-2 text-white">Carregando usuários...</p>
      </div>
    );
  }

  // Se não for líder, mostrar mensagem de erro/acesso negado
  if (currentUser?.type !== 'leader') {
    return (
      <div className="text-white p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Acesso Negado</h2>
        <p>Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
        <Button onClick={handleAddUser} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
        </Button>
      </div>

      {allRegisteredUsers.length === 0 ? (
        <p className="text-white text-center text-lg mt-10">Nenhum usuário registrado ainda. Comece adicionando um!</p>
      ) : (
        <ul className="space-y-3">
            {allRegisteredUsers.map(user => (
                <li key={user.id} className="flex justify-between items-center p-3 bg-white/10 rounded-md">
            <div>
              <p className="font-medium">{user.full_name || user.username || 'Nome Indefinido'} <span className="text-xs text-gray-400">({user.email || 'Email Indefinido'})</span></p>
              <p className="text-xs text-purple-300">
                {getUserFriendlyType(user.type)}
              </p>
            </div>
            <div className="flex space-x-2">
                  <Button onClick={() => handleEditUser(user)} variant="ghost" size="icon" className="text-blue-400 hover:text-blue-500">
                    <Edit3 className="h-5 w-5" />
                  </Button>
                  <Button onClick={() => handleDeleteUser(user.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-500">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
          </li>
            ))}
          </ul>
      )}

      {/* DIALOG PARA ADICIONAR/EDITAR USUÁRIO - CERTIFIQUE-SE QUE ESTÁ COMPLETO NO SEU ARQUIVO! */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{isEditMode ? 'Editar Usuário' : 'Adicionar Usuário'}</h3>
            <div className="space-y-4">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                readOnly={isEditMode}
                className="bg-gray-700 text-white border-gray-600"
              />
              <Label htmlFor="username" className="text-white">Nome de Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
              <Label htmlFor="full_name" className="text-white">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
              <Label htmlFor="type" className="text-white">Tipo/Função</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {userTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-white">Cancelar</Button>
              <Button onClick={handleSaveUser} className="bg-purple-600 hover:bg-purple-700">Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementModule;