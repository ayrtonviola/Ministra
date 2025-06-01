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

  // Carrega músicas do Supabase
  const loadSongs = useCallback(async () => {
    const { data, error } = await supabase
      .from('songs') // Buscando da tabela 'songs' no Supabase
      .select('id, title, artist, key, tempo, youtube_link, lyrics_url, audio_file_url'); // Selecionando todas as colunas que você tem

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

  // Carrega escalas do Supabase e popula com dados completos de músicas e usuários
  const loadSchedules = useCallback(async () => {
    // Certifica-se de que allSongs e registeredUsers estão carregados antes de popular as escalas
    if (allSongs.length === 0 || registeredUsers.length === 0) {
        // Você pode optar por chamar loadSongs/loadUsers aqui se eles não forem garantidos via prop/useEffect global
        // Mas o ideal é que eles já estejam disponíveis via useEffect principal.
        // Ou você pode adicionar um estado de 'carregando' para eles e só carregar schedules quando prontos.
        // Por enquanto, vamos assumir que eles serão carregados pelo useEffect principal.
        return;
    }

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('scheduled_date', { ascending: true }); // Ordenar por scheduled_date

    if (error) {
      toast({
        title: 'Erro ao carregar escalas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const parsedSchedules = data.map(schedule => {
        // Mapeia IDs de músicas para objetos de música completos para exibição no frontend
        const populatedSongs = (schedule.songs_assigned || []).map(songId =>
          allSongs.find(s => s.id === songId)
        ).filter(Boolean); // Remove null/undefined se o ID não for encontrado

        // Mapeia IDs de participantes para nomes completos dos usuários para exibição no frontend
        const populatedSingers = (schedule.team_members?.singers || []).map(userId =>
          registeredUsers.find(u => u.id === userId)?.full_name || userId // Usa full_name, ou o ID se não encontrar
        );
        const populatedInstrumentalists = (schedule.team_members?.instrumentalists || []).map(userId =>
          registeredUsers.find(u => u.id === userId)?.full_name || userId // Usa full_name, ou o ID se não encontrar
        );

        return {
          ...schedule, // Mantém todas as propriedades originais do Supabase
          id: schedule.id,
          // Mapeia scheduled_date do banco para date (formato Date object) no frontend
          date: new Date(schedule.scheduled_date),
          // Cria um 'title' para a escala, usando o theme ou a data formatada
          title: schedule.theme || `Escala em ${new Date(schedule.scheduled_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
          // Mapeia songs_assigned do banco para songs (objetos completos) no frontend
          songs: populatedSongs,
          // Mapeia team_members do banco para participants (nomes completos) no frontend
          participants: {
            singers: populatedSingers,
            instrumentalists: populatedInstrumentalists
          }
        };
      });
      setSchedules(parsedSchedules || []);
    }
  }, [toast, allSongs, registeredUsers]); // allSongs e registeredUsers são dependências

  useEffect(() => {
    // Carrega músicas e usuários primeiro
    loadSongs();
    // O loadSchedules dependerá de allSongs e registeredUsers, então será chamado quando eles estiverem prontos
  }, [loadSongs]);

  useEffect(() => {
    // Chama loadSchedules quando allSongs e registeredUsers estiverem disponíveis/mudarem
    if (allSongs.length > 0 && registeredUsers.length > 0) {
        loadSchedules();
    }
  }, [allSongs, registeredUsers, loadSchedules]);


  const handleAddSchedule = () => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem criar escalas.", variant: "destructive" });
      return;
    }
    setCurrentScheduleData(null); // Indica que é uma nova escala
    setIsDialogOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem editar escalas.", variant: "destructive" });
      return;
    }
    // Passa o objeto schedule completo (no formato do frontend) para edição
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
      // Remove do estado local para atualização imediata
      setSchedules(schedules.filter(schedule => schedule.id !== id));
      toast({ title: "Escala removida", description: "A escala foi removida com sucesso." });
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (currentUser?.type !== 'leader') return;

    // Prepara os dados para o Supabase, mapeando para os nomes das colunas do banco
    const dataToSave = {
      scheduled_date: scheduleData.date.toISOString(), // Mapeia date para scheduled_date (string ISO)
      songs_assigned: scheduleData.songs, // Mapeia songs (array de IDs) para songs_assigned (jsonb)
      team_members: scheduleData.participants, // Mapeia participants (objeto de IDs) para team_members (jsonb)
      leader_id: currentUser.id, // Adiciona o ID do líder logado
      theme: scheduleData.theme || null, // Se você tiver um campo de tema no ScheduleDialog
      notes: scheduleData.notes || null // Se você tiver um campo de notas no ScheduleDialog
    };

    try {
      if (scheduleData.id) { // Se o ID existe, é uma edição
        const { error, data: updatedData } = await supabase
          .from('schedules')
          .update(dataToSave)
          .eq('id', scheduleData.id)
          .select(); // Retorna o registro atualizado

        if (error) throw error;

        // Após a atualização, recarrega todas as escalas para garantir consistência
        await loadSchedules();
        toast({ title: "Escala atualizada", description: "A escala foi atualizada com sucesso." });

      } else { // Caso contrário, é uma criação
        const { error, data: newData } = await supabase
          .from('schedules')
          .insert([dataToSave])
          .select(); // Retorna o registro inserido (com o novo ID)

        if (error) throw error;

        // Após a inserção, recarrega todas as escalas
        await loadSchedules();
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
        registeredUsers={registeredUsers} // Passa registeredUsers para ScheduleList se ela precisar mapear nomes
      />

      <ScheduleDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setCurrentScheduleData(null); }} // Zera currentScheduleData ao fechar
        schedule={currentScheduleData}
        onSave={handleSaveSchedule}
        allSongs={allSongs} // Passa todas as músicas carregadas do Supabase
        allUsers={registeredUsers || []} // Passa todos os usuários registrados
      />
    </div>
  );
};

export default ScheduleModule;
