import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ScheduleList from '@/components/schedule/ScheduleList';
import ScheduleDialog from '@/components/schedule/ScheduleDialog';
import { supabase } from '@/lib/supabaseClient';

const ScheduleModule = ({ currentUser, registeredUsers }) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Não precisamos mais de isEditMode, o currentScheduleData já indica se é edição ou novo
  // const [isEditMode, setIsEditMode] = useState(false);
  const [currentScheduleData, setCurrentScheduleData] = useState(null);

  // Carrega escalas do Supabase
  const loadSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true }); // Ordenar por data para exibir cronologicamente

    if (error) {
      toast({
        title: 'Erro ao carregar escalas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Converte a string de data do Supabase de volta para objeto Date
      const parsedSchedules = data.map(schedule => ({
        ...schedule,
        date: new Date(schedule.date),
        // Certifique-se que songs e participants são arrays/objetos se o Supabase retornar como JSONB
        songs: schedule.songs || [],
        participants: schedule.participants || { singers: [], instrumentalists: [] }
      }));
      setSchedules(parsedSchedules || []);
    }
  }, [toast]);

  // Modificado: Carrega músicas do Supabase
  const loadSongs = useCallback(async () => {
    const { data, error } = await supabase
      .from('songs') // <--- MUDANÇA AQUI: Buscando da tabela 'songs' no Supabase
      .select('id, title, artist'); // Selecione as colunas que você precisa para identificar a música

    if (error) {
      toast({
        title: 'Erro ao carregar músicas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setAllSongs(data || []);
    }
  }, [toast]);

  useEffect(() => {
    loadSchedules();
    loadSongs();
  }, [loadSchedules, loadSongs]);

  const handleAddSchedule = () => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem criar escalas.", variant: "destructive" });
      return;
    }
    // Ao adicionar, currentScheduleData é null, o que indica ao ScheduleDialog para criar um novo
    setCurrentScheduleData(null);
    setIsDialogOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem editar escalas.", variant: "destructive" });
      return;
    }
    // Passa o objeto schedule completo para edição
    setCurrentScheduleData(schedule);
    setIsDialogOpen(true);
  };

  const handleDeleteSchedule = async (id) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem remover escalas.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      // Remover do estado local para atualização imediata
      setSchedules(schedules.filter(schedule => schedule.id !== id));
      toast({ title: "Escala removida", description: "A escala foi removida com sucesso." });
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (currentUser?.type !== 'leader') return;

    // Prepara os dados para o Supabase
    const dataToSave = {
      date: scheduleData.date.toISOString(), // <-- IMPORTANTE: Converte Date para string ISO
      songs: scheduleData.songs, // IDs das músicas
      participants: scheduleData.participants // IDs dos participantes (JSONB)
    };

    try {
      if (scheduleData.id && schedules.some(s => s.id === scheduleData.id)) {
        // Modo de Edição: Se o ID existe e a escala já está na lista local
        const { error, data: updatedData } = await supabase
          .from('schedules')
          .update(dataToSave) // Use dataToSave aqui
          .eq('id', scheduleData.id)
          .select(); // Adicione .select() para obter os dados atualizados

        if (error) throw error;

        // Atualiza o estado local com os dados retornados pelo Supabase
        setSchedules(prevSchedules =>
          prevSchedules.map(s => (s.id === updatedData[0].id ? { ...updatedData[0], date: new Date(updatedData[0].date) } : s))
        );
        toast({ title: "Escala atualizada", description: "A escala foi atualizada com sucesso." });

      } else {
        // Modo de Criação: Novo agendamento
        const { error, data: newData } = await supabase
          .from('schedules')
          .insert([dataToSave]) // Use dataToSave aqui
          .select(); // Adicione .select() para obter os dados inseridos (incluindo o ID)

        if (error) throw error;

        // Adiciona a nova escala ao estado local
        setSchedules(prevSchedules => [
          ...prevSchedules,
          { ...newData[0], date: new Date(newData[0].date) }
        ]);
        toast({ title: "Escala adicionada", description: "A nova escala foi adicionada com sucesso." });
      }
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsDialogOpen(false);
      setCurrentScheduleData(null); // Limpa o dado atual após salvar/atualizar
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Escalas da Semana</h2>
        {currentUser?.type === 'leader' && (
          <Button onClick={handleAddSchedule} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Nova Escala
          </Button>
        )}
      </div>

      <ScheduleList
        schedules={schedules}
        onEdit={handleEditSchedule}
        onDelete={handleDeleteSchedule}
        currentUser={currentUser}
        registeredUsers={registeredUsers} // Certifique-se de passar registeredUsers para ScheduleList se ela precisar
      />

      <ScheduleDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setCurrentScheduleData(null); }} // Zera currentScheduleData ao fechar
        schedule={currentScheduleData}
        onSave={handleSaveSchedule}
        // isEditMode não é mais necessário, a prop 'schedule' já indica se é edição
        allSongs={allSongs}
        allUsers={registeredUsers || []} // Passa os usuários registrados (do AuthContext)
      />
    </div>
  );
};

export default ScheduleModule;
