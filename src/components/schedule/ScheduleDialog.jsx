
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, X, Users, Music2, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const musicKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const ScheduleDialog = ({ isOpen, onOpenChange, schedule, onSave, isEditMode, allSongs, allUsers }) => {
  const { toast } = useToast();
  const initialScheduleState = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    songs: [],
    participants: { singers: [], instrumentalists: [] }
  };
  const [currentSchedule, setCurrentSchedule] = useState(initialScheduleState);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [selectedSingers, setSelectedSingers] = useState([]);
  const [selectedInstrumentalists, setSelectedInstrumentalists] = useState([]);

  useEffect(() => {
    if (schedule) {
      setCurrentSchedule({
        ...initialScheduleState,
        ...schedule,
        songs: schedule.songs || [],
        participants: schedule.participants || { singers: [], instrumentalists: [] }
      });
      setSelectedSongs(schedule.songs || []);
      setSelectedSingers(schedule.participants?.singers || []);
      setSelectedInstrumentalists(schedule.participants?.instrumentalists || []);
    } else {
      setCurrentSchedule({ ...initialScheduleState, id: Date.now().toString() });
      setSelectedSongs([]);
      setSelectedSingers([]);
      setSelectedInstrumentalists([]);
    }
  }, [schedule, isOpen]);

  const handleSave = () => {
    if (!currentSchedule.title) {
      toast({ title: "Erro", description: "Por favor, preencha o título da escala.", variant: "destructive" });
      return;
    }
    if (selectedSongs.length === 0) {
      toast({ title: "Erro", description: "Por favor, adicione pelo menos uma música à escala.", variant: "destructive" });
      return;
    }
    onSave({
      ...currentSchedule,
      songs: selectedSongs,
      participants: { singers: selectedSingers, instrumentalists: selectedInstrumentalists }
    });
  };

  const handleAddSongToSchedule = () => {
    if (newSongTitle.trim() !== '' && !selectedSongs.find(song => song.title === newSongTitle.trim())) {
      setSelectedSongs([...selectedSongs, { title: newSongTitle.trim(), key: null }]);
      setNewSongTitle('');
    } else if (selectedSongs.find(song => song.title === newSongTitle.trim())) {
      toast({ title: "Aviso", description: "Essa música já foi adicionada.", variant: "default" });
    }
  };

  const handleRemoveSongFromSchedule = (songTitle) => {
    setSelectedSongs(selectedSongs.filter(s => s.title !== songTitle));
  };

  const handleSelectExistingSong = (songTitle) => {
    const isSelected = selectedSongs.find(s => s.title === songTitle);
    if (isSelected) {
      setSelectedSongs(prev => prev.filter(s => s.title !== songTitle));
    } else {
      setSelectedSongs(prev => [...prev, { title: songTitle, key: null }]);
    }
  };

  const handleSongKeyChange = (songTitle, musicKey) => {
    setSelectedSongs(prevSongs =>
      prevSongs.map(song =>
        song.title === songTitle ? { ...song, key: musicKey } : song
      )
    );
  };

  const handleParticipantSelection = (participantName, type) => {
    if (type === 'singer') {
      setSelectedSingers(prev =>
        prev.includes(participantName) ? prev.filter(p => p !== participantName) : [...prev, participantName]
      );
    } else if (type === 'instrumentalist') {
      setSelectedInstrumentalists(prev =>
        prev.includes(participantName) ? prev.filter(p => p !== participantName) : [...prev, participantName]
      );
    }
  };

  const availableSingers = Array.isArray(allUsers)
    ? allUsers.filter(u => u.type === 'singer' || u.type === 'leader')
    : [];

  const instrumentTypes = ['drummer', 'keyboardist', 'bassist', 'guitarist', 'acoustic_guitarist', 'other_instrumentalist', 'leader'];

  const availableInstrumentalists = Array.isArray(allUsers)
    ? allUsers.filter(u => instrumentTypes.includes(u.type))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background text-foreground border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
        </DialogHeader>
        ...
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
