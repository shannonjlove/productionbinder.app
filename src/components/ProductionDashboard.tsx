import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Film, Users, Clapperboard, Calendar, FileText, LogOut, Settings, Menu, X, Video, BookOpen, CalendarDays, ShieldCheck } from "lucide-react";
import { CastManager } from "./CastManager";
import { CrewManager } from "./CrewManager";
import { SceneManager } from "./SceneManager";
import { ShootDayManager } from "./ShootDayManager";
import { CallSheetManager } from "./CallSheetManager";
import { DayOutOfDays } from "./DayOutOfDays";
import { AVScriptManager } from "./AVScriptManager";
import { ScreenplayEditor } from "./ScreenplayEditor";
import { ContentCalendar } from "./ContentCalendar";

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
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
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
        company_name: newProductionCompany || null,
        created_by: user?.id
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

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Production Hub</h1>
              <p className="text-xs text-slate-400">Call Sheet Manager</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Productions</span>
            <Dialog open={newProductionOpen} onOpenChange={setNewProductionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">New Production</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Create a new production to manage cast, crew, and call sheets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Production Name</Label>
                    <Input
                      placeholder="e.g. It's a Wonderful Life"
                      value={newProductionName}
                      onChange={(e) => setNewProductionName(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Company Name (optional)</Label>
                    <Input
                      placeholder="e.g. RKO Pictures"
                      value={newProductionCompany}
                      onChange={(e) => setNewProductionCompany(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <Button onClick={createProduction} className="w-full bg-amber-600 hover:bg-amber-700">
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
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedProduction?.id === production.id
                    ? "bg-amber-600/20 text-amber-500 border border-amber-600/30"
                    : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span className="truncate text-sm">{production.name}</span>
                </div>
                {production.company_name && (
                  <p className="text-xs text-slate-500 mt-0.5 ml-6 truncate">{production.company_name}</p>
                )}
              </button>
            ))}
            {productions.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No productions yet</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          {isAdmin && (
            <Link to="/admin" className="block mt-2">
              <Button variant="outline" size="sm" className="w-full border-amber-600/40 text-amber-400 hover:bg-amber-600/10 hover:text-amber-300">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-700 flex items-center px-4 bg-slate-800/30 backdrop-blur-xl">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white mr-4">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {selectedProduction ? (
            <div>
              <h2 className="font-semibold text-white">{selectedProduction.name}</h2>
              {selectedProduction.company_name && (
                <p className="text-xs text-slate-400">{selectedProduction.company_name}</p>
              )}
            </div>
          ) : (
            <h2 className="font-semibold text-slate-400">Select a production</h2>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedProduction ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
                <TabsTrigger value="cast" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Cast
                </TabsTrigger>
                <TabsTrigger value="crew" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Crew
                </TabsTrigger>
                <TabsTrigger value="scenes" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Scenes
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="callsheets" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Clapperboard className="w-4 h-4 mr-2" />
                  Call Sheets
                </TabsTrigger>
                <TabsTrigger value="dood" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Day-out-of-Days
                </TabsTrigger>
                <TabsTrigger value="avscript" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Video className="w-4 h-4 mr-2" />
                  A/V Script
                </TabsTrigger>
                <TabsTrigger value="screenplay" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Screenplay
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-slate-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Calendar
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
              <TabsContent value="calendar">
                <ContentCalendar productionId={selectedProduction.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <Film className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Production Selected</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Select a production from the sidebar or create a new one to get started with managing your cast, crew, and call sheets.
              </p>
              <Button onClick={() => setNewProductionOpen(true)} className="bg-amber-600 hover:bg-amber-700">
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
