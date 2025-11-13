import { useState, useEffect } from "react";
import { Plus, Download, Save, Clock, Gauge, Layers, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ProductionView } from "./ProductionView";
import { ShotList } from "./ShotList";
import { ScriptEditor } from "./ScriptEditor";
import { DetailView } from "./DetailView";

type PacingType = "slow" | "medium" | "fast";

const PACING_RATES: Record<PacingType, number> = {
  slow: 120,    // words per minute
  medium: 150,
  fast: 180,
};

// Segment colors - using HSL values for consistency
const SEGMENT_COLORS = [
  "hsl(210, 100%, 95%)",  // Light blue
  "hsl(160, 100%, 95%)",  // Light teal
  "hsl(280, 100%, 95%)",  // Light purple
  "hsl(30, 100%, 95%)",   // Light orange
  "hsl(340, 100%, 95%)",  // Light pink
  "hsl(120, 100%, 95%)",  // Light green
  "hsl(50, 100%, 95%)",   // Light yellow
  "hsl(190, 100%, 95%)",  // Light cyan
];

export interface Shot {
  id: string;
  sceneId: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string;
}

export interface Scene {
  id: string;
  sequenceId: string;
  name: string;
  shots: Shot[];
}

export interface Sequence {
  id: string;
  name: string;
  scenes: Scene[];
}

interface DetailData {
  size: string;
  extra: string;
  aov: string;
  angle: string;
  movement: string;
  frame: string;
  focalLength: string;
  setup: string;
  camera: string;
  equipment: string;
  technicalNotes: string;
}

const STORAGE_KEY = "av-script-data";
const DETAILS_STORAGE_KEY = "av-script-details";
const HIERARCHY_STORAGE_KEY = "av-script-hierarchy";

