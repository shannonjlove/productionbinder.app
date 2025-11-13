import { useState } from "react";
import { Calendar, Clock, MapPin, Download, Users, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Sequence, Scene } from "./FormBuilder";
import type { CrewMember } from "./CrewContacts";

export interface CallSheetData {
  projectName: string;
  shootDate: string;
  callTime: string;
  location: string;
  weather: string;
  sunrise: string;
  sunset: string;
  selectedScenes: string[]; // scene IDs
  selectedCrew: string[]; // crew member IDs
  notes: string;
}

interface CallSheetProps {
  sequences: Sequence[];
  crew: CrewMember[];
  callSheet: CallSheetData;
  onUpdateCallSheet: (field: keyof CallSheetData, value: any) => void;
}

export const CallSheet = ({
  sequences,
  crew,
  callSheet,
  onUpdateCallSheet,
}: CallSheetProps) => {
  const [previewMode, setPreviewMode] = useState(false);

  const getAllScenes = () => {
    const scenes: { id: string; name: string; sequenceName: string; sequence: Sequence; scene: Scene }[] = [];
    sequences.forEach(seq => {
      seq.scenes.forEach(scene => {
        scenes.push({
          id: scene.id,
          name: scene.name,
          sequenceName: seq.name,
          sequence: seq,
          scene: scene
        });
      });
    });
    return scenes;
  };

  const toggleScene = (sceneId: string) => {
    const newScenes = callSheet.selectedScenes.includes(sceneId)
      ? callSheet.selectedScenes.filter(id => id !== sceneId)
      : [...callSheet.selectedScenes, sceneId];
    onUpdateCallSheet("selectedScenes", newScenes);
  };

  const toggleCrew = (crewId: string) => {
    const newCrew = callSheet.selectedCrew.includes(crewId)
      ? callSheet.selectedCrew.filter(id => id !== crewId)
      : [...callSheet.selectedCrew, crewId];
    onUpdateCallSheet("selectedCrew", newCrew);
  };

  const exportCallSheet = () => {
    const allScenes = getAllScenes();
    const selectedSceneData = allScenes.filter(s => callSheet.selectedScenes.includes(s.id));
    const selectedCrewData = crew.filter(c => callSheet.selectedCrew.includes(c.id));

    let content = `
═══════════════════════════════════════════════════════
                    CALL SHEET
═══════════════════════════════════════════════════════

PROJECT: ${callSheet.projectName || "Untitled Project"}
DATE: ${callSheet.shootDate || "TBD"}
CALL TIME: ${callSheet.callTime || "TBD"}

═══════════════════════════════════════════════════════
                  LOCATION & WEATHER
═══════════════════════════════════════════════════════

Location: ${callSheet.location || "TBD"}
Weather: ${callSheet.weather || "TBD"}
Sunrise: ${callSheet.sunrise || "TBD"}
Sunset: ${callSheet.sunset || "TBD"}

═══════════════════════════════════════════════════════
                  SCENES TO BE SHOT
═══════════════════════════════════════════════════════

`;

    selectedSceneData.forEach((sceneData, index) => {
      content += `${index + 1}. ${sceneData.sequenceName} - ${sceneData.name}\n`;
      content += `   Shots: ${sceneData.scene.shots.length}\n`;
      if (sceneData.scene.shots.length > 0) {
        sceneData.scene.shots.forEach((shot, shotIndex) => {
          content += `   ${shotIndex + 1}) ${shot.segment || "Untitled"}\n`;
          if (shot.visual) content += `      Visual: ${shot.visual}\n`;
        });
      }
      content += `\n`;
    });

    content += `
═══════════════════════════════════════════════════════
                    CREW CALL
═══════════════════════════════════════════════════════

`;

    // Group crew by department
    const crewByDept: Record<string, CrewMember[]> = {};
    selectedCrewData.forEach(member => {
      const dept = member.department || "Other";
      if (!crewByDept[dept]) crewByDept[dept] = [];
      crewByDept[dept].push(member);
    });

    Object.entries(crewByDept).forEach(([dept, members]) => {
      content += `${dept}:\n`;
      members.forEach(member => {
        content += `  • ${member.name} - ${member.role}\n`;
        if (member.phone) content += `    Phone: ${member.phone}\n`;
        if (member.email) content += `    Email: ${member.email}\n`;
      });
      content += `\n`;
    });

    if (callSheet.notes) {
      content += `
═══════════════════════════════════════════════════════
                      NOTES
═══════════════════════════════════════════════════════

${callSheet.notes}
`;
    }

    content += `
═══════════════════════════════════════════════════════
               END OF CALL SHEET
═══════════════════════════════════════════════════════
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-sheet-${callSheet.shootDate || "untitled"}.txt`;
    a.click();
    toast.success("Call sheet exported successfully");
  };

  const allScenes = getAllScenes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Call Sheet</h2>
          <p className="text-muted-foreground">Generate production call sheets with scene and crew details</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPreviewMode(!previewMode)} variant="outline">
            {previewMode ? "Edit Mode" : "Preview Mode"}
          </Button>
          <Button onClick={exportCallSheet} className="gap-2">
            <Download className="h-4 w-4" />
            Export Call Sheet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Details */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Project Details
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={callSheet.projectName}
                onChange={(e) => onUpdateCallSheet("projectName", e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="shoot-date">Shoot Date</Label>
                <Input
                  id="shoot-date"
                  type="date"
                  value={callSheet.shootDate}
                  onChange={(e) => onUpdateCallSheet("shootDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="call-time">Call Time</Label>
                <Input
                  id="call-time"
                  type="time"
                  value={callSheet.callTime}
                  onChange={(e) => onUpdateCallSheet("callTime", e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Location & Weather */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location & Weather
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={callSheet.location}
                onChange={(e) => onUpdateCallSheet("location", e.target.value)}
                placeholder="Shooting location address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weather">Weather Forecast</Label>
              <Input
                id="weather"
                value={callSheet.weather}
                onChange={(e) => onUpdateCallSheet("weather", e.target.value)}
                placeholder="e.g., Sunny, 75°F"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sunrise">Sunrise</Label>
                <Input
                  id="sunrise"
                  value={callSheet.sunrise}
                  onChange={(e) => onUpdateCallSheet("sunrise", e.target.value)}
                  placeholder="06:30 AM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sunset">Sunset</Label>
                <Input
                  id="sunset"
                  value={callSheet.sunset}
                  onChange={(e) => onUpdateCallSheet("sunset", e.target.value)}
                  placeholder="07:45 PM"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Scenes Selection */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Scenes to Shoot</h3>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {allScenes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scenes available. Add sequences and scenes first.
              </p>
            ) : (
              allScenes.map((scene) => (
                <label
                  key={scene.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={callSheet.selectedScenes.includes(scene.id)}
                    onChange={() => toggleScene(scene.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {scene.sequenceName} → {scene.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {scene.scene.shots.length} shot{scene.scene.shots.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </Card>

        {/* Crew Selection */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Crew Call</h3>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {crew.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No crew members available. Add crew contacts first.
              </p>
            ) : (
              crew.map((member) => (
                <label
                  key={member.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={callSheet.selectedCrew.includes(member.id)}
                    onChange={() => toggleCrew(member.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.role} • {member.department}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Notes */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Additional Notes</h3>
        <Textarea
          value={callSheet.notes}
          onChange={(e) => onUpdateCallSheet("notes", e.target.value)}
          placeholder="Add any special instructions, parking info, catering details, etc..."
          className="min-h-[120px]"
        />
      </Card>
    </div>
  );
};
