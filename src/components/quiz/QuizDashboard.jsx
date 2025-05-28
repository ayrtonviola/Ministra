
import React, { useState, useEffect } from 'react';
import { BarChart, Award, ListChecks } from 'lucide-react';

const QuizDashboard = ({ currentUser, registeredUsers }) => {
  const [quizScores, setQuizScores] = useState({});
  const [allSongs, setAllSongs] = useState([]);

  useEffect(() => {
    const scores = JSON.parse(localStorage.getItem('quizScores_v2') || '{}');
    setQuizScores(scores);

    const songs = JSON.parse(localStorage.getItem('songs_v2') || '[]');
    setAllSongs(songs);
    
  }, [currentUser, registeredUsers]);

  const getUserName = (userId) => {
    const user = registeredUsers.find(u => u.id === userId);
    return user ? user.name : 'Usuário Desconhecido'; // Exibe o Nome Completo
  };

  const getSongTitle = (songId) => {
    const song = allSongs.find(s => s.id === songId);
    return song ? song.title : 'Música Desconhecida';
  };

  const calculateOverallStats = () => {
    let totalQuizzesTaken = 0;
    let totalCorrectAnswers = 0;
    let totalQuestionsAttempted = 0;
    const userScoresArray = [];

    Object.entries(quizScores).forEach(([userId, songs]) => {
      let userTotalCorrect = 0;
      let userTotalQuestions = 0;
      Object.values(songs).forEach(songScore => {
        totalQuizzesTaken += songScore.attempts || 0;
        userTotalCorrect += songScore.bestScore || 0;
        userTotalQuestions += songScore.totalQuestions || 0;
      });
      totalCorrectAnswers += userTotalCorrect;
      totalQuestionsAttempted += userTotalQuestions;
      if (userTotalQuestions > 0) {
        userScoresArray.push({
          userId,
          name: getUserName(userId), // Usa o Nome Completo
          score: userTotalCorrect,
          total: userTotalQuestions,
          percentage: parseFloat(((userTotalCorrect / userTotalQuestions) * 100).toFixed(1))
        });
      }
    });
    
    userScoresArray.sort((a, b) => b.percentage - a.percentage || b.score - a.score);

    return {
      totalQuizzesTaken,
      overallAccuracy: totalQuestionsAttempted > 0 ? ((totalCorrectAnswers / totalQuestionsAttempted) * 100).toFixed(1) : 0,
      leaderboard: userScoresArray,
    };
  };

  const stats = calculateOverallStats();

  if (!currentUser) {
    return <div className="text-center py-12 text-gray-400">Faça login para ver o painel de quizzes.</div>;
  }
  
  const currentUserScores = quizScores[currentUser.id] || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <BarChart className="mr-2 h-6 w-6 text-purple-400" />
          Painel de Desempenho dos Quizzes
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-purple-300">Quizzes Realizados (Total)</h3>
                <p className="text-3xl font-bold">{stats.totalQuizzesTaken}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-purple-300">Precisão Geral</h3>
                <p className="text-3xl font-bold">{stats.overallAccuracy}%</p>
            </div>
        </div>

        {currentUser.type === 'leader' && stats.leaderboard.length > 0 && (
            <div className="bg-white/5 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center"><Award className="mr-2 text-yellow-400"/>Ranking Geral</h3>
                <ul className="space-y-2">
                    {stats.leaderboard.map((userStat, index) => (
                        <li key={userStat.userId} className="flex justify-between items-center p-2 bg-white/10 rounded">
                            <span className="font-medium">{index + 1}. {userStat.name}</span> {/* Exibe Nome Completo */}
                            <span className="text-sm">{userStat.score}/{userStat.total} ({userStat.percentage}%)</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      {Object.keys(currentUserScores).length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
            <ListChecks className="mr-2 h-5 w-5 text-green-400" />
            Seu Desempenho nos Quizzes
          </h3>
          <div className="space-y-3">
            {Object.entries(currentUserScores).map(([songId, songScore]) => (
              <div key={songId} className="bg-white/10 p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className="font-medium">{getSongTitle(songId)}</p>
                  <p className="text-xs text-gray-400">Tentativas: {songScore.attempts}</p>
                </div>
                <div className={`text-lg font-bold px-3 py-1 rounded-md ${songScore.bestScore === songScore.totalQuestions ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {songScore.bestScore}/{songScore.totalQuestions} {/* Exibe 0 a 3 */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
       {Object.keys(currentUserScores).length === 0 && currentUser.type !== 'leader' && (
         <p className="text-center text-gray-400 py-8">Você ainda não respondeu nenhum quiz. Vá para a seção de Músicas!</p>
       )}

    </div>
  );
};

export default QuizDashboard;
