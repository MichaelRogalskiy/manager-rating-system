'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight, Trophy, Trash2, TrendingDown } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Manager {
  id: string;
  name: string;
  position: string;
}

export interface RatingScreenProps {
  screenId: string;
  managers: Manager[];
  onSubmit: (selection: {
    top3Ids: string[];
    loserId: string;
    unknownIds: string[];
  }) => Promise<void>;
  loading?: boolean;
}

// Компонент менеджера, який можна перетягувати
function DraggableManagerCard({ 
  manager, 
  isInDropZone = false,
  onMoveToTop3,
  onMoveToWorst,
  onMoveToAvailable,
  showMoveButtons = false
}: { 
  manager: Manager; 
  isInDropZone?: boolean;
  onMoveToTop3?: (managerId: string) => void;
  onMoveToWorst?: (managerId: string) => void;
  onMoveToAvailable?: (managerId: string) => void;
  showMoveButtons?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: manager.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
      } ${
        isInDropZone ? 'bg-blue-50' : ''
      }`}
    >
      <CardContent className="p-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mb-2"
        >
          <h3 className="font-medium text-gray-900 text-sm mb-1">
            {manager.name}
          </h3>
          <p className="text-xs text-gray-600 mb-2">
            {manager.position}
          </p>
        </div>
        
        {showMoveButtons && (
          <div className="flex flex-wrap gap-1">
            {onMoveToTop3 && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToTop3(manager.id);
                }}
              >
                <Trophy className="w-3 h-3 mr-1" />
                Топ-3
              </Button>
            )}
            {onMoveToWorst && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToWorst(manager.id);
                }}
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                Розвиток
              </Button>
            )}
            {onMoveToAvailable && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToAvailable(manager.id);
                }}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Повернути
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Компонент зони для скидання менеджерів
function DropZone({ 
  title, 
  icon,
  items, 
  maxItems,
  bgColor = "bg-gray-50",
  borderColor = "border-gray-200",
  onRemove,
  onMoveToTop3,
  onMoveToWorst,
  onMoveToUnknown
}: {
  title: string;
  icon: React.ReactNode;
  items: Manager[];
  maxItems?: number;
  bgColor?: string;
  borderColor?: string;
  onRemove: (managerId: string) => void;
  onMoveToTop3?: (managerId: string) => void;
  onMoveToWorst?: (managerId: string) => void;
}) {
  return (
    <div className={`${bgColor} ${borderColor} border-2 border-dashed rounded-lg p-4 min-h-[200px]`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
        {icon}
        {title}
        {maxItems && (
          <Badge variant="outline" className="text-xs">
            {items.length}/{maxItems}
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {items.map((manager) => (
          <div key={manager.id} className="relative group">
            <DraggableManagerCard 
              manager={manager} 
              isInDropZone={true}
              showMoveButtons={true}
              onMoveToAvailable={onRemove}
              onMoveToTop3={title !== "Топ-3 менеджери" ? onMoveToTop3 : undefined}
              onMoveToWorst={title !== "Потребує розвитку" ? onMoveToWorst : undefined}
            />
          </div>
        ))}
        {maxItems && items.length < maxItems && (
          <div className="text-xs text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded">
            Перетягніть сюди менеджера
          </div>
        )}
      </div>
    </div>
  );
}

export default function RatingScreen({ 
  screenId, 
  managers, 
  onSubmit, 
  loading = false 
}: RatingScreenProps) {
  const [availableManagers, setAvailableManagers] = useState<Manager[]>(managers);
  const [top3Managers, setTop3Managers] = useState<Manager[]>([]);
  const [worstManager, setWorstManager] = useState<Manager | null>(null);
  // Видалено unknownManagers - менеджери без відповіді автоматично потрапляють в середню групу
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeManager, setActiveManager] = useState<Manager | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const manager = managers.find(m => m.id === active.id);
    if (manager) {
      setActiveManager(manager);
    }
  }, [managers]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveManager(null);

    if (!over) return;

    const managerId = active.id as string;
    const manager = managers.find(m => m.id === managerId);
    if (!manager) return;

    const overId = over.id as string;

    // Видаляємо менеджера з усіх списків
    setAvailableManagers(prev => prev.filter(m => m.id !== managerId));
    setTop3Managers(prev => prev.filter(m => m.id !== managerId));
    setWorstManager(prev => prev?.id === managerId ? null : prev);

    // Додаємо в відповідний список
    if (overId === 'available') {
      setAvailableManagers(prev => [...prev, manager]);
    } else if (overId === 'top3' && top3Managers.length < 3) {
      setTop3Managers(prev => [...prev, manager]);
    } else if (overId === 'worst' && !worstManager) {
      setWorstManager(manager);
    } else {
      // Якщо не можна додати в цільовий список, повертаємо в доступні
      setAvailableManagers(prev => [...prev, manager]);
    }
  }, [managers, top3Managers.length, worstManager]);

  const removeFromDropZone = useCallback((managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    if (!manager) return;

    // Видаляємо з усіх списків
    setTop3Managers(prev => prev.filter(m => m.id !== managerId));
    setWorstManager(prev => prev?.id === managerId ? null : prev);
    
    // Додаємо назад в доступні
    setAvailableManagers(prev => [...prev, manager]);
  }, [managers]);

  // Функції для переміщення кнопками
  const moveToTop3 = useCallback((managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    if (!manager || top3Managers.length >= 3) return;

    // Видаляємо з усіх списків
    setAvailableManagers(prev => prev.filter(m => m.id !== managerId));
    setWorstManager(prev => prev?.id === managerId ? null : prev);
    
    // Додаємо в топ-3
    setTop3Managers(prev => [...prev, manager]);
  }, [managers, top3Managers.length]);

  const moveToWorst = useCallback((managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    if (!manager || worstManager) return;

    // Видаляємо з усіх списків
    setAvailableManagers(prev => prev.filter(m => m.id !== managerId));
    setTop3Managers(prev => prev.filter(m => m.id !== managerId));
    
    // Встановлюємо як найгіршого
    setWorstManager(manager);
  }, [managers, worstManager]);

  // Видалено moveToUnknown - менеджери без відповіді залишаються в центральній панелі

  const moveToAvailable = useCallback((managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    if (!manager) return;

    // Видаляємо з усіх списків
    setTop3Managers(prev => prev.filter(m => m.id !== managerId));
    setWorstManager(prev => prev?.id === managerId ? null : prev);
    
    // Додаємо в доступні
    setAvailableManagers(prev => [...prev, manager]);
  }, [managers]);

  const canSubmit = useCallback(() => {
    return top3Managers.length === 3 && worstManager !== null;
  }, [top3Managers.length, worstManager]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const top3Ids = top3Managers.map(m => m.id);
      const loserId = worstManager?.id;
      const unknownIds: string[] = []; // Порожній масив - менеджери без відповіді автоматично в середній групі

      if (!loserId || top3Ids.length !== 3) {
        throw new Error('Невірний стан вибору');
      }

      await onSubmit({ top3Ids, loserId, unknownIds });
    } catch (error) {
      console.error('Error submitting screen:', error);
      // TODO: показати помилку користувачу
    } finally {
      setIsSubmitting(false);
    }
  }, [top3Managers, worstManager, canSubmit, onSubmit, isSubmitting]);

  // Ініціалізація доступних менеджерів при зміні списку
  React.useEffect(() => {
    setAvailableManagers(managers);
    setTop3Managers([]);
    setWorstManager(null);
  }, [managers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Оцінка менеджерів
            </h1>
            <p className="text-gray-600 mb-4">
              Перетягніть 3 найкращих менеджерів праворуч та 1 менеджера, що потребує розвитку, ліворуч
            </p>
            
            {/* Індикатори прогресу */}
            <div className="flex justify-center gap-4 text-sm">
              <Badge variant={top3Managers.length === 3 ? "default" : "secondary"}>
                Топ-3: {top3Managers.length}/3
              </Badge>
              <Badge variant={worstManager ? "destructive" : "secondary"}>
                Потребує розвитку: {worstManager ? 1 : 0}/1
              </Badge>
              <Badge variant="outline">
                Середні: {availableManagers.length}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 min-h-[600px]">
            {/* Ліва панель - Менеджер, що потребує розвитку */}
            <div className="col-span-1">
              <SortableContext items={worstManager ? [worstManager.id] : []} strategy={verticalListSortingStrategy}>
                <div id="worst" className="h-full">
                  <DropZone
                    title="Потребує розвитку"
                    icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
                    items={worstManager ? [worstManager] : []}
                    maxItems={1}
                    bgColor="bg-orange-50"
                    borderColor="border-orange-200"
                    onRemove={removeFromDropZone}
                    onMoveToTop3={moveToTop3}
                  />
                </div>
              </SortableContext>
            </div>

            {/* Центральна панель - Доступні менеджери */}
            <div className="col-span-2">
              <SortableContext items={availableManagers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div id="available" className="bg-white border-2 border-gray-200 rounded-lg p-4 h-full overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4 text-lg font-medium text-gray-700">
                    <Trophy className="w-5 h-5" />
                    Менеджери для оцінки
                    <Badge variant="outline">{availableManagers.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {availableManagers.map((manager) => (
                      <DraggableManagerCard 
                        key={manager.id} 
                        manager={manager}
                        showMoveButtons={true}
                        onMoveToTop3={top3Managers.length < 3 ? moveToTop3 : undefined}
                        onMoveToWorst={!worstManager ? moveToWorst : undefined}
                          />
                    ))}
                    {availableManagers.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        Всі менеджери розподілені
                      </div>
                    )}
                  </div>
                </div>
              </SortableContext>
            </div>

            {/* Права панель - Топ-3 менеджери */}
            <div className="col-span-1">
              {/* Топ-3 менеджери */}
              <SortableContext items={top3Managers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div id="top3" className="h-full">
                  <DropZone
                    title="Топ-3 менеджери"
                    icon={<Trophy className="w-5 h-5 text-green-600" />}
                    items={top3Managers}
                    maxItems={3}
                    bgColor="bg-green-50"
                    borderColor="border-green-200"
                    onRemove={removeFromDropZone}
                    onMoveToWorst={!worstManager ? moveToWorst : undefined}
                  />
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Кнопка відправки */}
          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              disabled={!canSubmit() || isSubmitting}
              onClick={handleSubmit}
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Збереження...' : 'Далі'}
            </Button>
          </div>

          {/* Додаткова інформація */}
          {!canSubmit() && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Перетягніть рівно 3 найкращих менеджерів та 1 найгіршого для продовження
            </div>
          )}
        </div>
      </div>

      {/* Оверлей для drag */}
      <DragOverlay>
        {activeManager ? (
          <Card className="opacity-90 shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 text-sm mb-1">
                {activeManager.name}
              </h3>
              <p className="text-xs text-gray-600">
                {activeManager.position}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}