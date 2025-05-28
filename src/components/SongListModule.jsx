
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Music, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import SongCard from '@/components/songlist/SongCard';
import SongDialog from '@/components/songlist/SongDialog';
import QuizCreatorDialog from '@/components/quiz/QuizCreatorDialog';
import QuizPlayerDialog from '@/components/quiz/QuizPlayerDialog';
import { dataUrlToFile } from '@/lib/fileUtils';

const SongListModule = ({ currentUser }) => {
  const { toast } = useToast();
  const [songs, setSongs] = useState([]);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [isQuizCreatorOpen, setIsQuizCreatorOpen] = useState(false);
  const [isQuizPlayerOpen, setIsQuizPlayerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSongData, setCurrentSongData] = useState(null);
  const [songForQuiz, setSongForQuiz] = useState(null);

  const loadSongs = useCallback(() => {
    const savedSongs = localStorage.getItem('songs_v2');
    if (savedSongs) {
      const parsedSongs = JSON.parse(savedSongs).map(song => ({
        ...song,
        file: song.fileData ? dataUrlToFile(song.fileData, song.fileName) : null,
        quizzes: song.quizzes || [] 
      }));
      setSongs(parsedSongs);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  useEffect(() => {
    const songsToSave = songs.map(song => {
      const { file, ...songData } = song; 
      return { ...songData, fileData: song.fileData, quizzes: song.quizzes || [] }; 
    });
    localStorage.setItem('songs_v2', JSON.stringify(songsToSave));
  }, [songs]);

  const handleAddSong = () => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem adicionar músicas.", variant: "destructive" });
      return;
    }
    setIsEditMode(false);
    setCurrentSongData(null);
    setIsSongDialogOpen(true);
  };

  const handleEditSong = (song) => {
     if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem editar músicas.", variant: "destructive" });
      return;
    }
    setIsEditMode(true);
    setCurrentSongData(song);
    setIsSongDialogOpen(true);
  };

  const handleDeleteSong = (id) => {
    if (currentUser?.type !== 'leader') {
      toast({ title: "Acesso Negado", description: "Apenas líderes podem remover músicas.", variant: "destructive" });
      return;
    }
    setSongs(songs.filter(song => song.id !== id));
    toast({ title: "Música removida", description: "A música foi removida com sucesso." });
  };

  const handleSaveSong = async (songData) => {
    const { file, ...dataToSave } = songData; 
  
    if (isEditMode) {
      setSongs(songs.map(s =>
        s.id === dataToSave.id ? { ...s, ...dataToSave, quizzes: s.quizzes || [] } : s
      ));
      toast({ title: "Música atualizada", description: "A música foi atualizada com sucesso." });
      setIsSongDialogOpen(false);
    } else {
      const newSong = { ...dataToSave, id: Date.now().toString(), quizzes: [] };
      setSongs([...songs, newSong]);
      toast({ title: "Música adicionada", description: "A nova música foi adicionada com sucesso." });
      setIsSongDialogOpen(false);
      
      if (currentUser?.type === 'leader') {
        setSongForQuiz(newSong);
        setIsQuizCreatorOpen(true); 
      }
    }
  };

  const handleSaveAllQuizzesForSong = (songId, quizzesArray) => {
    setSongs(prevSongs => prevSongs.map(song => {
      if (song.id === songId) {
        return { ...song, quizzes: quizzesArray }; // Replace all quizzes for the song
      }
      return song;
    }));
    toast({ title: "Quizzes Salvos!", description: `Quizzes para "${songForQuiz?.title}" foram salvos.` });
    setIsQuizCreatorOpen(false);
    setSongForQuiz(null);
  };

  const handleOpenQuizPlayer = (song) => {
    if (!song.quizzes || song.quizzes.length === 0) {
      toast({ title: "Sem Quiz", description: "Nenhum quiz disponível para esta música.", variant: "default" });
      return;
    }
    setCurrentSongData(song); 
    setIsQuizPlayerOpen(true);
  };
  
  const handleQuizComplete = (songId, score, totalQuestions) => {
    const songTitle = songs.find(s => s.id === songId)?.title || "a música";
    toast({
        title: "Quiz Finalizado!",
        description: `Você acertou ${score} de ${totalQuestions} perguntas para ${songTitle}.`,
        variant: score === totalQuestions ? "default" : "destructive",
        icon: score === totalQuestions ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
    });

    const quizScores = JSON.parse(localStorage.getItem('quizScores_v2') || '{}');
    if (!quizScores[currentUser.id]) quizScores[currentUser.id] = {};
    if (!quizScores[currentUser.id][songId]) quizScores[currentUser.id][songId] = { attempts: 0, bestScore: 0, totalQuestions: 0 };
    
    quizScores[currentUser.id][songId].attempts += 1;
    quizScores[currentUser.id][songId].totalQuestions = totalQuestions;
    if (score > (quizScores[currentUser.id][songId].bestScore || 0) ) {
        quizScores[currentUser.id][songId].bestScore = score;
    }
    localStorage.setItem('quizScores_v2', JSON.stringify(quizScores));
  };


  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (song.notes && song.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Músicas para Aprender</h2>
        {currentUser?.type === 'leader' && (
          <Button onClick={handleAddSong} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Nova Música
          </Button>
        )}
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="search"
          placeholder="Buscar músicas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {filteredSongs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-xl text-gray-300">
            {searchTerm ? "Nenhuma música encontrada" : "Nenhuma música cadastrada"}
          </p>
          {currentUser?.type === 'leader' && !searchTerm && <p className="text-gray-400 mt-2">Clique em "Nova Música" para começar</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onEdit={handleEditSong}
                onDelete={handleDeleteSong}
                onPlayQuiz={handleOpenQuizPlayer}
                currentUser={currentUser}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <SongDialog
        isOpen={isSongDialogOpen}
        onOpenChange={setIsSongDialogOpen}
        song={currentSongData}
        onSave={handleSaveSong}
        isEditMode={isEditMode}
      />
      {songForQuiz && currentUser?.type === 'leader' && (
        <QuizCreatorDialog
          isOpen={isQuizCreatorOpen}
          onOpenChange={(open) => {
            setIsQuizCreatorOpen(open);
            if (!open) setSongForQuiz(null); 
          }}
          song={songForQuiz}
          onSaveQuiz={handleSaveAllQuizzesForSong} // Updated prop name
        />
      )}
      {currentSongData && currentUser && (
         <QuizPlayerDialog
            isOpen={isQuizPlayerOpen}
            onOpenChange={setIsQuizPlayerOpen}
            song={currentSongData}
            currentUser={currentUser}
            onQuizComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default SongListModule;