export const FormBuilder = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [pacing, setPacing] = useState<PacingType>("medium");
  const [useAutoDuration, setUseAutoDuration] = useState(true);
  const [currentView, setCurrentView] = useState<"production" | "shot" | "script" | "detail">("shot");
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [shotDetails, setShotDetails] = useState<Record<string, DetailData>>({});

  // Helper to get all shots from sequences
  const getAllShots = (): Shot[] => {
    const shots: Shot[] = [];
    sequences.forEach(seq => {
      seq.scenes.forEach(scene => {
        shots.push(...scene.shots);
      });
    });
    return shots;
  };

  // Helper to find a shot by id
  const findShot = (shotId: string): Shot | undefined => {
    return getAllShots().find(s => s.id === shotId);
  };

  // Helper to find scene by id
  const findScene = (sceneId: string): Scene | undefined => {
    for (const seq of sequences) {
      const scene = seq.scenes.find(s => s.id === sceneId);
      if (scene) return scene;
    }
    return undefined;
  };

  // Helper to find sequence by id
  const findSequence = (sequenceId: string): Sequence | undefined => {
    return sequences.find(s => s.id === sequenceId);
  };

  // Get color for a segment
  const getSegmentColor = (segmentName: string): string => {
    if (!segmentName || segmentName.trim() === "") return "transparent";
    
    const allShots = getAllShots();
    const uniqueSegments: string[] = [];
    allShots.forEach(shot => {
      const seg = shot.segment.trim().toLowerCase();
      if (seg && !uniqueSegments.includes(seg)) {
        uniqueSegments.push(seg);
      }
    });
    
    const index = uniqueSegments.indexOf(segmentName.trim().toLowerCase());
    return index >= 0 ? SEGMENT_COLORS[index % SEGMENT_COLORS.length] : "transparent";
  };

  // Count words in text
  const countWords = (text: string): number => {
    if (!text || text.trim() === "") return 0;
    return text.trim().split(/\s+/).length;
  };

  // Calculate duration from word count and pacing
  const calculateDurationFromWords = (wordCount: number): string => {
    if (wordCount === 0) return "00:00";
    const wordsPerMinute = PACING_RATES[pacing];
    const minutes = wordCount / wordsPerMinute;
    const totalSeconds = Math.round(minutes * 60);
    return formatSecondsToTime(totalSeconds);
  };

  // Get total word count
  const getTotalWordCount = (): number => {
    return getAllShots().reduce((sum, shot) => sum + countWords(shot.audio), 0);
  };

  // Parse duration string (MM:SS or SS) to total seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === "") return 0;
    
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else {
      return parseInt(timeStr) || 0;
    }
  };

  // Format seconds to MM:SS
  const formatSecondsToTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate total running time
  const getTotalRunningTime = (): string => {
    const totalSeconds = getAllShots().reduce((sum, shot) => {
      const duration = useAutoDuration 
        ? calculateDurationFromWords(countWords(shot.audio))
        : shot.duration;
      return sum + parseTimeToSeconds(duration);
    }, 0);
    return formatSecondsToTime(totalSeconds);
  };

  // Get or create detail data for a shot
  const getDetailData = (shotId: string): DetailData => {
    if (shotDetails[shotId]) {
      return shotDetails[shotId];
    }
    return {
      size: "",
      extra: "",
      aov: "",
      angle: "",
      movement: "",
      frame: "",
      focalLength: "",
      setup: "",
      camera: "",
      equipment: "",
      technicalNotes: "",
    };
  };

  const updateDetailData = (shotId: string, field: keyof DetailData, value: string) => {
    setShotDetails(prev => ({
      ...prev,
      [shotId]: {
        ...getDetailData(shotId),
        [field]: value
      }
    }));
  };

  // Migration: Load old data and convert to new structure
  useEffect(() => {
    const savedHierarchy = localStorage.getItem(HIERARCHY_STORAGE_KEY);
    const savedDetails = localStorage.getItem(DETAILS_STORAGE_KEY);
    
    if (savedHierarchy) {
      try {
        setSequences(JSON.parse(savedHierarchy));
      } catch (e) {
        console.error("Failed to load hierarchy data");
      }
    } else {
      // Check for old data format and migrate
      const oldData = localStorage.getItem(STORAGE_KEY);
      if (oldData) {
        try {
          const oldRows = JSON.parse(oldData);
          // Migrate to new structure
          const defaultSequence: Sequence = {
            id: "seq-1",
            name: "Sequence 1",
            scenes: []
          };

          // Group old rows by segment into scenes
          const segmentMap = new Map<string, Shot[]>();
          oldRows.forEach((row: any) => {
            const segment = row.segment || "Scene 1";
            if (!segmentMap.has(segment)) {
              segmentMap.set(segment, []);
            }
            segmentMap.get(segment)!.push({
              id: row.id,
              sceneId: "",
              segment: row.segment,
              visual: row.visual,
              audio: row.audio,
              notes: row.notes,
              duration: row.duration
            });
          });

          // Create scenes from segments
          let sceneIndex = 1;
          segmentMap.forEach((shots, segmentName) => {
            const scene: Scene = {
              id: `scene-${sceneIndex}`,
              sequenceId: "seq-1",
              name: segmentName || `Scene ${sceneIndex}`,
              shots: shots.map(s => ({ ...s, sceneId: `scene-${sceneIndex}` }))
            };
            defaultSequence.scenes.push(scene);
            sceneIndex++;
          });

          setSequences([defaultSequence]);
        } catch (e) {
          console.error("Failed to migrate old data");
          // Initialize with default structure
          setSequences([{
            id: "seq-1",
            name: "Sequence 1",
            scenes: [{
              id: "scene-1",
              sequenceId: "seq-1",
              name: "Scene 1",
              shots: [{
                id: "1",
                sceneId: "scene-1",
                segment: "",
                visual: "",
                audio: "",
                notes: "",
                duration: ""
              }]
            }]
          }]);
        }
      } else {
        // Initialize with default structure
        setSequences([{
          id: "seq-1",
          name: "Sequence 1",
          scenes: [{
            id: "scene-1",
            sequenceId: "seq-1",
            name: "Scene 1",
            shots: [{
              id: "1",
              sceneId: "scene-1",
              segment: "",
              visual: "",
              audio: "",
              notes: "",
              duration: ""
            }]
          }]
        }]);
      }
    }

    if (savedDetails) {
      try {
        setShotDetails(JSON.parse(savedDetails));
      } catch (e) {
        console.error("Failed to load detail data");
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (sequences.length > 0) {
      localStorage.setItem(HIERARCHY_STORAGE_KEY, JSON.stringify(sequences));
    }
  }, [sequences]);

  useEffect(() => {
    localStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(shotDetails));
  }, [shotDetails]);

  const addSequence = () => {
    const newSequence: Sequence = {
      id: `seq-${Date.now()}`,
      name: `Sequence ${sequences.length + 1}`,
      scenes: []
    };
    setSequences([...sequences, newSequence]);
    toast.success("Sequence added");
  };

  const addScene = (sequenceId: string) => {
    setSequences(sequences.map(seq => {
      if (seq.id === sequenceId) {
        const newScene: Scene = {
          id: `scene-${Date.now()}`,
          sequenceId,
          name: `Scene ${seq.scenes.length + 1}`,
          shots: []
        };
        return { ...seq, scenes: [...seq.scenes, newScene] };
      }
      return seq;
    }));
    toast.success("Scene added");
  };

  const addShot = (sceneId: string) => {
    setSequences(sequences.map(seq => ({
      ...seq,
      scenes: seq.scenes.map(scene => {
        if (scene.id === sceneId) {
          const newShot: Shot = {
            id: `shot-${Date.now()}`,
            sceneId,
            segment: scene.name,
            visual: "",
            audio: "",
            notes: "",
            duration: "",
          };
          return { ...scene, shots: [...scene.shots, newShot] };
        }
        return scene;
      })
    })));
    toast.success("Shot added");
  };

  const deleteSequence = (sequenceId: string) => {
    if (sequences.length === 1) {
      toast.error("Cannot delete the last sequence");
      return;
    }
    setSequences(sequences.filter(seq => seq.id !== sequenceId));
    toast.success("Sequence deleted");
  };

  const deleteScene = (sceneId: string) => {
    setSequences(sequences.map(seq => ({
      ...seq,
      scenes: seq.scenes.filter(scene => scene.id !== sceneId)
    })).filter(seq => seq.scenes.length > 0));
    toast.success("Scene deleted");
  };

  const deleteShot = (shotId: string) => {
    setSequences(sequences.map(seq => ({
      ...seq,
      scenes: seq.scenes.map(scene => ({
        ...scene,
        shots: scene.shots.filter(shot => shot.id !== shotId)
      }))
    })));
    
    if (selectedShotId === shotId) {
      setSelectedShotId(null);
      setCurrentView("shot");
    }
    toast.success("Shot deleted");
  };

  const updateSequenceName = (sequenceId: string, name: string) => {
    setSequences(sequences.map(seq => 
      seq.id === sequenceId ? { ...seq, name } : seq
    ));
  };

  const updateSceneName = (sceneId: string, name: string) => {
    setSequences(sequences.map(seq => ({
      ...seq,
      scenes: seq.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, name } : scene
      )
    })));
  };

  const reorderShots = (sceneId: string, reorderedShots: Shot[]) => {
    setSequences(sequences.map(seq => ({
      ...seq,
      scenes: seq.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, shots: reorderedShots } : scene
      )
    })));
  };

  const reorderScenes = (sequenceId: string, reorderedScenes: Scene[]) => {
    setSequences(sequences.map(seq =>
      seq.id === sequenceId ? { ...seq, scenes: reorderedScenes } : seq
    ));
  };

  const reorderSequences = (reorderedSequences: Sequence[]) => {
    setSequences(reorderedSequences);
  };

  const handleSelectShot = (id: string) => {
    setSelectedShotId(id);
    setCurrentView("script");
  };

  const handleBackToShots = () => {
    setSelectedShotId(null);
    setCurrentView("shot");
  };

  const updateShot = (shotId: string, field: keyof Omit<Shot, "id" | "sceneId">, value: string) => {
    setSequences(sequences.map(seq => ({
      ...seq,
      scenes: seq.scenes.map(scene => ({
        ...scene,
        shots: scene.shots.map(shot => {
          if (shot.id !== shotId) return shot;
          const updated = { ...shot, [field]: value };
          
          // Auto-update duration when audio changes and auto-duration is enabled
          if (field === "audio" && useAutoDuration) {
            const wordCount = countWords(value);
            updated.duration = calculateDurationFromWords(wordCount);
          }
          
          return updated;
        })
      }))
    })));
  };

  // Update all durations when pacing changes
  useEffect(() => {
    if (useAutoDuration) {
      setSequences(sequences.map(seq => ({
        ...seq,
        scenes: seq.scenes.map(scene => ({
          ...scene,
          shots: scene.shots.map(shot => ({
            ...shot,
            duration: calculateDurationFromWords(countWords(shot.audio))
          }))
        }))
      })));
    }
  }, [pacing, useAutoDuration]);

  const exportToCSV = () => {
    const headers = ["Sequence", "Scene", "Shot", "Segment", "Visual", "Audio", "Word Count", "Duration"];
    const rows: string[] = [headers.join(",")];
    
    sequences.forEach(seq => {
      seq.scenes.forEach(scene => {
        scene.shots.forEach(shot => {
          const wordCount = countWords(shot.audio);
          const duration = useAutoDuration 
            ? calculateDurationFromWords(wordCount)
            : shot.duration;
          rows.push([
            seq.name,
            scene.name,
            shot.id,
            shot.segment,
            shot.visual,
            shot.audio,
            wordCount.toString(),
            duration
          ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(","));
        });
      });
    });

    rows.push("");
    rows.push(`"Total Words:",,,,,"${getTotalWordCount()}",`);
    rows.push(`"Total Running Time:","",,,,"","${getTotalRunningTime()}"`);
    rows.push(`"Pacing:",,,,,"${pacing}",`);

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-script-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported successfully");
  };

  const exportToMarkdown = () => {
    let markdown = `# AV Script\n\n`;
    markdown += `**Total Words:** ${getTotalWordCount()}\n\n`;
    markdown += `**Total Running Time:** ${getTotalRunningTime()}\n\n`;
    markdown += `**Pacing:** ${pacing}\n\n`;
    markdown += `---\n\n`;

    sequences.forEach((seq, seqIndex) => {
      markdown += `## ${seqIndex + 1}. ${seq.name}\n\n`;
      
      seq.scenes.forEach((scene, sceneIndex) => {
        markdown += `### ${seqIndex + 1}.${sceneIndex + 1} ${scene.name}\n\n`;
        
        scene.shots.forEach((shot, shotIndex) => {
          const wordCount = countWords(shot.audio);
          const duration = useAutoDuration 
            ? calculateDurationFromWords(wordCount)
            : shot.duration;
          
          markdown += `#### Shot ${seqIndex + 1}.${sceneIndex + 1}.${shotIndex + 1}\n\n`;
          
          if (shot.segment) {
            markdown += `**Segment:** ${shot.segment}\n\n`;
          }
          
          markdown += `**Visual:**\n${shot.visual}\n\n`;
          markdown += `**Audio:**\n${shot.audio}\n\n`;
          
          if (shot.notes) {
            markdown += `**Notes:**\n${shot.notes}\n\n`;
          }
          
          markdown += `**Duration:** ${duration} | **Word Count:** ${wordCount}\n\n`;
          
          // Add shot details if available
          const details = shotDetails[shot.id];
          if (details && Object.values(details).some(v => v.trim() !== "")) {
            markdown += `**Technical Details:**\n\n`;
            markdown += `| Category | Value |\n`;
            markdown += `|----------|-------|\n`;
            if (details.size) markdown += `| Size | ${details.size} |\n`;
            if (details.extra) markdown += `| Extra | ${details.extra} |\n`;
            if (details.aov) markdown += `| AOV | ${details.aov} |\n`;
            if (details.angle) markdown += `| Angle | ${details.angle} |\n`;
            if (details.movement) markdown += `| Movement | ${details.movement} |\n`;
            if (details.frame) markdown += `| Frame | ${details.frame} |\n`;
            if (details.focalLength) markdown += `| Focal Length | ${details.focalLength} |\n`;
            if (details.setup) markdown += `| Setup | ${details.setup} |\n`;
            if (details.camera) markdown += `| Camera | ${details.camera} |\n`;
            if (details.equipment) markdown += `| Equipment | ${details.equipment} |\n`;
            if (details.technicalNotes) markdown += `| Technical Notes | ${details.technicalNotes} |\n`;
            markdown += `\n`;
          }
          
          markdown += `---\n\n`;
        });
      });
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-script-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    toast.success("Markdown exported successfully");
  };

  const saveManually = () => {
    localStorage.setItem(HIERARCHY_STORAGE_KEY, JSON.stringify(sequences));
    toast.success("Saved successfully");
  };

  const selectedShot = selectedShotId ? findShot(selectedShotId) : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AV Script Builder
          </h1>
          <p className="text-muted-foreground">
            Create professional audio-visual scripts with hierarchical organization
          </p>
        </header>

        {/* Controls Section */}
        <div className="mb-6 space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={addSequence} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Sequence
            </Button>
            <Button onClick={saveManually} variant="secondary" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={exportToMarkdown} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Markdown
            </Button>
          </div>

          {/* Pacing and Stats */}
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Script Pacing:</span>
              </div>
              <Select value={pacing} onValueChange={(v) => setPacing(v as PacingType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow (120 wpm)</SelectItem>
                  <SelectItem value="medium">Medium (150 wpm)</SelectItem>
                  <SelectItem value="fast">Fast (180 wpm)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={useAutoDuration ? "default" : "outline"}
                size="sm"
                onClick={() => setUseAutoDuration(!useAutoDuration)}
              >
                {useAutoDuration ? "Auto Duration" : "Manual Duration"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-muted/50 px-4 py-2 rounded-lg border border-border">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Words: </span>
                  <span className="font-bold text-foreground">{getTotalWordCount()}</span>
                </div>
              </div>
              <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <Clock className="h-4 w-4 text-primary inline-block mr-2" />
                <span className="text-sm text-muted-foreground">Total Time: </span>
                <span className="font-bold text-primary text-lg">{getTotalRunningTime()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Four-Level View System */}
        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as "production" | "shot" | "script" | "detail")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="production" className="gap-2">
              <Layers className="h-4 w-4" />
              Production
            </TabsTrigger>
            <TabsTrigger value="shot" className="gap-2">
              <Layers className="h-4 w-4" />
              Shots
            </TabsTrigger>
            <TabsTrigger value="script" disabled={!selectedShotId} className="gap-2">
              <Layers className="h-4 w-4" />
              Script
            </TabsTrigger>
            <TabsTrigger value="detail" disabled={!selectedShotId} className="gap-2">
              <Camera className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="production">
            <ProductionView 
              sequences={sequences}
              totalWords={getTotalWordCount()}
              totalRunningTime={getTotalRunningTime()}
              pacing={pacing}
            />
          </TabsContent>

          <TabsContent value="shot">
            <ShotList 
              sequences={sequences}
              onAddSequence={addSequence}
              onAddScene={addScene}
              onAddShot={addShot}
              onDeleteSequence={deleteSequence}
              onDeleteScene={deleteScene}
              onDeleteShot={deleteShot}
              onUpdateSequenceName={updateSequenceName}
              onUpdateSceneName={updateSceneName}
              onReorderShots={reorderShots}
              onReorderScenes={reorderScenes}
              onReorderSequences={reorderSequences}
              onSelectShot={handleSelectShot}
              getSegmentColor={getSegmentColor}
              countWords={countWords}
              calculateDurationFromWords={calculateDurationFromWords}
              useAutoDuration={useAutoDuration}
            />
          </TabsContent>

          <TabsContent value="script">
            {selectedShot && (
              <ScriptEditor 
                row={selectedShot}
                onUpdateCell={updateShot}
                onBack={handleBackToShots}
                getSegmentColor={getSegmentColor}
                countWords={countWords}
                calculateDurationFromWords={calculateDurationFromWords}
                useAutoDuration={useAutoDuration}
              />
            )}
          </TabsContent>

          <TabsContent value="detail">
            {selectedShot && (
              <DetailView 
                row={selectedShot}
                details={getDetailData(selectedShotId!)}
                onUpdateDetail={updateDetailData}
                onBack={handleBackToShots}
                getSegmentColor={getSegmentColor}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Changes are automatically saved to your browser</p>
        </div>
      </div>
    </div>
  );
};