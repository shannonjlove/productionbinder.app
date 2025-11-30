import { useState } from "react";
import { Download, Upload, Save, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CustomSection, CallSheetTemplate } from "./form-builder/types";
import { DigitalCallSheetFormData } from "./DigitalCallSheetForm";

interface CallSheetTemplatesProps {
  templates: CallSheetTemplate[];
  currentSections: CustomSection[];
  onSaveTemplate: (template: CallSheetTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyTemplate: (sections: CustomSection[]) => void;
  onExportFullCallSheet?: (form: DigitalCallSheetFormData) => void;
}

export const CallSheetTemplates = ({
  templates,
  currentSections,
  onSaveTemplate,
  onDeleteTemplate,
  onApplyTemplate,
}: CallSheetTemplatesProps) => {
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const template: CallSheetTemplate = {
      id: `template_${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim(),
      customSections: currentSections,
    };

    onSaveTemplate(template);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setDialogOpen(false);
    toast.success("Template saved!");
  };

  const handleExportTemplate = (template: CallSheetTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `callsheet-template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template exported!");
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as CallSheetTemplate;
        
        if (!imported.name || !imported.customSections) {
          toast.error("Invalid template file format");
          return;
        }

        // Give it a new ID to avoid conflicts
        const newTemplate: CallSheetTemplate = {
          ...imported,
          id: `template_${Date.now()}`,
        };

        onSaveTemplate(newTemplate);
        toast.success(`Template "${imported.name}" imported!`);
      } catch (error) {
        toast.error("Failed to import template. Please check the file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Call Sheet Templates
        </CardTitle>
        <CardDescription>
          Save and reuse your custom section configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                disabled={currentSections.length === 0}
              >
                <Save className="h-4 w-4" />
                Save as Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Template</DialogTitle>
                <DialogDescription>
                  Save your current custom sections as a reusable template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Documentary Shoot"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Brief description..."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentSections.length} section{currentSections.length !== 1 ? 's' : ''} will be saved
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAsTemplate}>
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportTemplate}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>

        {templates.length > 0 && (
          <div className="space-y-3 pt-2">
            <Label className="text-sm text-muted-foreground">Saved Templates</Label>
            {templates.map((template) => (
              <Card key={template.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.customSections.length} section{template.customSections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onApplyTemplate(template.customSections)}
                      title="Apply template"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExportTemplate(template)}
                      title="Export template"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved templates yet. Create custom sections and save them as templates.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
