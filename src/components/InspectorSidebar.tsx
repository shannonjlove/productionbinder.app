import { useState } from "react";
import { X, Type, Palette, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import type { Shot } from "./FormBuilder";

interface ShotFormat {
  fontSize: string;
  fontWeight: string;
  textAlign: string;
  segmentColor: string;
  visualColor: string;
  audioColor: string;
  notesColor: string;
  backgroundColor: string;
}

interface InspectorSidebarProps {
  shot: Shot | null;
  onClose: () => void;
  onUpdateFormat: (shotId: string, format: Partial<ShotFormat>) => void;
  currentFormat: ShotFormat;
}

const fontSizeOptions = ["12px", "14px", "16px", "18px", "20px", "24px"];
const fontWeightOptions = ["normal", "medium", "semibold", "bold"];
const alignmentOptions = [
  { value: "left", icon: AlignLeft, label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right", icon: AlignRight, label: "Right" },
];

const colorPresets = [
  { name: "Default", value: "hsl(var(--foreground))" },
  { name: "Muted", value: "hsl(var(--muted-foreground))" },
  { name: "Primary", value: "hsl(var(--primary))" },
  { name: "Blue", value: "hsl(210, 100%, 50%)" },
  { name: "Green", value: "hsl(120, 60%, 50%)" },
  { name: "Red", value: "hsl(0, 70%, 50%)" },
  { name: "Purple", value: "hsl(280, 60%, 50%)" },
  { name: "Orange", value: "hsl(30, 90%, 50%)" },
];

export const InspectorSidebar = ({ 
  shot, 
  onClose, 
  onUpdateFormat, 
  currentFormat 
}: InspectorSidebarProps) => {
  const [localFormat, setLocalFormat] = useState<ShotFormat>(currentFormat);

  const handleFormatChange = (key: keyof ShotFormat, value: string) => {
    const newFormat = { ...localFormat, [key]: value };
    setLocalFormat(newFormat);
    if (shot) {
      onUpdateFormat(shot.id, { [key]: value });
    }
  };

  if (!shot) {
    return (
      <div className="w-80 border-l border-border bg-card p-6 flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          Select a shot to edit its formatting
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Inspector</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Shot Info */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Shot: {shot.segment || "Untitled"}
          </h4>
          <p className="text-xs text-muted-foreground">
            Edit formatting for this shot
          </p>
        </div>

        <Separator />

        {/* Typography */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Typography</Label>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="fontSize" className="text-xs text-muted-foreground">
              Font Size
            </Label>
            <Select
              value={localFormat.fontSize}
              onValueChange={(value) => handleFormatChange("fontSize", value)}
            >
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizeOptions.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Weight */}
          <div className="space-y-2">
            <Label htmlFor="fontWeight" className="text-xs text-muted-foreground">
              Font Weight
            </Label>
            <Select
              value={localFormat.fontWeight}
              onValueChange={(value) => handleFormatChange("fontWeight", value)}
            >
              <SelectTrigger id="fontWeight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontWeightOptions.map((weight) => (
                  <SelectItem key={weight} value={weight}>
                    {weight.charAt(0).toUpperCase() + weight.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Text Align</Label>
            <div className="flex gap-1">
              {alignmentOptions.map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={localFormat.textAlign === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange("textAlign", value)}
                  className="flex-1"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Colors</Label>
          </div>

          {/* Segment Color */}
          <div className="space-y-2">
            <Label htmlFor="segmentColor" className="text-xs text-muted-foreground">
              Segment Text
            </Label>
            <Select
              value={localFormat.segmentColor}
              onValueChange={(value) => handleFormatChange("segmentColor", value)}
            >
              <SelectTrigger id="segmentColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((color) => (
                  <SelectItem key={color.name} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Color */}
          <div className="space-y-2">
            <Label htmlFor="visualColor" className="text-xs text-muted-foreground">
              Visual Text
            </Label>
            <Select
              value={localFormat.visualColor}
              onValueChange={(value) => handleFormatChange("visualColor", value)}
            >
              <SelectTrigger id="visualColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((color) => (
                  <SelectItem key={color.name} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audio Color */}
          <div className="space-y-2">
            <Label htmlFor="audioColor" className="text-xs text-muted-foreground">
              Audio Text
            </Label>
            <Select
              value={localFormat.audioColor}
              onValueChange={(value) => handleFormatChange("audioColor", value)}
            >
              <SelectTrigger id="audioColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((color) => (
                  <SelectItem key={color.name} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes Color */}
          <div className="space-y-2">
            <Label htmlFor="notesColor" className="text-xs text-muted-foreground">
              Notes Text
            </Label>
            <Select
              value={localFormat.notesColor}
              onValueChange={(value) => handleFormatChange("notesColor", value)}
            >
              <SelectTrigger id="notesColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((color) => (
                  <SelectItem key={color.name} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="backgroundColor" className="text-xs text-muted-foreground">
              Background
            </Label>
            <Input
              id="backgroundColor"
              type="color"
              value={localFormat.backgroundColor}
              onChange={(e) => handleFormatChange("backgroundColor", e.target.value)}
              className="h-10 cursor-pointer"
            />
          </div>
        </div>

        <Separator />

        {/* Reset Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const defaultFormat: ShotFormat = {
              fontSize: "14px",
              fontWeight: "normal",
              textAlign: "left",
              segmentColor: "hsl(var(--foreground))",
              visualColor: "hsl(var(--muted-foreground))",
              audioColor: "hsl(var(--muted-foreground))",
              notesColor: "hsl(var(--muted-foreground))",
              backgroundColor: "transparent",
            };
            setLocalFormat(defaultFormat);
            if (shot) {
              onUpdateFormat(shot.id, defaultFormat);
            }
          }}
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
};
