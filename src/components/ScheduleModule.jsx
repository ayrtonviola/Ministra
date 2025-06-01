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
  const [currentScheduleData, setCurrentScheduleData] = useState(null);

  // Carrega escalas do Supabase
  const loadSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('scheduled_date', { ascending: true }); // <--- MUDANÇA AQUI: Ordenar por scheduled_date

    if (error) {
      toast({
        title: 'Erro ao carregar escalas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Converte a string de data do Supabase de volta para objeto Date
      // e mapeia os nomes das colunas do banco para os nomes usados no frontend
      const parsedSchedules = data.map(schedule => ({
        ...schedule,
        id: schedule.id, // Garante que o ID é mantido
        date: new Date(schedule.scheduled_date), // <--- MUDANÇA AQUI: Mapeia scheduled_date para date
        songs: schedule.songs_assigned || [], // <--- MUDANÇA AQUI: Mapeia songs_assigned para songs
        participants: schedule.team_members || { singers: [], instrumentalists: [] } // <--- MUDANÇA AQUI: Mapeia team_members para participants
      }));
      setSchedules(parsedSchedules || []);
    }
  }, [toast]);

  // Carrega músicas do Supabase
  const loadSongs = useCallback(async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, artist');

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
    setCurrentScheduleData(null);
    setIsDialogOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem editar escalas.", variant: "destructive" });
      return;
    }
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
      setSchedules(schedules.filter(schedule => schedule.id !== id));
      toast({ title: "Escala removida", description: "A escala foi removida com sucesso." });
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (currentUser?.type !== 'leader') return;

    // Prepara os dados para o Supabase, mapeando para os nomes das colunas do banco
    const dataToSave = {
      scheduled_date: scheduleData.date.toISOString(), // <--- MUDANÇA AQUI: Mapeia date para scheduled_date
      songs_assigned: scheduleData.songs, // <--- MUDANÇA AQUI: Mapeia songs para songs_assigned
      team_members: scheduleData.participants, // <--- MUDANÇA AQUI: Mapeia participants para team_members
      leader_id: currentUser.id, // Adiciona o ID do líder logado
      theme: scheduleData.theme || null, // Adicione theme se você for usá-lo no frontend
      notes: scheduleData.notes || null // Adicione notes se você for usá-lo no frontend
    };

    try {
      if (scheduleData.id) { // Se o ID existe, é uma edição
        const { error, data: updatedData } = await supabase
          .from('schedules')
          .update(dataToSave)
          .eq('id', scheduleData.id)
          .select();

        if (error) throw error;

        setSchedules(prevSchedules =>
          prevSchedules.map(s =>
            s.id === updatedData[0].id
              ? {
                  ...updatedData[0],
                  date: new Date(updatedData[0].scheduled_date), // Converte data de volta
                  songs: updatedData[0].songs_assigned || [],
                  participants: updatedData[0].team_members || { singers: [], instrumentalists: [] }
                }
              : s
          )
        );
        toast({ title: "Escala atualizada", description: "A escala foi atualizada com sucesso." });

      } else { // Caso contrário, é uma criação
        const { error, data: newData } = await supabase
          .from('schedules')
          .insert([dataToSave])
          .select();

        if (error) throw error;

        setSchedules(prevSchedules => [
          ...prevSchedules,
          {
            ...newData[0],
            date: new Date(newData[0].scheduled_date), // Converte data de volta
            songs: newData[0].songs_assigned || [],
            participants: newData[0].team_members || { singers: [], instrumentalists: [] }
          }
        ]);
        toast({ title: "Escala adicionada", description: "A nova escala foi adicionada com sucesso." });
      }
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsDialogOpen(false);
      setCurrentScheduleData(null);
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
        registeredUsers={registeredUsers}
      />

      <ScheduleDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setCurrentScheduleData(null); }}
        schedule={currentScheduleData}
        onSave={handleSaveSchedule}
        allSongs={allSongs}
        allUsers={registeredUsers || []}
      />
    </div>
  );
};

export default ScheduleModule;
