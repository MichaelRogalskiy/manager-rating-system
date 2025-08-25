'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';

interface ReviewerFormProps {
  onReviewerCreated: (reviewer: {
    id: string;
    name: string;
    role: string;
    active: boolean;
    reliabilityWeight: number;
  }) => void;
  onCancel?: () => void;
}

export default function ReviewerForm({ onReviewerCreated, onCancel }: ReviewerFormProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Будь ласка, введіть своє ім\'я');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviewers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          role: role.trim() || 'Рецензент' 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося створити рецензента');
      }

      const reviewer = await response.json();
      onReviewerCreated(reviewer);
      
      // Очищаємо форму
      setName('');
      setRole('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-lg border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Створити рецензента
        </CardTitle>
        <p className="text-gray-600 mt-2">Заповніть дані для початку оцінювання</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium text-gray-700">
              Ваше повне ім'я *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Наприклад: Іван Петренко"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role" className="text-base font-medium text-gray-700">
              Посада або роль
            </Label>
            <Input
              id="role"
              type="text"
              placeholder="Наприклад: HR-менеджер, Директор, Керівник відділу"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
              className="h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Створення...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Почати оцінювання
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 h-12 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-200"
              >
                Скасувати
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}