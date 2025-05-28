import { useEffect } from 'react';

const useAppInitializer = (toast, isLoading) => {
  useEffect(() => {
    if (isLoading) return;

    const isFirstVisit = localStorage.getItem('appMinisterioLouvorVisited_v3') === null;
    if (isFirstVisit) {
      const defaultSchedules = [
        {
          id: '1',
          date: new Date().toISOString().split('T')[0],
          title: 'Culto de Domingo',
          songs: [
            { title: 'Grandes Coisas', key: null },
            { title: 'Oceanos', key: null },
            { title: 'Tua Graça Me Basta', key: null }
          ],
          participants: {
            singers: ['Ana', 'João'],
            instrumentalists: ['Carlos (Violão)', 'Maria (Teclado)', 'Pedro (Bateria)']
          }
        }
      ];

      const defaultSongs = [
        { id: '1', title: 'Grandes Coisas', artist: 'Fernandinho', notes: 'Tom: G', quizzes: [], audioFile: null, audioFileName: null },
        { id: '2', title: 'Oceanos', artist: 'Hillsong', notes: 'Tom: D', quizzes: [], audioFile: null, audioFileName: null },
        { id: '3', title: 'Tua Graça Me Basta', artist: 'Davi Sacer', notes: 'Tom: E', quizzes: [], audioFile: null, audioFileName: null }
      ];

      try {
        // Apaga dados antigos malformados (garantia extra)
        localStorage.removeItem('schedules_v2');
        localStorage.removeItem('songs_v2');

        localStorage.setItem('schedules_v2', JSON.stringify(defaultSchedules));
        localStorage.setItem('songs_v2', JSON.stringify(defaultSongs));
        localStorage.setItem('appMinisterioLouvorVisited_v3', 'true');

        toast({
          title: "Bem-vindo ao App Ministério de Louvor!",
          description: "Adicionamos alguns dados de exemplo para você começar.",
        });
      } catch (error) {
        console.error("Error initializing default data:", error);
        toast({
          title: "Erro na Inicialização",
          description: "Não foi possível carregar os dados de exemplo.",
          variant: "destructive"
        });
      }
    }
  }, [toast, isLoading]);
};

export default useAppInitializer;
