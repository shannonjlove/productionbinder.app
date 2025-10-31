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

interface Row {
  id: string;
  segment: string;
  visual: string;
  audio: string;
  notes: string;
  duration: string; // in format MM:SS or just seconds
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

export const FormBuilder = () => {
  const [rows, setRows] = useState<Row[]>([
    { id: "1", segment: "", visual: "", audio: "", notes: "", duration: "" },
  ]);
  const [pacing, setPacing] = useState<PacingType>("medium");
  const [useAutoDuration, setUseAutoDuration] = useState(true);
  const [currentView, setCurrentView] = useState<"production" | "shot" | "script" | "detail">("shot");
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [shotDetails, setShotDetails] = useState<Record<string, DetailData>>({});

  // Get color for a segment
  const getSegmentColor = (segmentName: string): string => {
    if (!segmentName || segmentName.trim() === "") return "transparent";
    
    // Get all unique segments in order of appearance
    const uniqueSegments: string[] = [];
    rows.forEach(row => {
      const seg = row.segment.trim().toLowerCase();
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
    return rows.reduce((sum, row) => sum + countWords(row.audio), 0);
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
    const totalSeconds = rows.reduce((sum, row) => {
      const duration = useAutoDuration 
        ? calculateDurationFromWords(countWords(row.audio))
        : row.duration;
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedDetails = localStorage.getItem(DETAILS_STORAGE_KEY);
    if (saved) {
      try {
        setRows(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data");
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(shotDetails));
  }, [shotDetails]);

  const addRow = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      segment: "",
      visual: "",
      audio: "",
      notes: "",
      duration: "",
    };
    setRows([...rows, newRow]);
    toast.success("Row added");
  };

  const deleteRow = (id: string) => {
    if (rows.length === 1) {
      toast.error("Cannot delete the last row");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
    if (selectedShotId === id) {
      setSelectedShotId(null);
      setCurrentView("shot");
    }
    toast.success("Row deleted");
  };

  const handleSelectShot = (id: string) => {
    setSelectedShotId(id);
    setCurrentView("script");
  };

  const handleBackToShots = () => {
    setSelectedShotId(null);
    setCurrentView("shot");
  };

  const updateCell = (id: string, field: keyof Omit<Row, "id">, value: string) => {
    setRows(rows.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      
      // Auto-update duration when audio changes and auto-duration is enabled
      if (field === "audio" && useAutoDuration) {
        const wordCount = countWords(value);
        updated.duration = calculateDurationFromWords(wordCount);
      }
      
      return updated;
    }));
  };

  // Update all durations when pacing changes
  useEffect(() => {
    if (useAutoDuration) {
      setRows(rows.map(row => ({
        ...row,
        duration: calculateDurationFromWords(countWords(row.audio))
      })));
    }
  }, [pacing, useAutoDuration]);

  const exportToCSV = () => {
    const headers = ["Segment/Scene", "Visual", "Audio", "Word Count", "Duration"];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => {
        const wordCount = countWords(row.audio);
        const duration = useAutoDuration 
          ? calculateDurationFromWords(wordCount)
          : row.duration;
        return [row.segment, row.visual, row.audio, wordCount.toString(), duration]
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(",");
      }),
      "",
      `"Total Words:",,,"${getTotalWordCount()}",""`,
      `"Total Running Time:",,,,"${getTotalRunningTime()}"`,
      `"Pacing:",,,"${pacing}",""`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `av-script-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported successfully");
  };

  const saveManually = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    toast.success("Saved successfully");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AV Script Builder
          </h1>
          <p className="text-muted-foreground">
            Create professional audio-visual scripts with ease
          </p>
        </header>

        {/* Controls Section */}
        <div className="mb-6 space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={addRow} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Shot
            </Button>
            <Button onClick={saveManually} variant="secondary" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
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
              rows={rows}
              totalWords={getTotalWordCount()}
              totalRunningTime={getTotalRunningTime()}
              pacing={pacing}
            />
          </TabsContent>

          <TabsContent value="shot">
            <ShotList 
              rows={rows}
              onDeleteRow={deleteRow}
              onSelectShot={handleSelectShot}
              getSegmentColor={getSegmentColor}
              countWords={countWords}
              calculateDurationFromWords={calculateDurationFromWords}
              useAutoDuration={useAutoDuration}
            />
          </TabsContent>

          <TabsContent value="script">
            {selectedShotId && (
              <ScriptEditor 
                row={rows.find(r => r.id === selectedShotId)!}
                onUpdateCell={updateCell}
                onBack={handleBackToShots}
                getSegmentColor={getSegmentColor}
                countWords={countWords}
                calculateDurationFromWords={calculateDurationFromWords}
                useAutoDuration={useAutoDuration}
              />
            )}
          </TabsContent>

          <TabsContent value="detail">
            {selectedShotId && (
              <DetailView 
                row={rows.find(r => r.id === selectedShotId)!}
                details={getDetailData(selectedShotId)}
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
