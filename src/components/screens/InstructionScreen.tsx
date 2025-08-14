'use client';

import { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import { locale } from '@/lib/locales';

interface InstructionScreenProps {
  onStart: (fullName: string) => Promise<void>;
  managerCount: number;
  estimatedComparisons: number;
}

export function InstructionScreen({ 
  onStart, 
  managerCount, 
  estimatedComparisons 
}: InstructionScreenProps) {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { isLoading } = useAppStore();

  const validateName = (name: string): boolean => {
    const trimmed = name.trim();
    const words = trimmed.split(/\s+/);
    return words.length >= 2 && words.every(word => word.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(fullName)) {
      setError(locale.nameRequired);
      return;
    }

    setError('');
    try {
      await onStart(fullName.trim());
    } catch (err) {
      setError('Помилка створення сесії. Спробуйте знову.');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-secondary-900 mb-4">
              {locale.title}
            </CardTitle>
            <div className="space-y-2 text-secondary-600">
              <p className="text-lg">
                {locale.intro.replace('{estPairs}', estimatedComparisons.toString())}
              </p>
              <div className="flex justify-center space-x-8 text-sm">
                <span>
                  <strong>{locale.managersCount.replace('{count}', managerCount.toString())}</strong>
                </span>
                <span>
                  <strong>{locale.estimatedComparisons.replace('{count}', estimatedComparisons.toString())}</strong>
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label={locale.enterName}
                  placeholder={locale.enterNamePlaceholder}
                  value={fullName}
                  onChange={handleNameChange}
                  error={error}
                  disabled={isLoading}
                  className="text-lg"
                />
              </div>

              <div className="bg-secondary-50 rounded-lg p-4">
                <h3 className="font-semibold text-secondary-900 mb-2">
                  {locale.shortcuts.title}
                </h3>
                <div className="space-y-1 text-sm text-secondary-700">
                  <div>{locale.shortcuts.leftArrow}</div>
                  <div>{locale.shortcuts.rightArrow}</div>
                  <div>{locale.shortcuts.sKey}</div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!validateName(fullName) || isLoading}
                isLoading={isLoading}
              >
                {locale.start}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}