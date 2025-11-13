import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

interface ProductionChecklistProps {
  categories: ChecklistCategory[];
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategoryName: (id: string, name: string) => void;
  onAddItem: (categoryId: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onUpdateItem: (categoryId: string, itemId: string, text: string) => void;
  onToggleItem: (categoryId: string, itemId: string) => void;
}

export const ProductionChecklist = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategoryName,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  onToggleItem,
}: ProductionChecklistProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getCategoryProgress = (category: ChecklistCategory) => {
    if (category.items.length === 0) return 0;
    const completed = category.items.filter(item => item.completed).length;
    return (completed / category.items.length) * 100;
  };

  const getOverallProgress = () => {
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    if (totalItems === 0) return 0;
    const completedItems = categories.reduce(
      (sum, cat) => sum + cat.items.filter(item => item.completed).length,
      0
    );
    return (completedItems / totalItems) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Production Checklist</h2>
          <p className="text-muted-foreground">Track completion status across all departments</p>
        </div>
        <Button onClick={onAddCategory} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Overall Progress */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Overall Progress</h3>
            <span className="text-2xl font-bold text-primary">
              {Math.round(getOverallProgress())}%
            </span>
          </div>
          <Progress value={getOverallProgress()} className="h-3" />
        </div>
      </Card>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const progress = getCategoryProgress(category);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <Card key={category.id} className="overflow-hidden">
              <div className="p-4 bg-muted/30 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCategory(category.id)}
                  className="h-6 w-6"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                <Input
                  value={category.name}
                  onChange={(e) => onUpdateCategoryName(category.id, e.target.value)}
                  className="max-w-xs font-semibold"
                  placeholder="Category name"
                />

                <div className="flex-1 flex items-center gap-4">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-sm font-semibold text-muted-foreground min-w-[60px]">
                    {category.items.filter(i => i.completed).length}/{category.items.length}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onAddItem(category.id)}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Item
                  </Button>
                  <Button
                    onClick={() => onDeleteCategory(category.id)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-2">
                  {category.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No items in this category. Click "Add Item" to create one.
                    </div>
                  ) : (
                    category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => onToggleItem(category.id, item.id)}
                          id={`item-${item.id}`}
                        />
                        
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}

                        <Input
                          value={item.text}
                          onChange={(e) => onUpdateItem(category.id, item.id, e.target.value)}
                          className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                          placeholder="Task description"
                        />

                        <Button
                          onClick={() => onDeleteItem(category.id, item.id)}
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No checklist categories yet</p>
            <Button onClick={onAddCategory} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Category
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
