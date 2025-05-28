import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { KeyRound } from 'lucide-react';

const LeaderPasswordDialog = ({ isOpen, onOpenChange, onConfirm, onBack }) => {
  const [leaderPassword, setLeaderPassword] = useState('');

  const handleConfirm = () => {
    const success = onConfirm(leaderPassword);
    if (success) {
      setLeaderPassword(''); // Reset on success
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Confirmação de Líder</DialogTitle>
          <DialogDescription>Por favor, insira a senha mestra de líder para confirmar seu acesso.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="leader-master-password-confirm">Senha Mestra de Líder</Label>
          <Input 
            id="leader-master-password-confirm" 
            type="password" 
            value={leaderPassword}
            onChange={(e) => setLeaderPassword(e.target.value)}
            className="bg-gray-700 border-gray-600"
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onBack} className="border-gray-600 text-gray-300 hover:bg-gray-700">Voltar</Button>
          <Button onClick={handleConfirm} className="bg-purple-600 hover:bg-purple-700">
            <KeyRound className="mr-2 h-4 w-4" /> Confirmar Liderança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderPasswordDialog;