
import React from 'react';
import { LogOut, UserCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ currentUser, onLogout, onSwitchUser }) => {
  const getUserFriendlyType = (type) => {
    switch (type) {
      case 'leader': return 'Líder';
      case 'singer': return 'Cantor(a)';
      case 'drummer': return 'Baterista';
      case 'keyboardist': return 'Tecladista';
      case 'bassist': return 'Baixista';
      case 'guitarist': return 'Guitarrista';
      case 'acoustic_guitarist': return 'Violonista';
      case 'other_instrumentalist': return 'Outro Instrumentista';
      default: return 'Não Definido';
    }
  };

  return (
    <header className="bg-black/30 backdrop-blur-md shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Logo e nome removidos */}
        </div>
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{currentUser.name}</p>
              <p className="text-xs text-purple-300">
                {getUserFriendlyType(currentUser.type)}
              </p>
            </div>
            <UserCircle className="h-8 w-8 text-purple-400" />
            <Button variant="ghost" size="sm" onClick={onSwitchUser} className="text-gray-300 hover:text-white hover:bg-white/10">
              <Users className="mr-1 h-4 w-4" /> Trocar Usuário
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-300 hover:text-white hover:bg-white/10">
              <LogOut className="mr-1 h-4 w-4" /> Sair
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
