import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import MultitrackSlot, { SectionSelectorDialog } from '@/components/multitracks/MultitrackSlot';
import MultitrackDialog from '@/components/multitracks/MultitrackDialog';
import { useMultitrackPlayer } from '@/hooks/useMultitrackPlayer'; 

const INITIAL_SLOT_COUNT = 5;

const getRandomColor = () => {
  const colors = ['#4f46e5', '#7c3aed', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getDefaultSlots = () => {
  return Array.from({ length: INITIAL_SLOT_COUNT }, (_, i) => ({
    id: `slot-${i + 1}`,
    name: `Pista ${i + 1}`,
    audioSrc: null,
    fileName: null,
    audioElement: null,
    isPlaying: false,
    color: getRandomColor(),
    bpm: null,
    sections: [], 
    currentSection: null, 
    nextSection: null, 
    lastMeasurePlayed: 0,
    measureDuration: 0,
    playbackIntervalId: null,
    seekTimeoutId: null,
  }));
};

const MultitracksModule = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState(getDefaultSlots());
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSectionSelectorOpen, setIsSectionSelectorOpen] = useState(false);
  const [currentSlotEditing, setCurrentSlotEditing] = useState(null);
  const [slotForSectionSelector, setSlotForSectionSelector] = useState(null);
  
  const { playSection, stopAudio, setSlotNextSection } = useMultitrackPlayer(slots, setSlots);

  const loadSlots = useCallback(() => {
    const savedSlots = localStorage.getItem('multitrackSlots_v4');
    if (savedSlots) {
      try {
        const parsedSlots = JSON.parse(savedSlots);
        const loadedSlots = parsedSlots.map(s => ({
          ...getDefaultSlots().find(ds => ds.id === s.id), 
          ...s,
          audioElement: s.audioSrc ? new Audio(s.audioSrc) : null,
          isPlaying: false, 
          currentSection: null,
          nextSection: null,
          lastMeasurePlayed: 0,
          measureDuration: s.bpm ? (60 / s.bpm) * 4 : 0, 
          playbackIntervalId: null,
          seekTimeoutId: null,
        }));
        setSlots(loadedSlots);
      } catch (error) {
        console.error("Failed to parse multitrack slots from localStorage:", error);
        setSlots(getDefaultSlots());
      }
    } else {
      setSlots(getDefaultSlots());
    }
  }, []);

  useEffect(() => {
    loadSlots();
    return () => {
        slots.forEach(slot => {
            if (slot.playbackIntervalId) clearInterval(slot.playbackIntervalId);
            if (slot.seekTimeoutId) clearTimeout(slot.seekTimeoutId);
            if (slot.audioElement) {
                slot.audioElement.pause();
                slot.audioElement.src = ''; 
            }
        });
    };
  }, [loadSlots]);

  useEffect(() => {
    const slotsToSave = slots.map(s => ({
      id: s.id,
      name: s.name,
      audioSrc: s.audioSrc,
      fileName: s.fileName,
      color: s.color,
      bpm: s.bpm,
      sections: s.sections,
    }));
    localStorage.setItem('multitrackSlots_v4', JSON.stringify(slotsToSave));
  }, [slots]);

  const handlePlaySlot = useCallback((slotId, playStatus, initialSection = null) => {
    const targetSlot = slots.find(s => s.id === slotId);
    if (!targetSlot) return;

    if (playStatus && targetSlot.audioElement) {
      const sectionToPlay = initialSection || targetSlot.currentSection || (targetSlot.sections && targetSlot.sections[0]);
      if (sectionToPlay) {
        playSection(slotId, sectionToPlay);
      } else {
        targetSlot.audioElement.currentTime = 0;
        targetSlot.audioElement.play().catch(e => console.error("Error playing audio:", e));
        setSlots(prev => prev.map(s => s.id === slotId ? { ...s, isPlaying: true, currentSection: null } : s));
      }
    } else if (targetSlot.audioElement) {
      stopAudio(slotId);
    }
  }, [slots, playSection, stopAudio, setSlots]);

  const handleSelectNextSection = useCallback((slotId, section) => {
    setSlotNextSection(slotId, section);
    setIsSectionSelectorOpen(false);
  }, [setSlotNextSection, setIsSectionSelectorOpen]);


  const handleEditSlot = (slot) => {
    setCurrentSlotEditing(slot);
    setIsConfigDialogOpen(true);
  };

  const handleRemoveAudio = (slotId) => {
    stopAudio(slotId); 
    setSlots(prevSlots =>
      prevSlots.map(s => {
        if (s.id === slotId) {
          if (s.audioSrc) URL.revokeObjectURL(s.audioSrc);
          return {
            ...getDefaultSlots().find(ds => ds.id === slotId),
            id:s.id, 
            color:s.color,
            name: `Pista ${s.id.split('-')[1]}`
          };
        }
        return s;
      })
    );
    toast({
      title: "Áudio removido",
      description: "O áudio e suas configurações foram removidos da pista.",
    });
  };

  const handleSaveSlot = (slotId, newName, newFile, newBpm, newSections) => {
    setSlots(prevSlots =>
      prevSlots.map(s => {
        if (s.id === slotId) {
          if (s.playbackIntervalId) clearInterval(s.playbackIntervalId);
          if (s.seekTimeoutId) clearTimeout(s.seekTimeoutId);
          if (s.audioElement) s.audioElement.pause();

          let newAudioSrc = s.audioSrc;
          let newFileName = s.fileName;
          let newAudioElement = s.audioElement;

          if (newFile) {
            if (s.audioSrc) URL.revokeObjectURL(s.audioSrc);
            newAudioSrc = URL.createObjectURL(newFile);
            newFileName = newFile.name;
            newAudioElement = new Audio(newAudioSrc);
          } else if (!newAudioSrc && s.audioSrc) { 
            newAudioElement = new Audio(s.audioSrc);
          }
          
          return {
            ...s,
            name: newName,
            audioSrc: newAudioSrc,
            fileName: newFileName,
            audioElement: newAudioElement,
            isPlaying: false,
            bpm: newBpm,
            sections: newSections.sort((a, b) => a.startMeasure - b.startMeasure),
            measureDuration: newBpm ? (60 / newBpm) * 4 : 0,
            currentSection: null,
            nextSection: null,
            playbackIntervalId: null,
            seekTimeoutId: null,
          };
        }
        return s;
      })
    );
    toast({
      title: "Pista atualizada",
      description: `${newName} foi configurada com sucesso.`,
    });
  };

  const handleOpenSectionSelector = (slotId) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot && slot.sections && slot.sections.length > 0) {
      setSlotForSectionSelector(slot);
      setIsSectionSelectorOpen(true);
    } else {
      toast({ title: "Sem Seções", description: "Configure as seções da pista primeiro.", variant: "default" });
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Multitracks Dinâmicas</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {slots.map((slot) => (
          <MultitrackSlot
            key={slot.id}
            slot={slot}
            onPlay={handlePlaySlot}
            onEdit={handleEditSlot}
            onRemoveAudio={handleRemoveAudio}
            onOpenSectionSelector={handleOpenSectionSelector}
            onSelectNextSection={(section) => handleSelectNextSection(slot.id, section)}
            activeSectionName={slot.currentSection?.name}
            nextSectionName={slot.nextSection?.name}
          />
        ))}
      </div>
      <MultitrackDialog
        isOpen={isConfigDialogOpen}
        onOpenChange={(isOpen) => {
          setIsConfigDialogOpen(isOpen);
          if (!isOpen) setCurrentSlotEditing(null);
        }}
        slot={currentSlotEditing}
        onSave={handleSaveSlot}
      />
      <SectionSelectorDialog
        isOpen={isSectionSelectorOpen}
        onOpenChange={setIsSectionSelectorOpen}
        sections={slotForSectionSelector?.sections}
        onSelectSection={(section) => handleSelectNextSection(slotForSectionSelector.id, section)}
        currentSlotName={slotForSectionSelector?.name}
        activeSectionName={slotForSectionSelector?.currentSection?.name}
        nextSectionName={slotForSectionSelector?.nextSection?.name}
      />
    </div>
  );
};

export default MultitracksModule;