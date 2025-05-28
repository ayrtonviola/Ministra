import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ScheduleList from '@/components/schedule/ScheduleList';
import ScheduleDialog from '@/components/schedule/ScheduleDialog';

const ScheduleModule = ({ currentUser, registeredUsers }) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  // const [allUsers, setAllUsers] = useState([]); // Replaced by registeredUsers prop
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentScheduleData, setCurrentScheduleData] = useState(null);

  const loadSchedules = useCallback(() => {
    const savedSchedules = localStorage.getItem('schedules_v2');
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules));
    }
  }, []);

  const loadSongs = useCallback(() => {
    const savedSongs = localStorage.getItem('songs_v2');
    if (savedSongs) {
      setAllSongs(JSON.parse(savedSongs));
    }
  }, []);

  // No longer loading users from 'app_users', using registeredUsers prop
  // const loadUsers = useCallback(() => {
  //   const savedUsers = localStorage.getItem('app_users'); // This was the old key
  //   if (savedUsers) {
  //     setAllUsers(JSON.parse(savedUsers));
  //   } else {
  //     // Default users are now handled by UserManagementModule or App.jsx initial load
  //   }
  // }, []);


  useEffect(() => {
    loadSchedules();
    loadSongs();
    // loadUsers(); // Removed
  }, [loadSchedules, loadSongs]);

  useEffect(() => {
    localStorage.setItem('schedules_v2', JSON.stringify(schedules));
  }, [schedules]);

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

  const handleDeleteSchedule = (id) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem remover escalas.", variant: "destructive" });
      return;
    }
    setSchedules(schedules.filter(schedule => schedule.id !== id));
    toast({
      title: "Escala removida",
      description: "A escala foi removida com sucesso.",
    });
  };

  const handleSaveSchedule = (scheduleData) => {
    if (isEditMode) {
      setSchedules(schedules.map(s =>
        s.id === scheduleData.id ? scheduleData : s
      ));
      toast({
        title: "Escala atualizada",
        description: "A escala foi atualizada com sucesso.",
      });
    } else {
      setSchedules([...schedules, { ...scheduleData, id: Date.now().toString() }]);
      toast({
        title: "Escala adicionada",
        description: "A nova escala foi adicionada com sucesso.",
      });
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
        allUsers={registeredUsers} 
      />
    </div>
  );
};

export default ScheduleModule;