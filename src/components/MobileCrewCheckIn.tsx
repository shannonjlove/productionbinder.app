import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, Clock, MapPin, Users, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MobileCrewCheckInProps {
  callSheetId: string;
  productionId: string;
}

interface CheckIn {
  id: string;
  call_sheet_id: string;
  crew_member_id: string;
  checked_in_at: string;
  location: string | null;
  notes: string | null;
}

export function MobileCrewCheckIn({ callSheetId, productionId }: MobileCrewCheckInProps) {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Record<string, boolean>>({});

  // Fetch crew members for this production
  const { data: crewMembers = [] } = useQuery({
    queryKey: ['crew-members', productionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .eq('production_id', productionId)
        .order('department', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch check-ins for this call sheet
  const { data: checkIns = [] } = useQuery({
    queryKey: ['crew-check-ins', callSheetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_check_ins')
        .select('*')
        .eq('call_sheet_id', callSheetId);
      if (error) throw error;
      return data as CheckIn[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('crew-check-ins-mobile-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crew_check_ins',
          filter: `call_sheet_id=eq.${callSheetId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crew-check-ins', callSheetId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSheetId, queryClient]);

  const checkInMutation = useMutation({
    mutationFn: async (crewMemberId: string) => {
      const { error } = await supabase.from('crew_check_ins').insert({
        call_sheet_id: callSheetId,
        crew_member_id: crewMemberId,
        location: location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew-check-ins', callSheetId] });
      toast.success('Checked in successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getCheckIn = (crewMemberId: string) => {
    return checkIns.find((c) => c.crew_member_id === crewMemberId);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get address
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast.success('Location captured');
        } catch {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        toast.error(`Unable to get location: ${error.message}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleDepartment = (dept: string) => {
    setExpandedDepartments(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const checkedInCount = checkIns.length;
  const totalCrew = crewMembers.length;
  const progressPercent = totalCrew > 0 ? Math.round((checkedInCount / totalCrew) * 100) : 0;

  // Group crew by department
  const crewByDepartment = crewMembers.reduce((acc, member) => {
    const dept = member.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {} as Record<string, typeof crewMembers>);

  // Calculate department check-in stats
  const getDepartmentStats = (members: typeof crewMembers) => {
    const checkedIn = members.filter(m => getCheckIn(m.id)).length;
    return { checkedIn, total: members.length };
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4 safe-area-inset">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Crew Check-In</span>
          </div>
          <Badge 
            variant={checkedInCount === totalCrew ? 'default' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {checkedInCount}/{totalCrew}
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {progressPercent}% checked in
        </div>
      </div>

      {/* Location Input Section */}
      <div className="px-4 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Your location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            <Navigation className={`h-5 w-5 ${isGettingLocation ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Crew List by Department */}
      <div className="px-4 py-4 space-y-3">
        {Object.entries(crewByDepartment).map(([department, members]) => {
          const stats = getDepartmentStats(members);
          const isExpanded = expandedDepartments[department] !== false; // Default to expanded

          return (
            <Collapsible
              key={department}
              open={isExpanded}
              onOpenChange={() => toggleDepartment(department)}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border active:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{department}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.checkedIn}/{stats.total}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2 space-y-2">
                {members.map((member) => {
                  const checkIn = getCheckIn(member.id);
                  
                  return (
                    <div
                      key={member.id}
                      className={`p-4 rounded-xl border transition-all ${
                        checkIn 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-0.5 shrink-0 ${checkIn ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {checkIn ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <Clock className="h-6 w-6" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-base truncate">{member.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {member.job_title}
                            </div>
                            {checkIn && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(checkIn.checked_in_at), 'h:mm a')}
                                {checkIn.location && (
                                  <span className="flex items-center gap-1 ml-2">
                                    <MapPin className="h-3 w-3" />
                                    {checkIn.location}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!checkIn && (
                          <Button
                            size="lg"
                            className="h-12 px-6 text-base font-medium shrink-0"
                            onClick={() => checkInMutation.mutate(member.id)}
                            disabled={checkInMutation.isPending}
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Empty State */}
      {crewMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No Crew Members</h3>
          <p className="text-muted-foreground text-sm">
            Add crew members to this production to enable check-in.
          </p>
        </div>
      )}
    </div>
  );
}
