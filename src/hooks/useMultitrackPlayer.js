import { useCallback } from 'react';

export const useMultitrackPlayer = (slots, setSlots) => {

  const stopAudio = useCallback((slotId) => {
    setSlots(prevSlots => prevSlots.map(s => {
      if (s.id === slotId && s.audioElement) {
        s.audioElement.pause();
        if (s.playbackIntervalId) clearInterval(s.playbackIntervalId);
        if (s.seekTimeoutId) clearTimeout(s.seekTimeoutId);
        return { ...s, isPlaying: false, playbackIntervalId: null, seekTimeoutId: null, nextSection: null, currentSection: null };
      }
      return s;
    }));
  }, [setSlots]);
  
  const playSection = useCallback((slotId, section) => {
    setSlots(prevSlots => {
      return prevSlots.map(s => {
        if (s.id === slotId) {
          if (s.audioElement && section && (s.measureDuration > 0 || section.type === 'full_track_no_bpm')) {
            const startTime = (section.startMeasure && s.measureDuration > 0) ? (section.startMeasure - 1) * s.measureDuration : 0;
            s.audioElement.currentTime = startTime;
            
            const playPromise = s.audioElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Error playing audio:", error);
                    stopAudio(s.id); 
                });
            }

            if (s.playbackIntervalId) clearInterval(s.playbackIntervalId);
            
            let newIntervalId = null;
            if (s.measureDuration > 0) { 
              newIntervalId = setInterval(() => {
                const currentSlotState = slots.find(slot => slot.id === slotId); 
                if (!currentSlotState || !currentSlotState.isPlaying || !currentSlotState.audioElement || !currentSlotState.currentSection || currentSlotState.measureDuration <= 0) {
                  if (newIntervalId) clearInterval(newIntervalId);
                  return;
                }

                const audio = currentSlotState.audioElement;
                const currentMeasure = Math.floor(audio.currentTime / currentSlotState.measureDuration) + 1;

                if (currentMeasure !== currentSlotState.lastMeasurePlayed) {
                    setSlots(prev => prev.map(ps => ps.id === slotId ? {...ps, lastMeasurePlayed: currentMeasure} : ps));
                }
                
                const currentSectionDetails = currentSlotState.sections.find(sec => sec.id === currentSlotState.currentSection.id);

                if (currentSectionDetails?.type === 'loop') {
                  const loopStart = (currentSectionDetails.startMeasure - 1) * currentSlotState.measureDuration;
                  const loopEnd = (currentSectionDetails.endMeasure || (audio.duration / currentSlotState.measureDuration)) * currentSlotState.measureDuration;
                  if (audio.currentTime >= loopEnd - 0.15) { 
                    audio.currentTime = loopStart;
                  }
                } else if (currentSectionDetails) {
                  const sectionNaturalEndMeasure = currentSlotState.sections
                      .filter(sec => sec.startMeasure > currentSectionDetails.startMeasure)
                      .sort((a,b) => a.startMeasure - b.startMeasure)[0]?.startMeasure -1 || 
                      Math.floor(audio.duration / currentSlotState.measureDuration) ;

                  if (currentMeasure >= sectionNaturalEndMeasure && !currentSlotState.nextSection) {
                      if (currentMeasure >= Math.floor(audio.duration / currentSlotState.measureDuration) || 
                          currentSectionDetails.id === currentSlotState.sections[currentSlotState.sections.length - 1].id) {
                          stopAudio(slotId);
                          return;
                      }
                  }
                }
              }, 50); 
            }


            return { ...s, isPlaying: true, currentSection: section, nextSection: null, lastMeasurePlayed: section.startMeasure || 1, playbackIntervalId: newIntervalId, seekTimeoutId: null };
          }
          return { ...s, isPlaying: false, currentSection: null, playbackIntervalId: null, seekTimeoutId: null }; 
        }
        
        if (s.isPlaying && s.id !== slotId && s.audioElement) {
          s.audioElement.pause();
          if (s.playbackIntervalId) clearInterval(s.playbackIntervalId);
          if (s.seekTimeoutId) clearTimeout(s.seekTimeoutId);
          return { ...s, isPlaying: false, currentSection: null, playbackIntervalId: null, seekTimeoutId: null, nextSection: null };
        }
        return s;
      });
    });
  }, [setSlots, slots, stopAudio]);


  const setSlotNextSection = useCallback((slotId, nextSectionToQueue) => {
    // Instant transition: stop current section if any and play the new one immediately.
    // No need to wait for end of measure.
    const currentSlot = slots.find(s => s.id === slotId);
    if(currentSlot && currentSlot.isPlaying && currentSlot.audioElement) {
        currentSlot.audioElement.pause(); 
        if (currentSlot.playbackIntervalId) clearInterval(currentSlot.playbackIntervalId);
        if (currentSlot.seekTimeoutId) clearTimeout(currentSlot.seekTimeoutId);
    }
    playSection(slotId, nextSectionToQueue);
    
    // Update the state to clear any pending nextSection, as it's now the currentSection
    setSlots(prevSlots => prevSlots.map(s => 
        s.id === slotId ? { ...s, nextSection: null, seekTimeoutId: null } : s
    ));

  }, [setSlots, playSection, slots]);

  return { playSection, stopAudio, setSlotNextSection };
};
