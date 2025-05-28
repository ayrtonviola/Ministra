import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SongDialog = ({ isOpen, onOpenChange, song, onSave, isEditMode }) => {
  const { toast } = useToast();
  const initialSongState = {
    id: '', title: '', artist: '', notes: '', file: null, fileName: '', fileData: null, quizzes: []
  };
  const [currentSong, setCurrentSong] = useState(initialSongState);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (song) {
      setCurrentSong({ ...initialSongState, ...song, quizzes: song.quizzes || [] });
    } else {
      setCurrentSong({ ...initialSongState, id: Date.now().toString(), quizzes: [] });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [song, isOpen]);

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!currentSong.title) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título da música.",
        variant: "destructive"
      });
      return;
    }

    let fileDataToSave = currentSong.fileData; 
    if (currentSong.file && currentSong.file instanceof File) {
      fileDataToSave = await fileToDataUrl(currentSong.file);
    } else if (currentSong.file === null && currentSong.fileData) { 
      fileDataToSave = null; 
    }
    
    onSave({ ...currentSong, fileData: fileDataToSave });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCurrentSong(prev => ({ ...prev, file: file, fileName: file.name }));
    }
  };

  const handleRemoveFile = () => {
    setCurrentSong(prev => ({ ...prev, file: null, fileName: '', fileData: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Música' : 'Nova Música'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Nome da música"
              value={currentSong.title}
              onChange={(e) => setCurrentSong({ ...currentSong, title: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="artist">Artista/Ministério</Label>
            <Input
              id="artist"
              placeholder="Nome do artista ou ministério"
              value={currentSong.artist}
              onChange={(e) => setCurrentSong({ ...currentSong, artist: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (tom, cifra, observações)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Tom: G, Capotraste: 2ª casa, BPM: 75..."
              value={currentSong.notes}
              onChange={(e) => setCurrentSong({ ...currentSong, notes: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file-upload">Arquivo (PDF, áudio, etc.)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="bg-gray-800 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
              />
              {currentSong.fileName && (
                <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="text-red-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {currentSong.fileName && (
              <p className="text-xs text-gray-400 mt-1">Arquivo selecionado: {currentSong.fileName}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SongDialog;