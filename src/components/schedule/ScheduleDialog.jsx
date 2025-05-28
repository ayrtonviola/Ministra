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
    songs: [], // songs will be array of { title: string, key: string (optional) }
    participants: { singers: [], instrumentalists: [] }
  };
  const [currentSchedule, setCurrentSchedule] = useState(initialScheduleState);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]); // Array of { title: string, key: string (optional) }
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
      toast({ title: "Aviso", description: "Essa música já foi adicionada.", variant: "default"});
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
  
  const availableSingers = allUsers.filter(u => u.type === 'singer' || u.type === 'leader');
  const instrumentTypes = ['drummer', 'keyboardist', 'bassist', 'guitarist', 'acoustic_guitarist', 'other_instrumentalist', 'leader'];
  const availableInstrumentalists = allUsers.filter(u => instrumentTypes.includes(u.type));


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background text-foreground border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={currentSchedule.date}
                onChange={(e) => setCurrentSchedule({ ...currentSchedule, date: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Culto de Domingo"
                value={currentSchedule.title}
                onChange={(e) => setCurrentSchedule({ ...currentSchedule, title: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
          
          <div>
            <Label className="flex items-center gap-1"><Users className="h-4 w-4" />Participantes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="singers" className="text-sm text-muted-foreground">Cantores</Label>
                <div className="bg-input border border-border rounded-md p-2 max-h-[150px] overflow-y-auto mt-1">
                  {availableSingers.length > 0 ? availableSingers.map(user => (
                    <div key={user.id} 
                         className={`text-sm py-1 px-2 rounded cursor-pointer mb-1 ${selectedSingers.includes(user.name) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
                         onClick={() => handleParticipantSelection(user.name, 'singer')}>
                      {user.name}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">Nenhum cantor disponível.</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="instrumentalists" className="text-sm text-muted-foreground">Instrumentistas</Label>
                 <div className="bg-input border border-border rounded-md p-2 max-h-[150px] overflow-y-auto mt-1">
                  {availableInstrumentalists.length > 0 ? availableInstrumentalists.map(user => (
                    <div key={user.id} 
                         className={`text-sm py-1 px-2 rounded cursor-pointer mb-1 ${selectedInstrumentalists.includes(user.name) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
                         onClick={() => handleParticipantSelection(user.name, 'instrumentalist')}>
                      {user.name}
                    </div>
                  )) : <p className="text-xs text-muted-foreground">Nenhum instrumentista disponível.</p>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Músicas Selecionadas</Label>
            <div className="bg-input border border-border rounded-md p-2 min-h-[100px] max-h-[200px] overflow-y-auto mt-1">
              {selectedSongs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma música selecionada</p>
              ) : (
                <ul className="space-y-2">
                  {selectedSongs.map((song, index) => (
                    <li key={index} className="flex justify-between items-center text-sm py-1.5 px-2 rounded bg-secondary">
                      <span className="truncate mr-2">{song.title}</span>
                      <div className="flex items-center space-x-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-700">
                              {song.key || "Tom"} <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onSelect={() => handleSongKeyChange(song.title, null)} className="text-xs hover:bg-accent">
                              Nenhum
                            </DropdownMenuItem>
                            {musicKeys.map(mKey => (
                              <DropdownMenuItem 
                                key={mKey} 
                                onSelect={() => handleSongKeyChange(song.title, mKey)}
                                className="text-xs hover:bg-accent"
                              >
                                {mKey}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSongFromSchedule(song.title)} className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newSong">Adicionar Música Manualmente</Label>
            <div className="flex gap-2">
              <Input id="newSong" placeholder="Nome da música" value={newSongTitle} onChange={(e) => setNewSongTitle(e.target.value)} className="bg-input border-border text-foreground" />
              <Button onClick={handleAddSongToSchedule} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {allSongs && allSongs.length > 0 && (
            <div className="grid gap-2">
              <Label>Selecionar das Músicas Cadastradas</Label>
              <div className="bg-input border border-border rounded-md p-2 max-h-[150px] overflow-y-auto">
                <ul className="space-y-1">
                  {allSongs.map((song) => (
                    <li key={song.id} 
                        className={`text-sm py-1 px-2 rounded cursor-pointer ${selectedSongs.find(s => s.title === song.title) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
                        onClick={() => handleSelectExistingSong(song.title)}>
                      {song.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-accent">
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;