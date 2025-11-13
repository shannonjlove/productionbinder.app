import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Sequence } from "./FormBuilder";

export interface Prop {
  id: string;
  number: number;
  name: string;
  description: string;
  scenes: string[]; // scene IDs where prop is needed
}

interface PropsListProps {
  props: Prop[];
  sequences: Sequence[];
  onAddProp: () => void;
  onDeleteProp: (id: string) => void;
  onUpdateProp: (id: string, field: keyof Prop, value: any) => void;
}

export const PropsList = ({
  props,
  sequences,
  onAddProp,
  onDeleteProp,
  onUpdateProp,
}: PropsListProps) => {
  const [expandedProp, setExpandedProp] = useState<string | null>(null);

  const getAllScenes = () => {
    const scenes: { id: string; name: string; sequenceName: string }[] = [];
    sequences.forEach(seq => {
      seq.scenes.forEach(scene => {
        scenes.push({
          id: scene.id,
          name: scene.name,
          sequenceName: seq.name
        });
      });
    });
    return scenes;
  };

  const toggleScene = (propId: string, sceneId: string) => {
    const prop = props.find(p => p.id === propId);
    if (!prop) return;

    const newScenes = prop.scenes.includes(sceneId)
      ? prop.scenes.filter(id => id !== sceneId)
      : [...prop.scenes, sceneId];

    onUpdateProp(propId, "scenes", newScenes);
  };

  const allScenes = getAllScenes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Props List</h2>
          <p className="text-muted-foreground">Manage props with numbering and scene allocation</p>
        </div>
        <Button onClick={onAddProp} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Prop
        </Button>
      </div>

      <div className="space-y-4">
        {props.map((prop) => (
          <Card key={prop.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold text-primary">#{prop.number}</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`prop-name-${prop.id}`}>Prop Name</Label>
                      <Input
                        id={`prop-name-${prop.id}`}
                        value={prop.name}
                        onChange={(e) => onUpdateProp(prop.id, "name", e.target.value)}
                        placeholder="Enter prop name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`prop-number-${prop.id}`}>Prop Number</Label>
                      <Input
                        id={`prop-number-${prop.id}`}
                        type="number"
                        value={prop.number}
                        onChange={(e) => onUpdateProp(prop.id, "number", parseInt(e.target.value) || 0)}
                        placeholder="Auto-numbered"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`prop-description-${prop.id}`}>Description</Label>
                    <Textarea
                      id={`prop-description-${prop.id}`}
                      value={prop.description}
                      onChange={(e) => onUpdateProp(prop.id, "description", e.target.value)}
                      placeholder="Describe the prop, its condition, special requirements..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Needed in Scenes ({prop.scenes.length})</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedProp(
                          expandedProp === prop.id ? null : prop.id
                        )}
                      >
                        {expandedProp === prop.id ? "Hide" : "Show"} Scenes
                      </Button>
                    </div>

                    {expandedProp === prop.id && (
                      <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                        {allScenes.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No scenes available. Add sequences and scenes first.
                          </p>
                        ) : (
                          allScenes.map((scene) => (
                            <div key={scene.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`${prop.id}-${scene.id}`}
                                checked={prop.scenes.includes(scene.id)}
                                onCheckedChange={() => toggleScene(prop.id, scene.id)}
                              />
                              <Label
                                htmlFor={`${prop.id}-${scene.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {scene.sequenceName} → {scene.name}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteProp(prop.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {props.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No props added yet</p>
            <Button onClick={onAddProp} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Prop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
