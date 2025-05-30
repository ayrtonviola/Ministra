// src/components/auth/UserTypeDialog.jsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn } from 'lucide-react';

const userTypes = [
  { value: 'leader', label: 'Líder' },
  { value: 'singer', label: 'Cantor(a)' },
  { value: 'drummer', label: 'Baterista' },
  { value: 'keyboardist', label: 'Tecladista' },
  { value: 'bassist', label: 'Baixista' },
  { value: 'guitarist', label: 'Guitarrista' },
  { value: 'acoustic_guitarist', label: 'Violonista' },
  { value: 'other_instrumentalist', label: 'Outro Instrumentista' },
];

const UserTypeDialog = ({ isOpen, onOpenChange, username, onSelectType }) => {
  const [selectedUserType, setSelectedUserType] = useState('');

  const handleContinue = async () => { // Tornar async para esperar onSelectType
    await onSelectType(selectedUserType);
    setSelectedUserType('');
    // onOpenChange(false); // A dialog será fechada pelo useEffect do useAuth
  };

  return (
    // Use 'open' e 'onOpenChange' corretamente
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Quase lá, {username}!</DialogTitle>
          <DialogDescription>Selecione seu tipo de usuário para continuar.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="user-type-select">Tipo de Usuário</Label>
          <Select onValueChange={setSelectedUserType} value={selectedUserType}>
            <SelectTrigger id="user-type-select" className="w-full bg-gray-700 border-gray-600">
              <SelectValue placeholder="Selecione seu papel" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 text-white border-gray-600">
              {userTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleContinue} className="bg-purple-600 hover:bg-purple-700" disabled={!selectedUserType}>
            <LogIn className="mr-2 h-4 w-4" /> Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserTypeDialog;