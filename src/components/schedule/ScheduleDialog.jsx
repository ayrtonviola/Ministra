import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

const instrumentTypes = [
  'guitar',
  'bass',
  'keyboard',
  'drums',
  'other'
];

export default function ScheduleDialog({ isOpen, onClose, onSave, schedule, allSongs, allUsers }) {
  const initialScheduleState = {
    id: '',
    date: new Date(),
    songs: [],
    participants: {
      singers: [],
      instrumentalists: []
    }
  };

  const [currentSchedule, setCurrentSchedule] = useState(initialScheduleState);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [selectedSingers, setSelectedSingers] = useState([]);
  const [selectedInstrumentalists, setSelectedInstrumentalists] = useState([]);

  useEffect(() => {
    if (schedule) {
      const songsSafe = Array.isArray(schedule.songs) ? schedule.songs : [];
      const participantsSafe = typeof schedule.participants === 'object' && schedule.participants !== null
        ? schedule.participants
        : { singers: [], instrumentalists: [] };

      setCurrentSchedule({
        ...initialScheduleState,
        ...schedule,
        songs: songsSafe,
        participants: {
          singers: Array.isArray(participantsSafe.singers) ? participantsSafe.singers : [],
          instrumentalists: Array.isArray(participantsSafe.instrumentalists) ? participantsSafe.instrumentalists : []
        }
      });

      setSelectedSongs(songsSafe);
      setSelectedSingers(Array.isArray(participantsSafe.singers) ? participantsSafe.singers : []);
      setSelectedInstrumentalists(Array.isArray(participantsSafe.instrumentalists) ? participantsSafe.instrumentalists : []);
    } else {
      setCurrentSchedule({ ...initialScheduleState, id: Date.now().toString() });
      setSelectedSongs([]);
      setSelectedSingers([]);
      setSelectedInstrumentalists([]);
    }
  }, [schedule, isOpen]);

  const handleSave = () => {
    const updatedSchedule = {
      ...currentSchedule,
      songs: selectedSongs,
      participants: {
        singers: selectedSingers,
        instrumentalists: selectedInstrumentalists
      }
    };
    onSave(updatedSchedule);
  };

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const availableSingers = Array.isArray(allUsers)
    ? allUsers.filter(u => u && typeof u === 'object' && (u.type === 'singer' || u.type === 'leader'))
    : [];

  const availableInstrumentalists = Array.isArray(allUsers)
    ? allUsers.filter(u => u && typeof u === 'object' && instrumentTypes.includes(u.type))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>Criar Escala</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data</Label>
            <Calendar
              mode="single"
              selected={currentSchedule.date}
              onSelect={(date) => setCurrentSchedule({ ...currentSchedule, date })}
              locale={ptBR}
              className="rounded-md border"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {format(currentSchedule.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <div>
            <Label>Músicas</Label>
            <div className="border rounded-md p-2 h-64 overflow-y-auto">
              {Array.isArray(allSongs) && allSongs.map((song) => (
                <div key={song.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedSongs.includes(song.id)}
                    onChange={() => toggleSelection(song.id, selectedSongs, setSelectedSongs)}
                  />
                  <span>{song.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Voz</Label>
            <div className="border rounded-md p-2 h-64 overflow-y-auto">
              {availableSingers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedSingers.includes(user.id)}
                    onChange={() => toggleSelection(user.id, selectedSingers, setSelectedSingers)}
                  />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Instrumentos</Label>
            <div className="border rounded-md p-2 h-64 overflow-y-auto">
              {availableInstrumentalists.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedInstrumentalists.includes(user.id)}
                    onChange={() => toggleSelection(user.id, selectedInstrumentalists, setSelectedInstrumentalists)}
                  />
                  <span>{user.name} ({user.type})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
