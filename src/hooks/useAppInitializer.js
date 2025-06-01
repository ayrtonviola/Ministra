import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const useAppInitializer = (toast, isLoading) => {
  useEffect(() => {
    if (isLoading) return;

    const isFirstVisit = localStorage.getItem('appMinisterioLouvorVisited_v3') === null;
    if (isFirstVisit) {
      (async () => {
        try {
          // Limpa os dados antigos caso existam
          await supabase.from('schedules').delete().neq('id', '');
          await supabase.from('songs').delete().neq('id', '');

          // Aqui não insere nada. Deixa o banco limpo.

          localStorage.setItem('appMinisterioLouvorVisited_v3', 'true');

          toast({
            title: "Bem-vindo ao App Ministério de Louvor!",
            description: "Você pode começar adicionando sua primeira escala ou música.",
          });
        } catch (error) {
          console.error("Erro ao limpar dados no Supabase:", error);
          toast({
            title: "Erro na Inicialização",
            description: "Não foi possível limpar os dados iniciais no servidor.",
            variant: "destructive"
          });
        }
      })();
    }
  }, [toast, isLoading]);
};

export default useAppInitializer;
