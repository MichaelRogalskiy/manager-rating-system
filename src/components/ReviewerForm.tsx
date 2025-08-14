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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Вхід рецензента
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Ваше ім'я *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Введіть своє ім'я"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">Посада (необов'язково)</Label>
            <Input
              id="role"
              type="text"
              placeholder="Наприклад: HR-менеджер, Директор"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Створення...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
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