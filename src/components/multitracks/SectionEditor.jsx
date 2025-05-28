
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const SectionEditor = ({ section, onUpdate, onDelete }) => {
  const [name, setName] = useState(section.name);
  const [startMeasure, setStartMeasure] = useState(section.startMeasure);
  const [endMeasure, setEndMeasure] = useState(section.endMeasure);
  const [type, setType] = useState(section.type || 'normal');
  const { toast } = useToast();

  useEffect(() => {
    setName(section.name);
    setStartMeasure(section.startMeasure);
    setEndMeasure(section.endMeasure || '');
    setType(section.type || 'normal');
  }, [section]);

  const handleUpdate = () => {
    const parsedStartMeasure = parseInt(startMeasure, 10) || 1;
    let parsedEndMeasure = parseInt(endMeasure, 10) || null;

    if (type === 'loop' && (!parsedEndMeasure || parsedEndMeasure <= parsedStartMeasure)) {
        toast({
            title: "Erro na Seção de Loop",
            description: `Para "${name}", o compasso final deve ser maior que o inicial.`,
            variant: "destructive"
        });
        setEndMeasure(''); 
        parsedEndMeasure = null;
    }
    
    onUpdate(section.id, { name, startMeasure: parsedStartMeasure, endMeasure: type === 'loop' ? parsedEndMeasure : null, type });
  };

  return (
    <div className="flex flex-wrap items-end gap-2 p-3 border border-gray-700 rounded-md bg-gray-800/50">
      <div className="flex-grow min-w-[150px]">
        <Label htmlFor={`section-name-${section.id}`} className="text-xs">Nome</Label>
        <Input
          id={`section-name-${section.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleUpdate}
          placeholder="Ex: Refrão"
          className="bg-gray-700 border-gray-600 h-8 text-sm"
        />
      </div>
      <div className="w-28"> {/* Aumentado para caber 2 dígitos */}
        <Label htmlFor={`section-measure-${section.id}`} className="text-xs">Comp. Início</Label>
        <Input
          id={`section-measure-${section.id}`}
          type="number"
          min="1"
          value={startMeasure}
          onChange={(e) => setStartMeasure(e.target.value)}
          onBlur={handleUpdate}
          className="bg-gray-700 border-gray-600 h-8 text-sm"
        />
      </div>
      {type === 'loop' && (
        <div className="w-28"> {/* Aumentado para caber 2 dígitos */}
          <Label htmlFor={`section-end-measure-${section.id}`} className="text-xs">Comp. Fim (Loop)</Label>
          <Input
            id={`section-end-measure-${section.id}`}
            type="number"
            min={ (parseInt(startMeasure, 10) || 0) + 1 }
            value={endMeasure || ''}
            onChange={(e) => setEndMeasure(e.target.value)}
            onBlur={handleUpdate}
            className="bg-gray-700 border-gray-600 h-8 text-sm"
            placeholder="Fim"
          />
        </div>
      )}
      <div className="w-32">
        <Label htmlFor={`section-type-${section.id}`} className="text-xs">Tipo</Label>
         <Select value={type} onValueChange={(value) => { 
           const newType = value;
           setType(newType); 
           onUpdate(section.id, { name, startMeasure: parseInt(startMeasure, 10) || 1, endMeasure: newType === 'loop' ? (parseInt(endMeasure, 10) || null) : null, type: newType }); 
         }}>
          <SelectTrigger id={`section-type-${section.id}`} className="bg-gray-700 border-gray-600 h-8 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 text-white border-gray-600">
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="loop">Loop (Ministração)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(section.id)} className="text-red-500 hover:text-red-400 h-8 w-8 self-end">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SectionEditor;
