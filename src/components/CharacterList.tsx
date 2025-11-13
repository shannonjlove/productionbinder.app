import { useState } from "react";
import { Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Sequence } from "./FormBuilder";

export interface Character {
  id: string;
  name: string;
  role: string;
  scenes: string[]; // scene IDs where character appears
}

interface CharacterListProps {
  characters: Character[];
  sequences: Sequence[];
  onAddCharacter: () => void;
  onDeleteCharacter: (id: string) => void;
  onUpdateCharacter: (id: string, field: keyof Character, value: any) => void;
}

export const CharacterList = ({
  characters,
  sequences,
  onAddCharacter,
  onDeleteCharacter,
  onUpdateCharacter,
}: CharacterListProps) => {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);

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

  const toggleScene = (characterId: string, sceneId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const newScenes = character.scenes.includes(sceneId)
      ? character.scenes.filter(id => id !== sceneId)
      : [...character.scenes, sceneId];

    onUpdateCharacter(characterId, "scenes", newScenes);
  };

  const allScenes = getAllScenes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Character List</h2>
          <p className="text-muted-foreground">Manage characters and their scene appearances</p>
        </div>
        <Button onClick={onAddCharacter} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Character
        </Button>
      </div>

      <div className="space-y-4">
        {characters.map((character) => (
          <Card key={character.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`character-name-${character.id}`}>Character Name</Label>
                      <Input
                        id={`character-name-${character.id}`}
                        value={character.name}
                        onChange={(e) => onUpdateCharacter(character.id, "name", e.target.value)}
                        placeholder="Enter character name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`character-role-${character.id}`}>Role/Description</Label>
                      <Input
                        id={`character-role-${character.id}`}
                        value={character.role}
                        onChange={(e) => onUpdateCharacter(character.id, "role", e.target.value)}
                        placeholder="e.g., Protagonist, Narrator"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Appears in Scenes ({character.scenes.length})</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCharacter(
                          expandedCharacter === character.id ? null : character.id
                        )}
                      >
                        {expandedCharacter === character.id ? "Hide" : "Show"} Scenes
                      </Button>
                    </div>

                    {expandedCharacter === character.id && (
                      <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                        {allScenes.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No scenes available. Add sequences and scenes first.
                          </p>
                        ) : (
                          allScenes.map((scene) => (
                            <div key={scene.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`${character.id}-${scene.id}`}
                                checked={character.scenes.includes(scene.id)}
                                onCheckedChange={() => toggleScene(character.id, scene.id)}
                              />
                              <Label
                                htmlFor={`${character.id}-${scene.id}`}
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
                  onClick={() => onDeleteCharacter(character.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {characters.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No characters added yet</p>
            <Button onClick={onAddCharacter} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Character
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
