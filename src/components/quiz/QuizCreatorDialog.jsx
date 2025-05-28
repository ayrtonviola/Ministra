
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Shuffle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const userTypesForQuiz = [
  { value: 'singer', label: 'Cantor(a)' },
  { value: 'drummer', label: 'Baterista' },
  { value: 'keyboardist', label: 'Tecladista' },
  { value: 'bassist', label: 'Baixista' },
  { value: 'guitarist', label: 'Guitarrista' },
  { value: 'acoustic_guitarist', label: 'Violonista' },
  { value: 'other_instrumentalist', label: 'Outros Instrumentos' },
];

const baseQuestionTemplates = {
  singer: [
    { id: 's1', text: "Quantas vezes repete a introdução para começar?", type: 'number', correctAnswer: '', incorrectAnswers: [] },
    { id: 's2', text: "Quantas vezes repete o primeiro refrão?", type: 'number', correctAnswer: '', incorrectAnswers: [] },
    { id: 's3', text: "O que acontece depois da ponte?", type: 'choice', correctAnswer: '', incorrectAnswers: [], suggestions: ["Vai pro refrão", "Acaba a música", "Repete a ponte", "Solo Instrumental"] },
  ],
  harmonic: [ // Tecladista, Baixista, Guitarrista, Violonista, Outros
    { id: 'h1', text: "Quantos acordes (diferentes) tem na música?", type: 'number', correctAnswer: '', incorrectAnswers: [] },
    { id: 'h2', text: "Qual é o primeiro acorde da música?", type: 'text', correctAnswer: '', incorrectAnswers: [] },
    { id: 'h3', text: "Quando o baixo (ou instrumento guia) entra na música?", type: 'choice', correctAnswer: '', incorrectAnswers: [], suggestions: ["No refrão", "No verso 2", "Desde o início", "Na ponte"] },
  ],
  percussive: [ // Baterista
    { id: 'p1', text: "Qual é o compasso da música?", type: 'choice', correctAnswer: '', incorrectAnswers: [], suggestions: ["4/4", "3/4", "6/8", "2/4"] },
    { id: 'p2', text: "Quando a bateria entra?", type: 'choice', correctAnswer: '', incorrectAnswers: [], suggestions: ["No refrão", "No verso 2", "Desde o início", "Na introdução"] },
    { id: 'p3', text: "Quando a bateria pausa (ou faz uma virada importante)?", type: 'choice', correctAnswer: '', incorrectAnswers: [], suggestions: ["Na ponte", "No final do refrão", "Antes do solo", "Não pausa"] },
  ],
};

const getQuestionTemplateForType = (userType) => {
  switch (userType) {
    case 'singer':
      return JSON.parse(JSON.stringify(baseQuestionTemplates.singer));
    case 'drummer':
      return JSON.parse(JSON.stringify(baseQuestionTemplates.percussive));
    case 'keyboardist':
    case 'bassist':
    case 'guitarist':
    case 'acoustic_guitarist':
    case 'other_instrumentalist':
      return JSON.parse(JSON.stringify(baseQuestionTemplates.harmonic));
    default:
      return [];
  }
};

const generateIncorrectAnswers = (correct, type, suggestions = []) => {
  const incorrect = new Set();
  if (type === 'number') {
    const numCorrect = parseInt(correct, 10);
    if (isNaN(numCorrect)) return ['1', '2', '3'].slice(0,2); 
    
    if (numCorrect > 1) incorrect.add((numCorrect - 1).toString());
    else incorrect.add((numCorrect + 2).toString());
    
    incorrect.add((numCorrect + 1).toString());
    
    if (numCorrect > 2) incorrect.add((numCorrect - 2).toString());
    else if (numCorrect === 0) incorrect.add('3');
    else incorrect.add((numCorrect + 3).toString());

  } else if (type === 'text') {
    const commonChords = ['G', 'C', 'D', 'Em', 'Am', 'F', 'Bb', 'A', 'E', 'Bm', 'F#m'];
    const filteredChords = commonChords.filter(c => c.toLowerCase() !== correct.toLowerCase());
    while (incorrect.size < 2 && filteredChords.length > 0) {
      incorrect.add(filteredChords.splice(Math.floor(Math.random() * filteredChords.length), 1)[0]);
    }
     if (incorrect.size < 2) { 
        const fallbacks = ["X", "Y", "Z"];
        fallbacks.forEach(f => { if (incorrect.size < 2 && f.toLowerCase() !== correct.toLowerCase()) incorrect.add(f); });
    }
  } else if (type === 'choice' && suggestions.length > 0) {
     const filteredSuggestions = suggestions.filter(s => s.toLowerCase() !== correct.toLowerCase());
     while (incorrect.size < 2 && filteredSuggestions.length > 0) {
        incorrect.add(filteredSuggestions.splice(Math.floor(Math.random() * filteredSuggestions.length), 1)[0]);
     }
  }
  return Array.from(incorrect).slice(0, 2); 
};


