import { Film, Megaphone, Camera, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCTION_TYPE_TEMPLATES, CustomSection } from "./form-builder/types";
import { toast } from "sonner";

interface ProductionTypeSelectorProps {
  onSelectTemplate: (sections: CustomSection[]) => void;
  currentSectionsCount: number;
}

const PRODUCTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  film: <Film className="h-8 w-8" />,
  commercial: <Megaphone className="h-8 w-8" />,
  documentary: <Camera className="h-8 w-8" />,
  music_video: <Music className="h-8 w-8" />,
};

const PRODUCTION_TYPE_COLORS: Record<string, string> = {
  film: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
  commercial: "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
  documentary: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20",
  music_video: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
};

export const ProductionTypeSelector = ({
  onSelectTemplate,
  currentSectionsCount,
}: ProductionTypeSelectorProps) => {
  const handleSelectTemplate = (template: typeof PRODUCTION_TYPE_TEMPLATES[0]) => {
    // Deep clone the sections to avoid reference issues
    const clonedSections = template.customSections.map((section, sIdx) => ({
      ...section,
      id: `section_${template.productionType}_${sIdx}_${Date.now()}`,
      fields: section.fields.map((field, fIdx) => ({
        ...field,
        id: `field_${template.productionType}_${sIdx}_${fIdx}_${Date.now()}`,
      })),
    }));

    onSelectTemplate(clonedSections);
    toast.success(`${template.name} template applied!`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Start Templates</CardTitle>
        <CardDescription>
          Select a production type to automatically add commonly used sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentSectionsCount > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            ⚠️ Selecting a template will replace your current {currentSectionsCount} custom section{currentSectionsCount !== 1 ? 's' : ''}
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRODUCTION_TYPE_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className={`h-auto flex-col items-center gap-2 p-4 ${PRODUCTION_TYPE_COLORS[template.productionType || 'film']}`}
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="text-primary">
                {PRODUCTION_TYPE_ICONS[template.productionType || 'film']}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">{template.name}</div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {template.customSections.length} sections
                </Badge>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
