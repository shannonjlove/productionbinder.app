import { useState } from "react";
import { Plus, Settings2, Sparkles, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CustomField, 
  CustomSection,
  DEFAULT_FIELD_TYPES, 
  createEmptyField,
  createEmptySection,
  CALLSHEET_SECTION_TEMPLATES,
  FieldType 
} from "./form-builder/types";
import { DraggableFieldList } from "./form-builder/DraggableFieldList";

interface CallSheetSectionBuilderProps {
  customSections: CustomSection[];
  onSectionsChange: (sections: CustomSection[]) => void;
}

export const CallSheetSectionBuilder = ({ 
  customSections, 
  onSectionsChange 
}: CallSheetSectionBuilderProps) => {
  const [activeTab, setActiveTab] = useState<"sections" | "templates">("sections");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const addSection = () => {
    const newSection = createEmptySection(customSections.length);
    onSectionsChange([...customSections, newSection]);
    setExpandedSections(prev => ({ ...prev, [newSection.id]: true }));
  };

  const updateSection = (sectionId: string, updates: Partial<CustomSection>) => {
    onSectionsChange(customSections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    onSectionsChange(customSections.filter(section => section.id !== sectionId));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...customSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    const reorderedSections = newSections.map((section, idx) => ({
      ...section,
      sortOrder: idx
    }));
    
    onSectionsChange(reorderedSections);
  };

  const addFieldToSection = (sectionId: string, type: FieldType) => {
    const section = customSections.find(s => s.id === sectionId);
    if (!section) return;

    const newField = createEmptyField(type, section.fields.length);
    updateSection(sectionId, { fields: [...section.fields, newField] });
  };

  const updateFieldInSection = (sectionId: string, fieldId: string, updates: Partial<CustomField>) => {
    const section = customSections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedFields = section.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    updateSection(sectionId, { fields: updatedFields });
  };

  const deleteFieldFromSection = (sectionId: string, fieldId: string) => {
    const section = customSections.find(s => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, { 
      fields: section.fields.filter(f => f.id !== fieldId) 
    });
  };

  const reorderFieldsInSection = (sectionId: string, reorderedFields: CustomField[]) => {
    updateSection(sectionId, { fields: reorderedFields });
  };

  const applyTemplate = (templateId: string) => {
    const template = CALLSHEET_SECTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newSection: CustomSection = {
      id: `section_${Date.now()}`,
      name: template.name,
      icon: template.icon,
      sortOrder: customSections.length,
      collapsible: true,
      fields: template.fields.map((fieldData, index) => ({
        ...fieldData,
        id: `field_${Date.now()}_${index}`,
        sortOrder: index,
      } as CustomField)),
    };

    onSectionsChange([...customSections, newSection]);
    setExpandedSections(prev => ({ ...prev, [newSection.id]: true }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Custom Sections
        </CardTitle>
        <CardDescription>
          Add custom sections to your call sheet with dynamic fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sections">
              <Plus className="h-4 w-4 mr-2" />
              Build Sections
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Sparkles className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-4">
            <Button onClick={addSection} variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add New Section
            </Button>

            <div className="space-y-4">
              {customSections
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((section, index) => (
                  <Collapsible
                    key={section.id}
                    open={expandedSections[section.id]}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                                disabled={index === customSections.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-lg">{section.icon}</span>
                            <div className="flex-1 text-left">
                              <CardTitle className="text-base">{section.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Section Name</Label>
                              <Input
                                value={section.name}
                                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                                placeholder="Section name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Icon (emoji)</Label>
                              <Input
                                value={section.icon || ''}
                                onChange={(e) => updateSection(section.id, { icon: e.target.value })}
                                placeholder="📋"
                                maxLength={2}
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <Label className="text-sm mb-2 block">Add Fields:</Label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {DEFAULT_FIELD_TYPES.slice(0, 8).map((fieldType) => (
                                <Button
                                  key={fieldType.type}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start h-auto py-1.5 text-xs"
                                  onClick={() => addFieldToSection(section.id, fieldType.type)}
                                >
                                  <span className="mr-1">{fieldType.icon}</span>
                                  {fieldType.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2">
                            <DraggableFieldList
                              fields={section.fields}
                              onUpdate={(fieldId, updates) => updateFieldInSection(section.id, fieldId, updates)}
                              onDelete={(fieldId) => deleteFieldFromSection(section.id, fieldId)}
                              onReorder={(fields) => reorderFieldsInSection(section.id, fields)}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
            </div>

            {customSections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No custom sections yet</p>
                <p className="text-sm">Add sections or use templates to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quickly add pre-built sections with common fields
            </p>
            <div className="grid gap-3">
              {CALLSHEET_SECTION_TEMPLATES.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h4 className="font-medium text-foreground">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.fields.length} fields
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
