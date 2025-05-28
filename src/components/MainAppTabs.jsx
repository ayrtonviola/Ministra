import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Calendar, Play, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import ScheduleModule from '@/components/ScheduleModule';
import SongListModule from '@/components/SongListModule';
import MultitracksModule from '@/components/MultitracksModule';
import UserManagementModule from '@/components/UserManagementModule';
import QuizDashboard from '@/components/quiz/QuizDashboard';

const MainAppTabs = ({ currentUser, registeredUsers, setRegisteredUsers }) => {
  const [activeTab, setActiveTab] = useState("escalas");

  return (
    <motion.div
      key="main-app"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-effect rounded-xl p-6 shadow-xl"
    >
      <Tabs defaultValue="escalas" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 mb-8">
          <TabsTrigger value="escalas" className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Escalas</span></TabsTrigger>
          <TabsTrigger value="musicas" className="flex items-center gap-2"><Music className="h-4 w-4" /><span>Músicas</span></TabsTrigger>
          <TabsTrigger value="multitracks" className="flex items-center gap-2"><Play className="h-4 w-4" /><span>Multitracks</span></TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><span>Quizzes</span></TabsTrigger>
          {currentUser.type === 'leader' && <TabsTrigger value="usuarios" className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Usuários</span></TabsTrigger>}
        </TabsList>
        
        <TabsContent value="escalas"><ScheduleModule currentUser={currentUser} registeredUsers={registeredUsers} /></TabsContent>
        <TabsContent value="musicas"><SongListModule currentUser={currentUser} /></TabsContent>
        <TabsContent value="multitracks"><MultitracksModule currentUser={currentUser} /></TabsContent>
        <TabsContent value="quizzes"><QuizDashboard currentUser={currentUser} registeredUsers={registeredUsers} /></TabsContent>
        {currentUser.type === 'leader' && <TabsContent value="usuarios"><UserManagementModule currentUser={currentUser} registeredUsers={registeredUsers} setRegisteredUsers={setRegisteredUsers}/></TabsContent>}
      </Tabs>
    </motion.div>
  );
};

export default MainAppTabs;