import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SongCard = ({ song, onEdit, onDelete, onPlayQuiz, currentUser }) => {
  const hasQuiz = song.quizzes && song.quizzes.length > 0;
  
  // Verifica se o usuário atual já fez este quiz
  const quizScores = JSON.parse(localStorage.getItem('quizScores_v2') || '{}');
  const userScoresForSong = quizScores[currentUser?.id]?.[song.id];
  const quizTaken = !!userScoresForSong;
  const quizMastered = quizTaken && userScoresForSong.bestScore === userScoresForSong.totalQuestions;


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 text-white">
        <CardHeader className="bg-gradient-to-r from-indigo-800/50 to-purple-800/50 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{song.title}</CardTitle>
              <p className="text-sm text-gray-300 mt-1">{song.artist}</p>
            </div>
            {currentUser?.type === 'leader' && (
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(song)}
                  className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(song.id)}
                  className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {song.notes && (
            <div className="text-sm bg-white/5 p-3 rounded-md border border-white/10 mb-3">
              {song.notes}
            </div>
          )}
          {song.fileName && (
            <div className="flex items-center text-sm bg-white/5 p-2 rounded-md border border-white/10 mb-3">
              <FileText className="h-4 w-4 mr-2 text-purple-400" />
              <span className="truncate">{song.fileName}</span>
              {song.fileData && (
                <a
                  href={song.fileData}
                  download={song.fileName}
                  className="ml-auto text-purple-300 hover:text-purple-100 text-xs"
                >
                  Baixar
                </a>
              )}
            </div>
          )}
          {hasQuiz && currentUser?.type !== 'leader' && (
            <Button 
              onClick={() => onPlayQuiz(song)} 
              className={`w-full mt-2 ${quizMastered ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
            >
              <HelpCircle className="mr-2 h-4 w-4" /> 
              {quizMastered ? 'Quiz Dominado!' : (quizTaken ? 'Refazer Quiz' : 'Responder Quiz')}
            </Button>
          )}
           {hasQuiz && currentUser?.type === 'leader' && (
             <p className="text-xs text-center text-purple-300 mt-2">Esta música possui um quiz.</p>
           )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SongCard;