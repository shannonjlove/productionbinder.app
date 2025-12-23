import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, User, Save } from "lucide-react";

interface CastMember {
  id: string;
  cast_id: number;
  character_name: string;
  actor_name: string | null;
  email: string | null;
  phone: string | null;
  agent: string | null;
  notes: string | null;
}

interface CastManagerProps {
  productionId: string;
}

export function CastManager({ productionId }: CastManagerProps) {
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCast();
  }, [productionId]);

  const fetchCast = async () => {
    const { data, error } = await supabase
      .from("cast_members")
      .select("*")
      .eq("production_id", productionId)
      .order("cast_id", { ascending: true });

    if (error) {
      toast.error("Failed to load cast");
      console.error(error);
    } else {
      setCastMembers(data || []);
    }
    setLoading(false);
  };

  const addCastMember = async () => {
    const nextId = castMembers.length > 0 
      ? Math.max(...castMembers.map(c => c.cast_id)) + 1 
      : 1;

    const { data, error } = await supabase
      .from("cast_members")
      .insert({
        production_id: productionId,
        cast_id: nextId,
        character_name: `Character ${nextId}`
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add cast member");
      console.error(error);
    } else {
      setCastMembers([...castMembers, data]);
      toast.success("Cast member added");
    }
  };

  const updateCastMember = async (id: string, field: keyof CastMember, value: string | number) => {
    setCastMembers(castMembers.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const saveCastMember = async (castMember: CastMember) => {
    const { error } = await supabase
      .from("cast_members")
      .update({
        cast_id: castMember.cast_id,
        character_name: castMember.character_name,
        actor_name: castMember.actor_name,
        email: castMember.email,
        phone: castMember.phone,
        agent: castMember.agent,
        notes: castMember.notes
      })
      .eq("id", castMember.id);

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success("Saved");
    }
  };

  const deleteCastMember = async (id: string) => {
    const { error } = await supabase
      .from("cast_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error(error);
    } else {
      setCastMembers(castMembers.filter(c => c.id !== id));
      toast.success("Cast member deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cast Members</h3>
          <p className="text-sm text-muted-foreground">Manage your production's cast</p>
        </div>
        <Button onClick={addCastMember} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Cast Member
        </Button>
      </div>

      {castMembers.length === 0 ? (
        <Card variant="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No cast members yet</p>
            <Button onClick={addCastMember} variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
              <Plus className="w-4 h-4 mr-2" />
              Add First Cast Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {castMembers.map((cast) => (
            <Card key={cast.id} variant="glow">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      {cast.cast_id}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => saveCastMember(cast)}
                      className="text-muted-foreground hover:text-green-400"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCastMember(cast.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Character Name</Label>
                    <Input
                      value={cast.character_name}
                      onChange={(e) => updateCastMember(cast.id, "character_name", e.target.value)}
                      className="bg-secondary/50 border-border text-foreground"
                      placeholder="Character name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Actor Name</Label>
                    <Input
                      value={cast.actor_name || ""}
                      onChange={(e) => updateCastMember(cast.id, "actor_name", e.target.value)}
                      className="bg-secondary/50 border-border text-foreground"
                      placeholder="Actor name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        value={cast.email || ""}
                        onChange={(e) => updateCastMember(cast.id, "email", e.target.value)}
                        className="bg-secondary/50 border-border text-foreground text-sm"
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <Input
                        value={cast.phone || ""}
                        onChange={(e) => updateCastMember(cast.id, "phone", e.target.value)}
                        className="bg-secondary/50 border-border text-foreground text-sm"
                        placeholder="Phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <Textarea
                      value={cast.notes || ""}
                      onChange={(e) => updateCastMember(cast.id, "notes", e.target.value)}
                      className="bg-secondary/50 border-border text-foreground text-sm resize-none"
                      rows={2}
                      placeholder="Notes..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
