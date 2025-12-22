import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, FileText, ChevronDown, ChevronRight, Film, Download, Bold, Italic, AlignCenter } from "lucide-react";
import jsPDF from "jspdf";

interface Scene {
  id: string;
  scene_number: string;
  set_name: string | null;
  description: string | null;
  day_night: string | null;
  int_ext: string | null;
  location: string | null;
  notes: string | null;
}

interface ScreenplayEditorProps {
  productionId: string;
}

interface ScriptElement {
  id: string;
  type: "scene-heading" | "action" | "character" | "dialogue" | "parenthetical" | "transition";
  content: string;
}

export function ScreenplayEditor({ productionId }: ScreenplayEditorProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [scriptContent, setScriptContent] = useState<Record<string, ScriptElement[]>>({});

  useEffect(() => {
    fetchScenes();
  }, [productionId]);

  const fetchScenes = async () => {
    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("production_id", productionId)
      .order("scene_number", { ascending: true });

    if (error) {
      toast.error("Failed to load scenes");
      console.error(error);
    } else {
      setScenes(data || []);
      // Initialize script content for each scene
      const content: Record<string, ScriptElement[]> = {};
      (data || []).forEach(scene => {
        content[scene.id] = loadSceneScript(scene.id);
      });
      setScriptContent(content);
    }
    setLoading(false);
  };

  const loadSceneScript = (sceneId: string): ScriptElement[] => {
    const saved = localStorage.getItem(`screenplay-${sceneId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  };

  const saveSceneScript = (sceneId: string, elements: ScriptElement[]) => {
    localStorage.setItem(`screenplay-${sceneId}`, JSON.stringify(elements));
    setScriptContent(prev => ({ ...prev, [sceneId]: elements }));
  };

  const toggleScene = (sceneId: string) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const addElement = (sceneId: string, type: ScriptElement["type"]) => {
    const elements = scriptContent[sceneId] || [];
    const newElement: ScriptElement = {
      id: `elem-${Date.now()}`,
      type,
      content: "",
    };
    saveSceneScript(sceneId, [...elements, newElement]);
  };

  const updateElement = (sceneId: string, elementId: string, content: string) => {
    const elements = scriptContent[sceneId] || [];
    const updated = elements.map(el => 
      el.id === elementId ? { ...el, content } : el
    );
    saveSceneScript(sceneId, updated);
  };

  const changeElementType = (sceneId: string, elementId: string, type: ScriptElement["type"]) => {
    const elements = scriptContent[sceneId] || [];
    const updated = elements.map(el => 
      el.id === elementId ? { ...el, type } : el
    );
    saveSceneScript(sceneId, updated);
  };

  const deleteElement = (sceneId: string, elementId: string) => {
    const elements = scriptContent[sceneId] || [];
    saveSceneScript(sceneId, elements.filter(el => el.id !== elementId));
  };

  const getSceneHeading = (scene: Scene): string => {
    const parts = [];
    if (scene.int_ext) parts.push(scene.int_ext.toUpperCase());
    if (scene.set_name) parts.push(scene.set_name.toUpperCase());
    if (scene.day_night) parts.push(`- ${scene.day_night.toUpperCase()}`);
    return parts.join(". ") || `SCENE ${scene.scene_number}`;
  };

  const getElementStyles = (type: ScriptElement["type"]) => {
    switch (type) {
      case "scene-heading":
        return "font-bold uppercase tracking-wide";
      case "action":
        return "";
      case "character":
        return "text-center uppercase font-medium";
      case "dialogue":
        return "mx-auto max-w-md";
      case "parenthetical":
        return "mx-auto max-w-xs italic text-slate-400";
      case "transition":
        return "text-right uppercase font-medium";
      default:
        return "";
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25;
    const maxWidth = pageWidth - margin * 2;
    let yPos = 30;
    
    doc.setFont("Courier");
    
    scenes.forEach((scene, sceneIndex) => {
      const elements = scriptContent[scene.id] || [];
      
      // Scene heading
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont("Courier", "bold");
      const heading = getSceneHeading(scene);
      doc.text(heading, margin, yPos);
      yPos += 12;
      
      doc.setFont("Courier", "normal");
      
      elements.forEach(element => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        switch (element.type) {
          case "action":
            doc.setFontSize(12);
            const actionLines = doc.splitTextToSize(element.content, maxWidth);
            doc.text(actionLines, margin, yPos);
            yPos += actionLines.length * 5 + 8;
            break;
          case "character":
            doc.setFontSize(12);
            doc.text(element.content.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
            yPos += 8;
            break;
          case "dialogue":
            doc.setFontSize(12);
            const dialogueWidth = maxWidth * 0.6;
            const dialogueLines = doc.splitTextToSize(element.content, dialogueWidth);
            doc.text(dialogueLines, (pageWidth - dialogueWidth) / 2, yPos);
            yPos += dialogueLines.length * 5 + 8;
            break;
          case "parenthetical":
            doc.setFontSize(10);
            doc.text(`(${element.content})`, pageWidth / 2, yPos, { align: "center" });
            yPos += 8;
            break;
          case "transition":
            doc.setFontSize(12);
            doc.text(element.content.toUpperCase(), pageWidth - margin, yPos, { align: "right" });
            yPos += 12;
            break;
        }
      });
      
      yPos += 10;
    });
    
    doc.save("screenplay.pdf");
    toast.success("PDF exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Screenplay Editor</h2>
          <p className="text-slate-400">Write dialogue and action for your scenes</p>
        </div>
        <Button variant="outline" onClick={exportToPDF} className="border-slate-600 text-slate-300">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {scenes.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 text-center">
              No scenes found. Create scenes in the Scenes tab first, then come back to write your screenplay.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scenes.map((scene) => {
            const isExpanded = expandedScenes.has(scene.id);
            const elements = scriptContent[scene.id] || [];
            
            return (
              <Card key={scene.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleScene(scene.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <CardTitle className="text-white font-mono text-sm">
                        {getSceneHeading(scene)}
                      </CardTitle>
                      {scene.description && (
                        <p className="text-sm text-slate-400 mt-1">{scene.description}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {elements.length} elements
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="border-t border-slate-700 pt-4">
                    {/* Screenplay content */}
                    <div className="bg-slate-900/50 rounded-lg p-6 font-mono text-sm space-y-4 min-h-[200px]">
                      {/* Scene heading */}
                      <div className="font-bold uppercase tracking-wide text-white">
                        {getSceneHeading(scene)}
                      </div>
                      
                      {elements.map((element) => (
                        <div key={element.id} className="group relative">
                          <div className="flex items-start gap-2">
                            <Select
                              value={element.type}
                              onValueChange={(v: ScriptElement["type"]) => changeElementType(scene.id, element.id, v)}
                            >
                              <SelectTrigger className="w-32 h-8 bg-slate-800/50 border-slate-600 text-xs text-slate-400">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="action">Action</SelectItem>
                                <SelectItem value="character">Character</SelectItem>
                                <SelectItem value="dialogue">Dialogue</SelectItem>
                                <SelectItem value="parenthetical">Parenthetical</SelectItem>
                                <SelectItem value="transition">Transition</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Textarea
                              value={element.content}
                              onChange={(e) => updateElement(scene.id, element.id, e.target.value)}
                              placeholder={`Enter ${element.type}...`}
                              className={`flex-1 bg-transparent border-slate-600 text-white resize-none min-h-[40px] ${getElementStyles(element.type)}`}
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteElement(scene.id, element.id)}
                              className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {elements.length === 0 && (
                        <p className="text-slate-500 text-center py-4">
                          Start adding elements to your scene...
                        </p>
                      )}
                    </div>
                    
                    {/* Add element buttons */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      <span className="text-xs text-slate-500">Add:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addElement(scene.id, "action")}
                        className="h-7 text-xs border-slate-600 text-slate-300"
                      >
                        Action
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addElement(scene.id, "character")}
                        className="h-7 text-xs border-slate-600 text-slate-300"
                      >
                        Character
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addElement(scene.id, "dialogue")}
                        className="h-7 text-xs border-slate-600 text-slate-300"
                      >
                        Dialogue
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addElement(scene.id, "parenthetical")}
                        className="h-7 text-xs border-slate-600 text-slate-300"
                      >
                        Parenthetical
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addElement(scene.id, "transition")}
                        className="h-7 text-xs border-slate-600 text-slate-300"
                      >
                        Transition
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
