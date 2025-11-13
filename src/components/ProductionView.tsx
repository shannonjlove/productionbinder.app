import { Clock, Film, FileText, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Sequence } from "./FormBuilder";

interface ProductionViewProps {
  sequences: Sequence[];
  totalWords: number;
  totalRunningTime: string;
  pacing: string;
}

export const ProductionView = ({ sequences, totalWords, totalRunningTime, pacing }: ProductionViewProps) => {
  // Count totals
  const totalSequences = sequences.length;
  const totalScenes = sequences.reduce((sum, seq) => sum + seq.scenes.length, 0);
  const totalShots = sequences.reduce((sum, seq) => 
    sum + seq.scenes.reduce((sceneSum, scene) => sceneSum + scene.shots.length, 0), 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Production Overview</h2>
        <p className="text-muted-foreground">Summary of your entire production</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Total Sequences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalSequences}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Film className="h-4 w-4" />
              Total Scenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalScenes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Shots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalShots}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Running Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalRunningTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Script Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Words</p>
              <p className="text-2xl font-bold text-foreground">{totalWords}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pacing</p>
              <p className="text-2xl font-bold text-foreground capitalize">{pacing}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sequence Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sequences.map((sequence) => (
              <div key={sequence.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-foreground">{sequence.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {sequence.scenes.length} scene{sequence.scenes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {sequence.scenes.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {sequence.scenes.map((scene) => (
                      <div key={scene.id} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{scene.name}</span>
                        <span className="text-muted-foreground">
                          {scene.shots.length} shot{scene.shots.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};