import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Para o campo de tema
import { Textarea } from '@/components/ui/textarea'; // Para o campo de notas
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale'
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
    id: null, // ID é nulo para novas escalas (Supabase gera UUID)
    date: new Date(),
    songs: [], // IDs das músicas
    participants: {
      singers: [], // IDs dos cantores
      instrumentalists: [] // IDs dos instrumentalistas
    },
    theme: '', // Novo campo para tema
    notes: '' // Novo campo para notas
  };

  const [currentSchedule, setCurrentSchedule] = useState(initialScheduleState);
  const [selectedSongs, setSelectedSongs] = useState([]); // Guarda IDs de músicas
  const [selectedSingers, setSelectedSingers] = useState([]); // Guarda IDs de cantores
  const [selectedInstrumentalists, setSelectedInstrumentalists] = useState([]); // Guarda IDs de instrumentalistas

  useEffect(() => {
    if (schedule) {
      // No modo de edição, schedule.songs e schedule.participants vêm populados com objetos/nomes.
      // Precisamos convertê-los de volta para IDs para os estados de seleção.
      const songsToSelect = Array.isArray(schedule.songs) ? schedule.songs.map(s => s.id).filter(Boolean) : [];
      const singersToSelect = Array.isArray(schedule.participants?.singers)
        ? schedule.participants.singers.map(name => allUsers.find(u => u.full_name === name)?.id).filter(Boolean)
        : [];
      const instrumentalistsToSelect = Array.isArray(schedule.participants?.instrumentalists)
        ? schedule.participants.instrumentalists.map(name => allUsers.find(u => u.full_name === name)?.id).filter(Boolean)
        : [];

      setCurrentSchedule({
        ...initialScheduleState, // Reseta para garantir campos padrão
        ...schedule, // Sobrescreve com dados da escala
        date: schedule.date instanceof Date ? schedule.date : new Date(schedule.date), // Garante que é um objeto Date
        // Os campos `songs` e `participants` em `currentSchedule` devem ser IDs para salvar
        songs: songsToSelect,
        participants: {
            singers: singersToSelect,
            instrumentalists: instrumentalistsToSelect
        },
        theme: schedule.theme || '', // Popula o tema
        notes: schedule.notes || '' // Popula as notas
      });

      setSelectedSongs(songsToSelect);
      setSelectedSingers(singersToSelect);
      setSelectedInstrumentalists(instrumentalistsToSelect);
    } else {
      setCurrentSchedule(initialScheduleState); // Para nova escala, reinicia para o estado inicial
      setSelectedSongs([]);
      setSelectedSingers([]);
      setSelectedInstrumentalists([]);
    }
  }, [schedule, isOpen, allUsers, allSongs]); // Adicione allUsers e allSongs como dependências

  const handleSave = () => {
    const updatedSchedule = {
      ...currentSchedule,
      // As variáveis de estado 'selected...' já contêm os IDs, que é o que o Supabase espera.
      songs: selectedSongs,
      participants: {
        singers: selectedSingers,
        instrumentalists: selectedInstrumentalists
      }
    };
    onSave(updatedSchedule);
  };

  // Esta função agora trabalha apenas com IDs
  const toggleSelection = (id, list, setList) => {
    if (list.includes(id)) {
      setList(list.filter(i => i !== id));
    } else {
      setList([...list, id]);
    }
  };

  // Filtra usuários disponíveis para seleção, usando user.full_name
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
          <DialogTitle>{currentSchedule.id ? 'Editar Escala' : 'Criar Escala'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="schedule-date">Data</Label>
            <Calendar
              id="schedule-date"
              mode="single"
              selected={currentSchedule.date}
              onSelect={(date) => setCurrentSchedule({ ...currentSchedule, date: date || new Date() })}
              locale={ptBR}
              className="rounded-md border mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {format(currentSchedule.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <div>
            <Label htmlFor="schedule-theme">Tema da Escala (Opcional)</Label>
            <Input
              id="schedule-theme"
              type="text"
              value={currentSchedule.theme}
              onChange={(e) => setCurrentSchedule({ ...currentSchedule, theme: e.target.value })}
              placeholder="Ex: Culto de Louvor"
              className="mt-1"
            />

            <Label htmlFor="schedule-notes" className="mt-4 block">Notas (Opcional)</Label>
            <Textarea
              id="schedule-notes"
              value={currentSchedule.notes}
              onChange={(e) => setCurrentSchedule({ ...currentSchedule, notes: e.target.value })}
              placeholder="Adicione notas sobre a escala..."
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Músicas</Label>
            <div className="border rounded-md p-2 h-64 overflow-y-auto">
              {Array.isArray(allSongs) && allSongs.length > 0 ? (
                allSongs.map((song) => (
                  <div key={song.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`song-${song.id}`}
                      checked={selectedSongs.includes(song.id)}
                      onChange={() => toggleSelection(song.id, selectedSongs, setSelectedSongs)}
                      className="form-checkbox h-4 w-4 text-purple-600 rounded"
                    />
                    <Label htmlFor={`song-${song.id}`} className="text-sm cursor-pointer">
                      {song.title} {song.artist && `(${song.artist})`}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma música disponível.</p>
              )}
            </div>
          </div>

          <div>
            <Label>Voz</Label>
            <div className="border rounded-md p-2 h-64 overflow-y-auto">
              {availableSingers.length > 0 ? (
                availableSingers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`singer-${user.id}`}
                      checked={selectedSingers.includes(user.id)}
                      onChange={() => toggleSelection(user.id, selectedSingers, setSelectedSingers)}
                      className="form-checkbox h-4 w-4 text-purple-600 rounded"
                    />
                    <Label htmlFor={`singer-${user.id}`} className="text-sm cursor-pointer">
                      {user.full_name || user.email} {/* Exibe full_name ou email */}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum cantor disponível.</p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <Label>Instrumentos</Label>
          <div className="border rounded-md p-2 h-64 overflow-y-auto">
            {availableInstrumentalists.length > 0 ? (
              availableInstrumentalists.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id={`instrumentalist-${user.id}`}
                    checked={selectedInstrumentalists.includes(user.id)}
                    onChange={() => toggleSelection(user.id, selectedInstrumentalists, setSelectedInstrumentalists)}
                    className="form-checkbox h-4 w-4 text-purple-600 rounded"
                  />
                  <Label htmlFor={`instrumentalist-${user.id}`} className="text-sm cursor-pointer">
                    {user.full_name || user.email} ({user.type}) {/* Exibe full_name ou email */}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum instrumentista disponível.</p>
            )}
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
