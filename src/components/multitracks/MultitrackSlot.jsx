import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Edit, XCircle, ListMusic, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const SectionButton = ({ section, onClick, isActive, isNext }) => (
  <motion.button
    layout
    onClick={() => onClick(section)}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out
      ${isActive ? 'bg-yellow-500 text-black scale-105 shadow-lg' : 'bg-white/20 hover:bg-white/30'}
      ${isNext ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-800' : ''}
    `}
  >
    {section.name} {section.type === 'loop' && '(Loop)'}
  </motion.button>
);

const MultitrackSlot = ({ slot, onPlay, onEdit, onRemoveAudio, onOpenSectionSelector, onSelectNextSection, activeSectionName, nextSectionName }) => {
  const audioRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  useEffect(() => {
    if (slot.audioElement) {
      audioRef.current = slot.audioElement;
      const handleAudioEnd = () => {
        onPlay(slot.id, false, null); 
      };
      audioRef.current.addEventListener('ended', handleAudioEnd);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleAudioEnd);
        }
      };
    }
  }, [slot.audioElement, slot.id, onPlay]);

  const handlePlayClick = () => {
    if (slot.audioSrc && audioRef.current) {
      if (slot.isPlaying) {
        audioRef.current.pause();
        onPlay(slot.id, false, null);
      } else {
        onPlay(slot.id, true, slot.sections && slot.sections.length > 0 ? slot.sections[0] : null);
      }
    } else {
      onEdit(slot); 
    }
  };

  const handleMouseDown = () => {
    if (!slot.audioSrc || !slot.sections || slot.sections.length === 0) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      onOpenSectionSelector(slot.id);
    }, 700); 
  };

  const handleMouseUpOrLeave = () => {
    clearTimeout(longPressTimerRef.current);
    if (!isLongPressActive && slot.audioSrc) {
      
    }
    setIsLongPressActive(false);
  };
  
  const handleTouchStart = () => {
    if (!slot.audioSrc || !slot.sections || slot.sections.length === 0) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      onOpenSectionSelector(slot.id);
    }, 700);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimerRef.current);
    setIsLongPressActive(false);
  };


  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative"
    >
      <Card
        className="overflow-hidden border-0 shadow-lg"
        style={{ backgroundColor: `${slot.color}30`, borderColor: slot.color }}
      >
        <CardContent className="p-0">
          <div className="relative">
            <button
              className="w-full h-32 flex flex-col items-center justify-center text-white font-semibold text-lg focus:outline-none drumpad-button"
              style={{ backgroundColor: slot.color }}
              onClick={handlePlayClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              disabled={!slot.audioSrc && !slot.audioElement}
            >
              <Play className={`h-10 w-10 mb-1 ${slot.isPlaying ? 'text-yellow-400' : 'text-white'}`} />
              <span className="text-sm truncate w-full px-2">{slot.fileName || slot.name}</span>
              {activeSectionName && slot.isPlaying && (
                <span className="text-xs mt-1 px-2 py-0.5 bg-black/30 rounded">
                  {activeSectionName}
                  {nextSectionName && ` → ${nextSectionName}`}
                </span>
              )}
            </button>

            <div className="absolute top-2 right-2 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(slot)}
                className="h-7 w-7 bg-white/20 hover:bg-white/30 text-white"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              {slot.audioSrc && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveAudio(slot.id)}
                  className="h-7 w-7 bg-white/20 hover:bg-red-500/50 text-white"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
             {slot.sections && slot.sections.length > 0 && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenSectionSelector(slot.id)}
                    className="absolute bottom-2 right-2 h-7 w-7 bg-white/20 hover:bg-white/30 text-white"
                    title="Selecionar Seção"
                >
                    <ListMusic className="h-4 w-4" />
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


export const SectionSelectorDialog = ({ isOpen, onOpenChange, sections, onSelectSection, currentSlotName, activeSectionName, nextSectionName }) => {
  if (!sections) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-gray-800 to-gray-700 border border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Selecionar Seção para: {currentSlotName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {sections.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              <AnimatePresence>
                {sections.map((section) => (
                  <SectionButton
                    key={section.id}
                    section={section}
                    onClick={onSelectSection}
                    isActive={section.name === activeSectionName}
                    isNext={section.name === nextSectionName}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-center text-gray-400">Nenhuma seção definida para esta pista.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default MultitrackSlot;