import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState } from "react";

export function NotificationBanner() {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not supported, already subscribed, or dismissed
  if (!isSupported || isSubscribed || dismissed || permission === 'denied') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Enable Push Notifications</h4>
            <p className="text-xs text-slate-400">Get notified when new call sheets are published</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={subscribe}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? "..." : "Enable"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationToggle() {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <BellOff className="w-4 h-4" />
        <span>Notifications not supported</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <BellOff className="w-4 h-4" />
        <span>Notifications blocked</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={isSubscribed ? "outline" : "default"}
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={isSubscribed 
        ? "border-slate-600 text-slate-300 hover:bg-slate-700" 
        : "bg-amber-600 hover:bg-amber-700 text-white"
      }
    >
      {loading ? (
        "..."
      ) : isSubscribed ? (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Disable Notifications
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}
