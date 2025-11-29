import { useState } from "react";
import { Calendar, Clock, MapPin, Download, Users, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import jsPDF from "jspdf";
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

  const exportAsPDF = () => {
    const allScenes = getAllScenes();
    const selectedSceneData = allScenes.filter(s => callSheet.selectedScenes.includes(s.id));
    const selectedCrewData = crew.filter(c => callSheet.selectedCrew.includes(c.id));

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > 270) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("CALL SHEET", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(callSheet.projectName || "Untitled Project", pageWidth / 2, 32, { align: "center" });
    
    y = 55;
    doc.setTextColor(0, 0, 0);

    // Date, Time, Location row
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const colWidth = (pageWidth - 2 * margin) / 3;
    
    doc.text("DATE", margin + 5, y + 8);
    doc.text("CALL TIME", margin + colWidth + 5, y + 8);
    doc.text("LOCATION", margin + colWidth * 2 + 5, y + 8);
    
    doc.setFont("helvetica", "normal");
    doc.text(callSheet.shootDate || "TBD", margin + 5, y + 18);
    doc.text(callSheet.callTime || "TBD", margin + colWidth + 5, y + 18);
    doc.text(callSheet.location || "TBD", margin + colWidth * 2 + 5, y + 18);
    
    y += 35;

    // Weather info
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("WEATHER", margin + 5, y + 8);
    doc.text("SUNRISE", margin + 60, y + 8);
    doc.text("SUNSET", margin + 110, y + 8);
    
    doc.setFont("helvetica", "normal");
    doc.text(callSheet.weather || "TBD", margin + 5, y + 16);
    doc.text(callSheet.sunrise || "TBD", margin + 60, y + 16);
    doc.text(callSheet.sunset || "TBD", margin + 110, y + 16);
    
    y += 30;

    // Scenes section
    if (selectedSceneData.length > 0) {
      checkPageBreak(40);
      
      doc.setFillColor(30, 30, 30);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SCENES TO BE SHOT", margin + 5, y + 7);
      doc.setTextColor(0, 0, 0);
      y += 15;

      selectedSceneData.forEach((sceneData, index) => {
        checkPageBreak(25);
        
        doc.setFillColor(index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 250 : 255);
        doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${sceneData.sequenceName} - ${sceneData.name}`, margin + 5, y + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`${sceneData.scene.shots.length} shot${sceneData.scene.shots.length !== 1 ? 's' : ''}`, margin + 5, y + 16);
        
        y += 22;
      });
      
      y += 10;
    }

    // Crew section
    if (selectedCrewData.length > 0) {
      checkPageBreak(40);
      
      doc.setFillColor(30, 30, 30);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("CREW CALL", margin + 5, y + 7);
      doc.setTextColor(0, 0, 0);
      y += 15;

      // Group crew by department
      const crewByDept: Record<string, CrewMember[]> = {};
      selectedCrewData.forEach(member => {
        const dept = member.department || "Other";
        if (!crewByDept[dept]) crewByDept[dept] = [];
        crewByDept[dept].push(member);
      });

      Object.entries(crewByDept).forEach(([dept, members]) => {
        checkPageBreak(20);
        
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(dept.toUpperCase(), margin + 5, y + 6);
        y += 10;

        members.forEach((member) => {
          checkPageBreak(15);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`${member.name}`, margin + 5, y + 5);
          doc.setFont("helvetica", "normal");
          doc.text(`${member.role}`, margin + 60, y + 5);
          
          if (member.phone || member.email) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const contactInfo = [member.phone, member.email].filter(Boolean).join(" | ");
            doc.text(contactInfo, margin + 5, y + 11);
            doc.setTextColor(0, 0, 0);
            y += 14;
          } else {
            y += 8;
          }
        });
        
        y += 5;
      });
    }

    // Notes section
    if (callSheet.notes) {
      checkPageBreak(40);
      
      doc.setFillColor(30, 30, 30);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("NOTES", margin + 5, y + 7);
      doc.setTextColor(0, 0, 0);
      y += 15;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(callSheet.notes, pageWidth - 2 * margin - 10);
      doc.text(splitNotes, margin + 5, y);
    }

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: "center" });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin, 287, { align: "right" });
    }

    doc.save(`call-sheet-${callSheet.shootDate || "untitled"}.pdf`);
    toast.success("PDF call sheet downloaded successfully");
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
          <Button onClick={exportAsPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Download PDF
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
