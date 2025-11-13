import { useState } from "react";
import { Trash2, GripVertical, Plus, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Sequence, Scene, Shot } from "./FormBuilder";

interface ShotListProps {
  sequences: Sequence[];
  onAddSequence: () => void;
  onAddScene: (sequenceId: string) => void;
  onAddShot: (sceneId: string) => void;
  onDeleteSequence: (sequenceId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onDeleteShot: (shotId: string) => void;
  onUpdateSequenceName: (sequenceId: string, name: string) => void;
  onUpdateSceneName: (sceneId: string, name: string) => void;
  onReorderShots: (sceneId: string, shots: Shot[]) => void;
  onReorderScenes: (sequenceId: string, scenes: Scene[]) => void;
  onReorderSequences: (sequences: Sequence[]) => void;
  onSelectShot: (shotId: string) => void;
  getSegmentColor: (segment: string) => string;
  countWords: (text: string) => number;
  calculateDurationFromWords: (count: number) => string;
  useAutoDuration: boolean;
}

interface SortableShotProps {
  shot: Shot;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  getSegmentColor: (segment: string) => string;
  countWords: (text: string) => number;
  calculateDurationFromWords: (count: number) => string;
  useAutoDuration: boolean;
}

const SortableShot = ({ shot, onDelete, onSelect, getSegmentColor, countWords, calculateDurationFromWords, useAutoDuration }: SortableShotProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const segmentColor = getSegmentColor(shot.segment);
  const wordCount = countWords(shot.audio);
  const duration = useAutoDuration ? calculateDurationFromWords(wordCount) : shot.duration;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border-b border-border hover:bg-muted/30 transition-colors border-l-4"
      onClick={() => onSelect(shot.id)}
      {...attributes}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 grid grid-cols-[15%_30%_30%_8%_10%] gap-2 items-center">
        <div className="font-medium text-foreground truncate">{shot.segment || "Untitled"}</div>
        <div className="text-sm text-muted-foreground line-clamp-1">{shot.visual}</div>
        <div className="text-sm text-muted-foreground line-clamp-1">{shot.audio}</div>
        <div className="text-sm font-mono text-muted-foreground text-center">{wordCount}</div>
        <div className="text-sm font-mono text-foreground">{duration}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(shot.id);
        }}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const ShotList = ({ 
  sequences,
  onAddSequence,
  onAddScene,
  onAddShot,
  onDeleteSequence,
  onDeleteScene,
  onDeleteShot,
  onUpdateSequenceName,
  onUpdateSceneName,
  onReorderShots,
  onReorderScenes,
  onReorderSequences,
  onSelectShot,
  getSegmentColor,
  countWords,
  calculateDurationFromWords,
  useAutoDuration
}: ShotListProps) => {
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set(sequences.map(s => s.id)));
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [editingSequence, setEditingSequence] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleSequence = (seqId: string) => {
    setExpandedSequences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seqId)) {
        newSet.delete(seqId);
      } else {
        newSet.add(seqId);
      }
      return newSet;
    });
  };

  const toggleScene = (sceneId: string) => {
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  };

  const handleShotDragEnd = (sceneId: string, scene: Scene) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = scene.shots.findIndex(s => s.id === active.id);
      const newIndex = scene.shots.findIndex(s => s.id === over.id);
      onReorderShots(sceneId, arrayMove(scene.shots, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Shot List</h2>
          <p className="text-muted-foreground">Organize your production with sequences, scenes, and shots</p>
        </div>
        <Button onClick={onAddSequence} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Sequence
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        {sequences.map((sequence) => (
          <div key={sequence.id} className="border-b border-border last:border-0">
            {/* Sequence Header */}
            <div className="bg-primary/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSequence(sequence.id)}
                  className="h-6 w-6"
                >
                  {expandedSequences.has(sequence.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                
                {editingSequence === sequence.id ? (
                  <Input
                    value={sequence.name}
                    onChange={(e) => onUpdateSequenceName(sequence.id, e.target.value)}
                    onBlur={() => setEditingSequence(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingSequence(null)}
                    className="max-w-xs"
                    autoFocus
                  />
                ) : (
                  <h3 
                    className="text-lg font-bold text-foreground cursor-pointer flex items-center gap-2"
                    onClick={() => setEditingSequence(sequence.id)}
                  >
                    {sequence.name}
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </h3>
                )}
                
                <span className="text-sm text-muted-foreground">
                  {sequence.scenes.length} scene{sequence.scenes.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => onAddScene(sequence.id)}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Add Scene
                </Button>
                <Button
                  onClick={() => onDeleteSequence(sequence.id)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scenes */}
            {expandedSequences.has(sequence.id) && (
              <div>
                {sequence.scenes.map((scene) => (
                  <div key={scene.id} className="border-t border-border">
                    {/* Scene Header */}
                    <div className="bg-muted/30 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleScene(scene.id)}
                          className="h-5 w-5 ml-8"
                        >
                          {expandedScenes.has(scene.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                        
                        {editingScene === scene.id ? (
                          <Input
                            value={scene.name}
                            onChange={(e) => onUpdateSceneName(scene.id, e.target.value)}
                            onBlur={() => setEditingScene(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingScene(null)}
                            className="max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <h4 
                            className="font-semibold text-foreground cursor-pointer flex items-center gap-2"
                            onClick={() => setEditingScene(scene.id)}
                          >
                            {scene.name}
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </h4>
                        )}
                        
                        <span className="text-sm text-muted-foreground">
                          {scene.shots.length} shot{scene.shots.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onAddShot(scene.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Plus className="h-3 w-3" />
                          Add Shot
                        </Button>
                        <Button
                          onClick={() => onDeleteScene(scene.id)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Shots */}
                    {expandedScenes.has(scene.id) && scene.shots.length > 0 && (
                      <div className="ml-16">
                        {/* Table Header */}
                        <div className="grid grid-cols-[auto_15%_30%_30%_8%_10%_auto] gap-2 p-3 bg-muted/20 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                          <div className="w-6"></div>
                          <div>Segment</div>
                          <div>Visual</div>
                          <div>Audio</div>
                          <div className="text-center">Words</div>
                          <div>Duration</div>
                          <div className="w-10"></div>
                        </div>

                        {/* Draggable Shots */}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleShotDragEnd(scene.id, scene)}
                        >
                          <SortableContext
                            items={scene.shots.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {scene.shots.map((shot) => (
                              <SortableShot
                                key={shot.id}
                                shot={shot}
                                onDelete={onDeleteShot}
                                onSelect={onSelectShot}
                                getSegmentColor={getSegmentColor}
                                countWords={countWords}
                                calculateDurationFromWords={calculateDurationFromWords}
                                useAutoDuration={useAutoDuration}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}

                    {expandedScenes.has(scene.id) && scene.shots.length === 0 && (
                      <div className="ml-16 p-8 text-center text-muted-foreground">
                        No shots in this scene. Click "Add Shot" to create one.
                      </div>
                    )}
                  </div>
                ))}

                {sequence.scenes.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No scenes in this sequence. Click "Add Scene" to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};