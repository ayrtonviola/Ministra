
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const mapUserTypeToQuizTarget = (userType) => {
  switch (userType) {
    case 'singer': return 'singer';
    case 'drummer': return 'drummer';
    case 'keyboardist':
    case 'bassist':
    case 'guitarist':
    case 'acoustic_guitarist':
    case 'other_instrumentalist':
      return userType; // Direct match for new specific types if quiz creator uses them
    // Fallback for old types if they still exist in quiz data
    case 'harmonic_instrumentalist': return 'keyboardist'; // Or a generic harmonic
    case 'percussive_instrumentalist': return 'drummer'; // Or a generic percussive
    default: return 'singer'; // Default fallback
  }
};


const QuizPlayerDialog = ({ isOpen, onOpenChange, song, currentUser, onQuizComplete }) => {
  const { toast } = useToast();
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const relevantQuiz = useMemo(() => {
    if (!song || !song.quizzes || !currentUser) return null;
    const targetType = mapUserTypeToQuizTarget(currentUser.type);
    // Song.quizzes is now an array of quiz objects
    return song.quizzes.find(q => q.userTypeTarget === targetType) || song.quizzes[0]; 
  }, [song, currentUser]);

  useEffect(() => {
    if (isOpen && relevantQuiz) {
      setCurrentQuiz(relevantQuiz);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResult(false);
      setSelectedAnswer('');
      setAttemptsLeft(3);
      shuffleCurrentQuestionAnswers(relevantQuiz, 0);
    } else if (!isOpen) {
        setCurrentQuiz(null);
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowResult(false);
        setSelectedAnswer('');
        setAttemptsLeft(3);
    }
  }, [isOpen, relevantQuiz]);

  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const shuffleCurrentQuestionAnswers = (quiz, questionIndex) => {
    if (quiz && quiz.questions && quiz.questions[questionIndex]) {
      const question = quiz.questions[questionIndex];
      const answers = shuffleArray([
        question.correctAnswer,
        ...question.incorrectAnswers,
      ]);
      setShuffledAnswers(answers);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      toast({ title: "Selecione uma resposta", description: "Você precisa escolher uma opção.", variant: "destructive" });
      return;
    }

    const question = currentQuiz.questions[currentQuestionIndex];
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore(prevScore => prevScore + 1);
    }
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer('');
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      shuffleCurrentQuestionAnswers(currentQuiz, currentQuestionIndex + 1);
    } else {
      onQuizComplete(song.id, score, currentQuiz.questions.length);
      setAttemptsLeft(prev => prev - 1);
      if (attemptsLeft <= 1 && score < currentQuiz.questions.length) {
         onOpenChange(false); 
      }
    }
  };
  
  const handleRetryQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer('');
    shuffleCurrentQuestionAnswers(currentQuiz, 0);
  };


  if (!isOpen || !currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
    if (isOpen && song && currentUser) {
        // This block can be used to inform the user if no suitable quiz is found.
        // For now, it just prevents rendering an empty dialog.
        // Consider adding a toast message here if relevantQuiz is null after checks.
    }
    return null;
  }


  const question = currentQuiz.questions[currentQuestionIndex];
  const isQuizFinished = currentQuestionIndex >= currentQuiz.questions.length -1 && showResult;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-gray-800 to-gray-700 border border-gray-600 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentQuiz.title}</DialogTitle>
          <DialogDescription>Música: {song.title}</DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {!isQuizFinished ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="py-4"
            >
              <p className="mb-1 text-sm text-gray-400">Pergunta {currentQuestionIndex + 1} de {currentQuiz.questions.length}</p>
              <p className="font-semibold text-lg mb-4">{question.text}</p>
              
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showResult}>
                {shuffledAnswers.map((answer, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-white/10 transition-colors">
                    <RadioGroupItem value={answer} id={`ans-${index}`} className="border-gray-500 text-purple-400 focus:ring-purple-500" />
                    <Label htmlFor={`ans-${index}`} className="flex-1 cursor-pointer">{answer}</Label>
                  </div>
                ))}
              </RadioGroup>

              {showResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-4 p-3 rounded-md text-center font-medium flex items-center justify-center gap-2 ${isCorrect ? 'bg-green-700/80' : 'bg-red-700/80'}`}
                >
                  {isCorrect ? <CheckCircle className="h-5 w-5"/> : <XCircle className="h-5 w-5"/>}
                  {isCorrect ? "Correto!" : "Incorreto."} 
                  {!isCorrect && <span className="text-sm">(Resposta: {question.correctAnswer})</span>}
                </motion.div>
              )}
            </motion.div>
          ) : (
             <motion.div
                key="quiz-summary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="py-4 text-center"
            >
                <h3 className="text-2xl font-bold mb-2">Quiz Finalizado!</h3>
                <p className="text-lg mb-1">Sua pontuação: <span className={`font-bold ${score === currentQuiz.questions.length ? 'text-green-400' : 'text-yellow-400'}`}>{score}</span> de {currentQuiz.questions.length}</p>
                {score === currentQuiz.questions.length ? (
                    <p className="text-green-400 flex items-center justify-center gap-1"><CheckCircle/> Parabéns, você dominou este quiz!</p>
                ) : (
                    <p className="text-yellow-400">Continue praticando!</p>
                )}
                {attemptsLeft > 0 && score < currentQuiz.questions.length && (
                    <p className="text-sm text-gray-400 mt-1">Você tem {attemptsLeft} {attemptsLeft === 1 ? 'tentativa restante' : 'tentativas restantes'}.</p>
                )}
             </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {!isQuizFinished ? (
            <Button onClick={showResult ? handleNextQuestion : handleAnswerSubmit} className="bg-purple-600 hover:bg-purple-700 w-full">
              {showResult ? (currentQuestionIndex < currentQuiz.questions.length - 1 ? "Próxima Pergunta" : "Ver Resultado Final") : "Confirmar Resposta"}
            </Button>
          ) : (
            <>
              {attemptsLeft > 0 && score < currentQuiz.questions.length && (
                 <Button onClick={handleRetryQuiz} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-600/20">
                    <RotateCcw className="mr-2 h-4 w-4"/> Tentar Novamente ({attemptsLeft})
                 </Button>
              )}
              <Button onClick={() => onOpenChange(false)} className="bg-gray-600 hover:bg-gray-500">
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizPlayerDialog;
