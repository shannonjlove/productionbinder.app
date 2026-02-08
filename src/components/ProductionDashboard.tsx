import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Film, Users, Clapperboard, Calendar, FileText, Menu, X, Video, BookOpen } from "lucide-react";
import { CastManager } from "./CastManager";
import { CrewManager } from "./CrewManager";
import { SceneManager } from "./SceneManager";
import { ShootDayManager } from "./ShootDayManager";
import { CallSheetManager } from "./CallSheetManager";
import { DayOutOfDays } from "./DayOutOfDays";
import { AVScriptManager } from "./AVScriptManager";
import { ScreenplayEditor } from "./ScreenplayEditor";

interface Production {
  id: string;
  name: string;
  company_name: string | null;
  director: string | null;
  producer: string | null;
  start_date: string | null;
  end_date: string | null;
  total_days: number | null;
}

export function ProductionDashboard() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [newProductionOpen, setNewProductionOpen] = useState(false);
  const [newProductionName, setNewProductionName] = useState("");
  const [newProductionCompany, setNewProductionCompany] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("cast");

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    const { data, error } = await supabase
      .from("productions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load productions");
      console.error(error);
    } else {
      setProductions(data || []);
    }
    setLoading(false);
  };

  const createProduction = async () => {
    if (!newProductionName.trim()) {
      toast.error("Please enter a production name");
      return;
    }

    const { data, error } = await supabase
      .from("productions")
      .insert({
        name: newProductionName,
        company_name: newProductionCompany || null
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create production");
      console.error(error);
    } else {
      setProductions([data, ...productions]);
      setSelectedProduction(data);
      setNewProductionOpen(false);
      setNewProductionName("");
      setNewProductionCompany("");
      toast.success("Production created");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 glass-panel border-r border-border/50 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-glow-sm">
              <Clapperboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Production Hub</h1>
              <p className="text-xs text-muted-foreground">Call Sheet Manager</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Productions</span>
            <Dialog open={newProductionOpen} onOpenChange={setNewProductionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover-glow">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-foreground">New Production</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Create a new production to manage cast, crew, and call sheets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Production Name</Label>
                    <Input
                      placeholder="e.g. It's a Wonderful Life"
                      value={newProductionName}
                      onChange={(e) => setNewProductionName(e.target.value)}
                      className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Company Name (optional)</Label>
                    <Input
                      placeholder="e.g. RKO Pictures"
                      value={newProductionCompany}
                      onChange={(e) => setNewProductionCompany(e.target.value)}
                      className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button onClick={createProduction} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
                    Create Production
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1">
            {productions.map((production) => (
              <button
                key={production.id}
                onClick={() => setSelectedProduction(production)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 hover-lift ${
                  selectedProduction?.id === production.id
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-glow-sm"
                    : "text-foreground/80 hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span className="truncate text-sm">{production.name}</span>
                </div>
                {production.company_name && (
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6 truncate">{production.company_name}</p>
                )}
              </button>
            ))}
            {productions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No productions yet</p>
            )}
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Glass Header */}
        <header className="h-14 glass-header flex items-center px-4">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground hover:bg-secondary/30 mr-4">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {selectedProduction ? (
            <div>
              <h2 className="font-semibold text-foreground">{selectedProduction.name}</h2>
              {selectedProduction.company_name && (
                <p className="text-xs text-muted-foreground">{selectedProduction.company_name}</p>
              )}
            </div>
          ) : (
            <h2 className="font-semibold text-muted-foreground">Select a production</h2>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedProduction ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="glass-panel border border-border/30 mb-6 p-1">
                <TabsTrigger value="cast" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <Users className="w-4 h-4 mr-2" />
                  Cast
                </TabsTrigger>
                <TabsTrigger value="crew" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <Users className="w-4 h-4 mr-2" />
                  Crew
                </TabsTrigger>
                <TabsTrigger value="scenes" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <FileText className="w-4 h-4 mr-2" />
                  Scenes
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="callsheets" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <Clapperboard className="w-4 h-4 mr-2" />
                  Call Sheets
                </TabsTrigger>
                <TabsTrigger value="dood" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <Calendar className="w-4 h-4 mr-2" />
                  Day-out-of-Days
                </TabsTrigger>
                <TabsTrigger value="avscript" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <Video className="w-4 h-4 mr-2" />
                  A/V Script
                </TabsTrigger>
                <TabsTrigger value="screenplay" className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-sm transition-all">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Screenplay
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cast">
                <CastManager productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="crew">
                <CrewManager productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="scenes">
                <SceneManager productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="schedule">
                <ShootDayManager productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="callsheets">
                <CallSheetManager productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="dood">
                <DayOutOfDays productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="avscript">
                <AVScriptManager productionId={selectedProduction.id} />
              </TabsContent>
              <TabsContent value="screenplay">
                <ScreenplayEditor productionId={selectedProduction.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 glass-panel rounded-2xl flex items-center justify-center mb-6">
                <Film className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Production Selected</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Select a production from the sidebar or create a new one to get started with managing your cast, crew, and call sheets.
              </p>
              <Button onClick={() => setNewProductionOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Create Production
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
