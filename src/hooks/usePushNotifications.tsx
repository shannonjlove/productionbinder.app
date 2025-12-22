import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true
  });

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false, loading: false }));
        return;
      }

      const permission = Notification.permission;
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = registration ? await registration.pushManager.getSubscription() : null;
        
        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission,
          loading: false
        });
      } catch (error) {
        console.error('Error checking push subscription:', error);
        setState(prev => ({ ...prev, isSupported, permission, loading: false }));
      }
    };

    checkSupport();
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  }, []);

  const subscribe = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission, loading: false }));
        toast.error('Notification permission denied');
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(
        // This is a placeholder VAPID key - in production, generate your own
        'BNbxGYNMhEIi9zrneh7mqV4oUanjLUK3m8X8IV6RhZDEQlWpEr0HfNQk_YnBNEwwjSgFQSwj6KRMdrTBTKYdACc'
      );
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      // Store subscription in database for later use
      console.log('Push subscription:', JSON.stringify(subscription));
      
      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        permission: 'granted',
        loading: false 
      }));
      
      toast.success('Push notifications enabled!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setState(prev => ({ ...prev, isSubscribed: false, loading: false }));
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast.error('Failed to disable notifications');
      return false;
    }
  }, []);

  const showLocalNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
        return true;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
    return false;
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    showLocalNotification
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
