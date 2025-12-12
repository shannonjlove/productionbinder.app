import { useState, useEffect } from "react";
import { Send, Check, Eye, Clock, AlertCircle, Mail, Phone, RefreshCw, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CrewCall, CastMember, DigitalCallSheetFormData } from "./DigitalCallSheetForm";

interface DeliveryStatus {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  type: "cast" | "crew";
  emailStatus: "pending" | "sent" | "delivered" | "opened" | "bounced";
  smsStatus: "pending" | "sent" | "delivered" | "failed";
  confirmed: boolean;
  sentAt?: string;
  openedAt?: string;
  confirmedAt?: string;
}

interface DeliveryTrackingProps {
  callSheet: DigitalCallSheetFormData;
  onConfirmationUpdate?: (recipientId: string, confirmed: boolean) => void;
}

export const DeliveryTracking = ({ callSheet, onConfirmationUpdate }: DeliveryTrackingProps) => {
  const [deliveryStatuses, setDeliveryStatuses] = useState<DeliveryStatus[]>([]);
  const [sending, setSending] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Initialize delivery statuses from call sheet
  useEffect(() => {
    const statuses: DeliveryStatus[] = [];

    callSheet.crewCalls.forEach(crew => {
      statuses.push({
        recipientId: crew.id,
        recipientName: crew.name,
        recipientEmail: crew.email,
        recipientPhone: crew.phone,
        type: "crew",
        emailStatus: "pending",
        smsStatus: "pending",
        confirmed: crew.confirmed
      });
    });

    callSheet.castMembers.forEach(cast => {
      statuses.push({
        recipientId: cast.id,
        recipientName: cast.name,
        recipientEmail: "",
        recipientPhone: "",
        type: "cast",
        emailStatus: "pending",
        smsStatus: "pending",
        confirmed: cast.confirmed
      });
    });

    setDeliveryStatuses(statuses);
  }, [callSheet]);

  const sendToRecipient = async (status: DeliveryStatus, method: "email" | "sms" | "both") => {
    setSendingTo(status.recipientId);

    try {
      const { data, error } = await supabase.functions.invoke("send-call-sheet-notification", {
        body: {
          callSheet,
          recipient: {
            name: status.recipientName,
            email: status.recipientEmail,
            phone: status.recipientPhone
          },
          method
        }
      });

      if (error) throw error;

      setDeliveryStatuses(prev => prev.map(s => 
        s.recipientId === status.recipientId 
          ? { 
              ...s, 
              emailStatus: method !== "sms" ? "sent" : s.emailStatus,
              smsStatus: method !== "email" ? "sent" : s.smsStatus,
              sentAt: new Date().toISOString()
            } 
          : s
      ));

      toast.success(`Call sheet sent to ${status.recipientName}`);
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(`Failed to send to ${status.recipientName}`);
    } finally {
      setSendingTo(null);
    }
  };

  const sendToAll = async (method: "email" | "sms" | "both") => {
    setSending(true);

    try {
      const recipients = deliveryStatuses.filter(s => {
        if (method === "email" && !s.recipientEmail) return false;
        if (method === "sms" && !s.recipientPhone) return false;
        return true;
      });

      const { data, error } = await supabase.functions.invoke("send-call-sheet-notification", {
        body: {
          callSheet,
          recipients: recipients.map(s => ({
            name: s.recipientName,
            email: s.recipientEmail,
            phone: s.recipientPhone
          })),
          method,
          batch: true
        }
      });

      if (error) throw error;

      setDeliveryStatuses(prev => prev.map(s => ({
        ...s,
        emailStatus: method !== "sms" && s.recipientEmail ? "sent" : s.emailStatus,
        smsStatus: method !== "email" && s.recipientPhone ? "sent" : s.smsStatus,
        sentAt: new Date().toISOString()
      })));

      toast.success(`Call sheet sent to ${recipients.length} recipients`);
    } catch (err: any) {
      console.error("Batch send error:", err);
      toast.error("Failed to send to some recipients");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="secondary" className="text-xs"><Send className="h-3 w-3 mr-1" />Sent</Badge>;
      case "delivered":
        return <Badge variant="default" className="text-xs bg-blue-500"><Check className="h-3 w-3 mr-1" />Delivered</Badge>;
      case "opened":
        return <Badge variant="default" className="text-xs bg-green-500"><Eye className="h-3 w-3 mr-1" />Opened</Badge>;
      case "bounced":
      case "failed":
        return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredStatuses = deliveryStatuses.filter(s => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return s.emailStatus === "pending" && s.smsStatus === "pending";
    if (filterStatus === "sent") return s.emailStatus === "sent" || s.smsStatus === "sent";
    if (filterStatus === "confirmed") return s.confirmed;
    if (filterStatus === "unconfirmed") return !s.confirmed;
    return true;
  });

  const stats = {
    total: deliveryStatuses.length,
    sent: deliveryStatuses.filter(s => s.emailStatus !== "pending" || s.smsStatus !== "pending").length,
    confirmed: deliveryStatuses.filter(s => s.confirmed).length
  };

  const confirmationRate = stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0;
  const deliveryRate = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-sm text-muted-foreground">Sent</p>
            <Progress value={deliveryRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.confirmed}</div>
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <Progress value={confirmationRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.total - stats.confirmed}</div>
            <p className="text-sm text-muted-foreground">Awaiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base">Distribution</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => sendToAll("email")}
                disabled={sending}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => sendToAll("sms")}
                disabled={sending}
              >
                <Phone className="h-4 w-4 mr-1" />
                SMS All
              </Button>
              <Button 
                size="sm" 
                onClick={() => sendToAll("both")}
                disabled={sending}
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Send All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredStatuses.map(status => (
              <div 
                key={status.recipientId} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-sm">{status.recipientName}</div>
                    <div className="text-xs text-muted-foreground">
                      {status.type === "cast" ? "Cast" : "Crew"}
                      {status.recipientEmail && ` • ${status.recipientEmail}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {getStatusBadge(status.emailStatus)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {getStatusBadge(status.smsStatus)}
                  </div>
                  {status.confirmed ? (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Confirmed
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unconfirmed</Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => sendToRecipient(status, "both")}
                    disabled={sendingTo === status.recipientId}
                  >
                    {sendingTo === status.recipientId ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {filteredStatuses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recipients match the current filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
