import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, Edit3, Users, ShieldAlert, Loader2 } from 'lucide-react';
import useAuth from '@/hooks/useAuth'; // Importe useAuth
// REMOVIDO: import { supabase } from '@/lib/supabaseClient'; // Não precisamos mais do supabase aqui diretamente para fetch de users

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
  // PEGANDO TUDO DO useAuth, incluindo fetchAllProfiles e allRegisteredUsers
  const { allRegisteredUsers, fetchAllProfiles, isLoading: authLoading } = useAuth(toast); // Renomeei isLoading para authLoading para evitar conflito

  const [moduleLoading, setModuleLoading] = useState(true); // Gerencia o loading APENAS para este módulo, não do useAuth

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', type: '' });


  // NOVO: useEffect para carregar usuários REGISTRADOS APENAS uma vez ou quando 'currentUser' muda (se for um líder)
  useEffect(() => {
    // Só carrega os perfis se o usuário atual for um líder e se não estivermos já carregando pela autenticação
    if (currentUser?.type === 'leader' && !authLoading) { // authLoading vem do useAuth
        setModuleLoading(true); // Indica que este módulo está carregando seus próprios dados
        fetchAllProfiles(); // Chama a função do useAuth para buscar todos os perfis
        setModuleLoading(false); // Assume que fetchAllProfiles é rápido ou que o estado de allRegisteredUsers em useAuth já reflete o loading
                                 // NOTE: Poderíamos ter um loading state separado em useAuth para fetchAllProfiles se a chamada for lenta
    } else {
        setModuleLoading(false); // Se não for líder ou authLoading, não precisa carregar aqui
    }
  }, [currentUser, fetchAllProfiles, authLoading]); // Adicionado authLoading para a dependência

  const handleAddUser = async () => {
    // ... (restante da função handleAddUser)
    // OBS: Você pode querer mover a lógica de registro real para useAuth também, para centralizar
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({ name: user.name, email: user.email, type: user.type, password: '' }); // Não edita a senha aqui
    setDialogOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja deletar este usuário?")) {
      return;
    }
    setModuleLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;

      toast({ title: "Sucesso", description: "Usuário deletado com sucesso." });
      // ATUALIZADO: Chama fetchAllProfiles para re-sincronizar a lista após exclusão
      fetchAllProfiles();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Erro", description: `Não foi possível deletar o usuário: ${error.message}`, variant: "destructive" });
    } finally {
      setModuleLoading(false);
    }
  };

  const handleSaveUser = async () => {
    setModuleLoading(true);
    try {
      if (editingUser) {
        // Lógica para UPDATE
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: newUser.name,
            email: newUser.email, // Cuidado ao atualizar email aqui, Supabase Auth é separado
            type: newUser.type
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Perfil atualizado com sucesso." });
      } else {
        // Lógica para INSERT (se você quiser adicionar usuários por aqui, mas o trigger já faz isso)
        // Isso aqui é mais complexo, pois envolve Auth.signup e o trigger de profiles.
        // A melhor prática é que o registro de novos usuários ocorra via AuthDialog e o trigger.
        // Este módulo seria mais para GESTÃO (editar/deletar) de perfis existentes.
        toast({ title: "Aviso", description: "O registro de novos usuários deve ser feito pela tela de cadastro." });
      }
      setDialogOpen(false);
      // ATUALIZADO: Chama fetchAllProfiles para re-sincronizar a lista após atualização
      fetchAllProfiles();
    } catch (error) {
      console.error("Error saving user:", error);
      toast({ title: "Erro", description: `Não foi possível salvar o usuário: ${error.message}`, variant: "destructive" });
    } finally {
      setModuleLoading(false);
    }
  };

  // Renderização
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 text-purple-400">Gerenciamento de Usuários</h2>

      {/* Seção Adicionar Novo Usuário */}
      {/* Você pode manter ou remover o bloco de adição de usuário se o registro for apenas pelo AuthDialog */}
      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Nome Completo</Label>
            <Input
              id="add-name"
              placeholder="Nome Completo"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={!!editingUser} // Desabilita edição de email para usuário existente
            />
          </div>
          {!editingUser && (
            <div className="space-y-2">
              <Label htmlFor="add-password">Senha</Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Senha"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="add-type">Tipo de Usuário</Label>
            <Select onValueChange={(value) => setNewUser({ ...newUser, type: value })} value={newUser.type}>
              <SelectTrigger id="add-type" className="w-full bg-gray-700 border-gray-600">
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
        <div className="mt-4 flex justify-end space-x-2">
          {editingUser ? (
            <>
              <Button onClick={() => { setDialogOpen(false); setEditingUser(null); setNewUser({ name: '', email: '', password: '', type: '' }); }} variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button onClick={handleSaveUser} disabled={!newUser.name || !newUser.email || !newUser.type || moduleLoading} className="bg-green-600 hover:bg-green-700">
                {moduleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
            </>
          ) : (
            <Button onClick={handleAddUser} disabled={moduleLoading || !newUser.name || !newUser.email || !newUser.password || !newUser.type} className="bg-purple-600 hover:bg-purple-700">
              {moduleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Adicionar Usuário
            </Button>
          )}
        </div>
      </div>


      <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg mt-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Lista de Usuários Cadastrados ({allRegisteredUsers?.length || 0}) {/* Adicionado ?.length || 0 para segurança */}
          {(moduleLoading || authLoading) && <Loader2 className="ml-4 h-5 w-5 animate-spin text-primary" />} {/* Considera ambos loadings */}
        </h3>
        { (moduleLoading || authLoading) ? ( // Renderiza loader se qualquer um estiver carregando
            <div className="flex justify-center items-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
        ) : (allRegisteredUsers?.length === 0 ? ( // Verificação mais segura
          <p className="text-gray-400">Nenhum usuário cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {allRegisteredUsers.map(user => (
                <li key={user.id} className="flex justify-between items-center p-3 bg-white/10 rounded-md">
            <div>
              <p className="font-medium">{user.full_name || user.username} <span className="text-xs text-gray-400">({user.email})</span></p> {/* Melhorar exibição de nome */}
              <p className="text-xs text-purple-300">
                {getUserFriendlyType(user.type)}
              </p>
            </div>
            {currentUser?.type === 'leader' && (
                <div className="flex space-x-2">
                  <Button onClick={() => handleEditUser(user)} variant="ghost" size="icon" className="text-blue-400 hover:text-blue-500">
                    <Edit3 className="h-5 w-5" />
                  </Button>
                  <Button onClick={() => handleDeleteUser(user.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-500">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
            )}
          </li>
            ))}
          </ul>
        ))}
      </div>

      {/* Dialog para Adicionar/Editar Usuário */}
      {/* Este diálogo é o mesmo que você já tem para adicionar/editar */}
      {/* Ele pode ser movido para um componente separado se for muito grande */}
      {/* ... (restante do código que você já tinha para o Dialog) */}
      
    </div>
  );
};

export default UserManagementModule;