const QuizCreatorDialog = ({ isOpen, onOpenChange, song, onSaveQuiz }) => {
  const { toast } = useToast();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizzesData, setQuizzesData] = useState({}); // { singer: {questions: []}, drummer: {questions: []} }
  const [expandedTypes, setExpandedTypes] = useState({});

  useEffect(() => {
    if (song && isOpen) {
      setQuizTitle(`Quiz: ${song.title}`);
      const initialQuizzes = {};
      const initialExpanded = {};
      userTypesForQuiz.forEach(type => {
        initialQuizzes[type.value] = {
          userTypeTarget: type.value,
          questions: getQuestionTemplateForType(type.value)
        };
        initialExpanded[type.value] = false; 
      });
      setQuizzesData(initialQuizzes);
      setExpandedTypes(initialExpanded);
    } else if (!isOpen) {
      setQuizTitle('');
      setQuizzesData({});
      setExpandedTypes({});
    }
  }, [song, isOpen]);

  const handleQuestionChange = (userType, questionIndex, field, value) => {
    setQuizzesData(prevData => {
      const newTypeData = { ...prevData[userType] };
      newTypeData.questions[questionIndex][field] = value;
      if (field === 'correctAnswer') {
        newTypeData.questions[questionIndex].incorrectAnswers = generateIncorrectAnswers(
          value, 
          newTypeData.questions[questionIndex].type, 
          newTypeData.questions[questionIndex].suggestions
        );
      }
      return { ...prevData, [userType]: newTypeData };
    });
  };
  
  const handleShuffleIncorrect = (userType, questionIndex) => {
     setQuizzesData(prevData => {
      const newTypeData = { ...prevData[userType] };
      const question = newTypeData.questions[questionIndex];
      question.incorrectAnswers = generateIncorrectAnswers(question.correctAnswer, question.type, question.suggestions);
      return { ...prevData, [userType]: newTypeData };
    });
  };

  const handleSaveAllQuizzes = () => {
    if (!quizTitle.trim()) {
      toast({ title: "Erro", description: "O título do quiz é obrigatório.", variant: "destructive" });
      return;
    }

    const allQuizzesToSave = [];
    for (const userType in quizzesData) {
      const quizForType = quizzesData[userType];
      if (quizForType.questions.some(q => !q.correctAnswer.toString().trim())) {
        const typeLabel = userTypesForQuiz.find(t => t.value === userType)?.label || userType;
        toast({ title: "Erro", description: `Todas as perguntas para "${typeLabel}" devem ter uma resposta correta.`, variant: "destructive" });
        setExpandedTypes(prev => ({...prev, [userType]: true})); // Expand the problematic section
        return;
      }
      allQuizzesToSave.push({ title: quizTitle, ...quizForType });
    }
    
    onSaveQuiz(song.id, allQuizzesToSave); // Pass an array of quiz objects
  };

  const toggleExpandType = (userType) => {
    setExpandedTypes(prev => ({...prev, [userType]: !prev[userType]}));
  };

  if (!song) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle>Criar Quizzes para "{song.title}"</DialogTitle>
          <DialogDescription>Defina as perguntas e respostas para cada tipo de músico.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="quiz-title">Título Geral dos Quizzes</Label>
            <Input id="quiz-title" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="bg-gray-800 border-gray-700 mt-1" />
          </div>
          
          <div className="space-y-3">
            {userTypesForQuiz.map(userTypeInfo => (
              <div key={userTypeInfo.value} className="border border-gray-700 rounded-lg">
                <button 
                  onClick={() => toggleExpandType(userTypeInfo.value)}
                  className="w-full flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700/70 rounded-t-lg"
                >
                  <span className="font-semibold text-purple-300">{userTypeInfo.label}</span>
                  {expandedTypes[userTypeInfo.value] ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                </button>

                {expandedTypes[userTypeInfo.value] && quizzesData[userTypeInfo.value] && (
                  <div className="p-4 space-y-4 bg-gray-800/50 rounded-b-lg">
                    {quizzesData[userTypeInfo.value].questions.map((q, index) => (
                      <div key={`${userTypeInfo.value}-${q.id}`} className="p-3 border border-gray-600 rounded-md bg-gray-700/50">
                        <p className="font-medium mb-2 text-gray-300">{index + 1}. {q.text}</p>
                        {q.type === 'choice' && q.suggestions ? (
                          <div>
                            <Label className="text-xs text-gray-400">Resposta Correta (Selecione)</Label>
                            <Select 
                              onValueChange={(val) => handleQuestionChange(userTypeInfo.value, index, 'correctAnswer', val)} 
                              value={q.correctAnswer}
                            >
                              <SelectTrigger className="w-full bg-gray-600 border-gray-500 mt-1">
                                <SelectValue placeholder="Selecione a resposta correta" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-600 text-white border-gray-500">
                                {q.suggestions.map(sugg => <SelectItem key={sugg} value={sugg}>{sugg}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-xs text-gray-400">Resposta Correta</Label>
                            <Input
                              type={q.type === 'number' ? 'number' : 'text'}
                              value={q.correctAnswer}
                              onChange={(e) => handleQuestionChange(userTypeInfo.value, index, 'correctAnswer', e.target.value)}
                              className="bg-gray-600 border-gray-500 mt-1"
                            />
                          </div>
                        )}
                        <div className="mt-2">
                          <Label className="text-xs text-gray-400">Respostas Incorretas (Geradas)</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {q.incorrectAnswers.map((ans, i) => (
                              <Input key={i} value={ans} readOnly className="bg-gray-600/50 border-gray-500/50 text-sm italic" />
                            ))}
                            <Button variant="ghost" size="icon" onClick={() => handleShuffleIncorrect(userTypeInfo.value, index)} title="Gerar novas incorretas">
                                <Shuffle className="h-4 w-4 text-purple-400"/>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</Button>
          <Button onClick={handleSaveAllQuizzes} className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
            <Save className="mr-2 h-4 w-4" /> Salvar Todos os Quizzes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizCreatorDialog;
