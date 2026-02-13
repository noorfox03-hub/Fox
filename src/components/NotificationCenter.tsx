import { useState, useEffect } from 'react';
import { Bell, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function NotificationCenter() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;
    api.getNotifications(userProfile.id).then(setNotifications).finally(() => setLoading(false));
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-100">
          <Bell size={20} className="text-slate-500" />
          {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white" align="end">
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center font-black">
            <span>التنبيهات</span>
            <Zap size={16} className="text-blue-400" />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-4 text-center text-slate-400 text-sm font-bold">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : notifications.length > 0 ? "إشعاراتك هنا" : "لا توجد تنبيهات"}
        </div>
      </PopoverContent>
    </Popover>
  );
}
