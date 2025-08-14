'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Progress } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import { locale } from '@/lib/locales';
import { Manager, ManagerPair } from '@/types';

interface ComparisonScreenProps {
  pair: ManagerPair;
  progress: {
    done: number;
    target: number;
    left: number;
    percentage: number;
  };
  onVote: (winnerId: string) => Promise<void>;
  onSkip?: () => void;
}

export function ComparisonScreen({ 
  pair, 
  progress, 
  onVote, 
  onSkip 
}: ComparisonScreenProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isVoting) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleVote(pair.left.id);
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleVote(pair.right.id);
          break;
        case 's':
        case 'S':
          event.preventDefault();
          if (onSkip) onSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pair, isVoting, onSkip]);

  const handleVote = async (winnerId: string) => {
    if (isVoting) return;

    setIsVoting(true);
    setSelectedId(winnerId);

    try {
      await onVote(winnerId);
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      // Reset state after a short delay
      setTimeout(() => {
        setIsVoting(false);
        setSelectedId(null);
      }, 300);
    }
  };

  const formatFullName = (manager: Manager) => {
    return `${manager.lastName} ${manager.firstName} ${manager.patronymic}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      {/* Header with progress */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-secondary-900">
              {locale.question}
            </h1>
            <div className="text-sm text-secondary-600">
              {locale.leftCount.replace('{count}', progress.left.toString())}
            </div>
          </div>
          
          <Progress
            value={progress.done}
            max={progress.target}
            showLabel
            variant="primary"
          />
        </div>
      </div>

      {/* Main comparison area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* Left Manager Card */}
          <ManagerCard
            manager={pair.left}
            position="left"
            isSelected={selectedId === pair.left.id}
            isDisabled={isVoting}
            onClick={() => handleVote(pair.left.id)}
          />

          {/* VS Divider */}
          <div className="md:hidden flex items-center justify-center">
            <div className="bg-secondary-200 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-secondary-600 font-bold">VS</span>
            </div>
          </div>

          {/* Right Manager Card */}
          <ManagerCard
            manager={pair.right}
            position="right"
            isSelected={selectedId === pair.right.id}
            isDisabled={isVoting}
            onClick={() => handleVote(pair.right.id)}
          />
        </div>
      </div>

      {/* Footer with actions */}
      <div className="bg-white border-t p-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isVoting}
            >
              {locale.skip}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ManagerCardProps {
  manager: Manager;
  position: 'left' | 'right';
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

function ManagerCard({ 
  manager, 
  position, 
  isSelected, 
  isDisabled, 
  onClick 
}: ManagerCardProps) {
  const formatFullName = (manager: Manager) => {
    return `${manager.lastName} ${manager.firstName} ${manager.patronymic}`;
  };

  return (
    <Card 
      variant="elevated"
      interactive
      className={`
        h-64 flex flex-col justify-center cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
      `}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-secondary-900 mb-3">
          {formatFullName(manager)}
        </h2>
        <p className="text-secondary-600 text-lg mb-4">
          {manager.position}
        </p>
        <div className="text-sm text-secondary-400">
          {position === 'left' ? locale.leftHint : locale.rightHint}
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-10 rounded-lg">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </Card>
  );
}