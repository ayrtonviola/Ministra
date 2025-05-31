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
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentScheduleData, setCurrentScheduleData] = useState(null);

  const loadSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      toast({
        title: 'Erro ao carregar escalas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSchedules(data || []);
    }
  }, [toast]);

  const loadSongs = useCallback(() => {
    const savedSongs = localStorage.getItem('songs_v2');
    if (savedSongs) {
      setAllSongs(JSON.parse(savedSongs));
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    loadSongs();
  }, [loadSchedules, loadSongs]);

  const handleAddSchedule = () => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem criar escalas.", variant: "destructive" });
      return;
    }
    setIsEditMode(false);
    setCurrentScheduleData(null);
    setIsDialogOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem editar escalas.", variant: "destructive" });
      return;
    }
    setIsEditMode(true);
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

    if (isEditMode) {
      const { error } = await supabase
        .from('schedules')
        .update(scheduleData)
        .eq('id', scheduleData.id);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        await loadSchedules();
        toast({ title: "Escala atualizada", description: "A escala foi atualizada com sucesso." });
      }
    } else {
      const { error } = await supabase
        .from('schedules')
        .insert([{ ...scheduleData }]);

      if (error) {
        toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
      } else {
        await loadSchedules();
        toast({ title: "Escala adicionada", description: "A nova escala foi adicionada com sucesso." });
      }
    }

    setIsDialogOpen(false);
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
      />

      <ScheduleDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        schedule={currentScheduleData}
        onSave={handleSaveSchedule}
        isEditMode={isEditMode}
        allSongs={allSongs}
        allUsers={registeredUsers || []}
      />
    </div>
  );
};

export default ScheduleModule;
