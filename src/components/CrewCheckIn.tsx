import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCrewCheckIn } from './MobileCrewCheckIn';

interface CrewCheckInProps {
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

export function CrewCheckIn({ callSheetId, productionId }: CrewCheckInProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState('');

  // Render mobile-optimized view on mobile devices
  if (isMobile) {
    return <MobileCrewCheckIn callSheetId={callSheetId} productionId={productionId} />;
  }

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
      .channel('crew-check-ins-realtime')
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
      toast.success('Checked in successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getCheckIn = (crewMemberId: string) => {
    return checkIns.find((c) => c.crew_member_id === crewMemberId);
  };

  const checkedInCount = checkIns.length;
  const totalCrew = crewMembers.length;

  // Group crew by department
  const crewByDepartment = crewMembers.reduce((acc, member) => {
    const dept = member.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(member);
    return acc;
  }, {} as Record<string, typeof crewMembers>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crew Check-In Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-2xl font-bold">
              {checkedInCount} / {totalCrew}
            </div>
            <Badge variant={checkedInCount === totalCrew ? 'default' : 'secondary'}>
              {Math.round((checkedInCount / totalCrew) * 100) || 0}% Checked In
            </Badge>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Your location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {Object.entries(crewByDepartment).map(([department, members]) => (
        <Card key={department}>
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{department}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members.map((member) => {
                const checkIn = getCheckIn(member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {checkIn ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.job_title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {checkIn ? (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(checkIn.checked_in_at), 'h:mm a')}
                          {checkIn.location && (
                            <span className="ml-2">@ {checkIn.location}</span>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
