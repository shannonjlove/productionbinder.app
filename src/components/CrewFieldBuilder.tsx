import { useState } from "react";
import { Plus, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CustomField, 
  DEFAULT_FIELD_TYPES, 
  createEmptyField, 
  CREW_FIELD_TEMPLATES,
  FieldType 
} from "./form-builder/types";
import { DraggableFieldList } from "./form-builder/DraggableFieldList";

interface CrewFieldBuilderProps {
  customFields: CustomField[];
  onFieldsChange: (fields: CustomField[]) => void;
}

export const CrewFieldBuilder = ({ customFields, onFieldsChange }: CrewFieldBuilderProps) => {
  const [activeTab, setActiveTab] = useState<"fields" | "templates">("fields");

  const addField = (type: FieldType) => {
    const newField = createEmptyField(type, customFields.length);
    onFieldsChange([...customFields, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<CustomField>) => {
    onFieldsChange(customFields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (fieldId: string) => {
    onFieldsChange(customFields.filter(field => field.id !== fieldId));
  };

  const reorderFields = (reorderedFields: CustomField[]) => {
    onFieldsChange(reorderedFields);
  };

  const applyTemplate = (templateId: string) => {
    const template = CREW_FIELD_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newFields = template.fields.map((fieldData, index) => ({
      ...fieldData,
      id: `field_${Date.now()}_${index}`,
      sortOrder: customFields.length + index,
    } as CustomField));

    onFieldsChange([...customFields, ...newFields]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Custom Fields
        </CardTitle>
        <CardDescription>
          Add custom fields to capture additional crew information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="fields">
              <Plus className="h-4 w-4 mr-2" />
              Add Fields
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Sparkles className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {DEFAULT_FIELD_TYPES.map((fieldType) => (
                <Button
                  key={fieldType.type}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-2"
                  onClick={() => addField(fieldType.type)}
                >
                  <span className="mr-2">{fieldType.icon}</span>
                  <span className="text-xs">{fieldType.label}</span>
                </Button>
              ))}
            </div>

            <div className="pt-4">
              <DraggableFieldList
                fields={customFields}
                onUpdate={updateField}
                onDelete={deleteField}
                onReorder={reorderFields}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quickly add common field sets with templates
            </p>
            <div className="grid gap-3">
              {CREW_FIELD_TEMPLATES.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.fields.length} fields: {template.fields.map(f => f.label).join(', ')}
                      </p>
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
