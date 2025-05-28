
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Music2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SectionEditor from '@/components/multitracks/SectionEditor';

const MultitrackDialog = ({ isOpen, onOpenChange, slot, onSave }) => {
  const { toast } = useToast();
  const [slotNameInput, setSlotNameInput] = useState('');
  const [bpmInput, setBpmInput] = useState('');
  const [sections, setSections] = useState([]);
  const [currentFileName, setCurrentFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (slot) {
      setSlotNameInput(slot.name || '');
      setBpmInput(slot.bpm || '');
      setSections(slot.sections || []);
      setCurrentFileName(slot.fileName || '');
    } else {
      setSlotNameInput('');
      setBpmInput('');
      setSections([]);
      setCurrentFileName('');
    }
    if (!isOpen && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [slot, isOpen]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'audio/wav' && file.type !== 'audio/wave') {
        toast({
          title: "Formato Inválido",
          description: "Por favor, selecione um arquivo .wav.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setCurrentFileName(file.name);
    }
  };

  const handleSaveAll = () => {
    if (!slotNameInput.trim()) {
      toast({ title: "Erro", description: "Nome da pista é obrigatório.", variant: "destructive" });
      return;
    }
    const parsedBpm = parseInt(bpmInput, 10);
    if (!parsedBpm || parsedBpm <= 0) {
      toast({ title: "Erro", description: "BPM inválido.", variant: "destructive" });
      return;
    }
    for (const s of sections) {
        if (!s.name.trim() || s.startMeasure <= 0) {
            toast({ title: "Erro na Seção", description: `Seção "${s.name || 'Nova Seção'}" deve ter nome e compasso de início válido.`, variant: "destructive" });
            return;
        }
        if (s.type === 'loop' && (!s.endMeasure || s.endMeasure <= s.startMeasure)) {
            toast({ title: "Erro na Seção de Loop", description: `Para "${s.name}", o compasso final (${s.endMeasure || 'N/A'}) deve ser maior que o compasso inicial (${s.startMeasure}).`, variant: "destructive" });
            return;
        }
    }


    const file = fileInputRef.current?.files?.[0];
    onSave(slot.id, slotNameInput, file, parsedBpm, sections);
    onOpenChange(false);
  };

  const handleAddSection = () => {
    setSections([...sections, { 
        id: `section-${Date.now()}`, 
        name: `Nova Seção ${sections.length + 1}`, 
        startMeasure: sections.length > 0 ? (sections[sections.length-1].endMeasure || sections[sections.length-1].startMeasure) + 1 : 1, 
        type: 'normal',
        endMeasure: null 
    }]);
  };

  const handleUpdateSection = (id, updatedData) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const handleDeleteSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Music2 /> Configurar Pista: {slot?.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Defina o nome, BPM, arquivo de áudio (.wav) e as seções da música.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="slotName">Nome da Pista</Label>
              <Input
                id="slotName"
                value={slotNameInput}
                onChange={(e) => setSlotNameInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Ex: Oceans"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bpm">BPM (Batidas por Minuto)</Label>
              <Input
                id="bpm"
                type="number"
                value={bpmInput}
                onChange={(e) => setBpmInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Ex: 75"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="audioFile">Arquivo de Áudio (.wav)</Label>
            <Input
              id="audioFile"
              type="file"
              accept=".wav,audio/wav,audio/wave"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="bg-gray-800 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
            />
            {currentFileName && (
              <p className="text-xs text-gray-400 mt-1">
                {slot?.fileName && fileInputRef.current?.files?.[0]?.name !== slot.fileName && slot.fileName !== currentFileName ? `Atual: ${slot.fileName} (Novo: ${currentFileName})` : `Arquivo: ${currentFileName}`}
              </p>
            )}
             {!currentFileName && slot?.fileName && (
                <p className="text-xs text-gray-400 mt-1">
                    Atual: {slot.fileName} (Nenhum novo arquivo selecionado)
                </p>
            )}
            <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded-md mt-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Certifique-se que o áudio .wav está sem silêncio no início para sincronia correta.</span>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center mb-2">
              <Label>Seções da Música</Label>
              <Button variant="outline" size="sm" onClick={handleAddSection} className="border-purple-600 text-purple-300 hover:bg-purple-700/50 hover:text-purple-200">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Seção
              </Button>
            </div>
            {sections.length > 0 ? (
              <div className="space-y-3">
                {sections.map((section) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onUpdate={handleUpdateSection}
                    onDelete={handleDeleteSection}
                    bpm={parseInt(bpmInput, 10)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma seção definida. Clique em "Adicionar Seção".</p>
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
            onClick={handleSaveAll}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações da Pista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultitrackDialog;
