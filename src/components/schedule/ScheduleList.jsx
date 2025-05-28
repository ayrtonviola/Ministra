import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ScheduleList = ({ schedules, onEdit, onDelete, currentUser }) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl text-foreground">Nenhuma escala cadastrada</p>
        {currentUser?.type === 'leader' && (
          <p className="text-muted-foreground mt-2">
            Clique em "Nova Escala" para começar
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence>
        {schedules.map((schedule) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden bg-card text-card-foreground border-border">
              <CardHeader className="bg-secondary/50 pb-3 pt-4 px-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-foreground">
                      {schedule.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(schedule.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {currentUser?.type === 'leader' && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(schedule)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(schedule.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 px-4 pb-4">
                <div className="mb-3">
                  <ul className="space-y-1.5">
                    {schedule.songs.map((song, index) => (
                      <li
                        key={index}
                        className="text-sm py-1.5 px-2 rounded bg-secondary/30 border border-border flex justify-between items-center"
                      >
                        <span>{song.title}</span>
                        {song.key && (
                          <span className="text-xs font-light text-purple-400 ml-2">
                            ({song.key})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {schedule.participants && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-1.5" /> Participantes
                    </h4>
                    {schedule.participants.singers &&
                      schedule.participants.singers.length > 0 && (
                        <div className="mb-1.5">
                          <p className="text-xs text-purple-400">Cantores:</p>
                          <p className="text-sm text-foreground">
                            {schedule.participants.singers.join(', ')}
                          </p>
                        </div>
                      )}
                    {schedule.participants.instrumentalists &&
                      schedule.participants.instrumentalists.length > 0 && (
                        <div>
                          <p className="text-xs text-purple-400">Instrumentistas:</p>
                          <p className="text-sm text-foreground">
                            {schedule.participants.instrumentalists.join(', ')}
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleList;
