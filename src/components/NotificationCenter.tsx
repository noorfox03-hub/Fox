import { useState, useEffect } from 'react';
import { Bell, Check, Zap, Info, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getNotifications(userProfile.id);
      setNotifications(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // استماع للإشعارات الجديدة لحظة بلحظة (Real-time)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async () => {
    if (!userProfile?.id) return;
    await api.markNotificationsAsRead(userProfile.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <Popover onOpenChange={(open) => open && unreadCount > 0 && handleMarkAsRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all duration-300">
          <Bell size={22} className={cn("text-slate-600", unreadCount > 0 && "animate-swing")} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-white shadow-lg"
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[380px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white/95 backdrop-blur-xl" align="end">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Zap size={18} className="text-blue-400" />
              </div>
              <h3 className="font-black text-lg tracking-tight">مركز التنبيهات</h3>
            </div>
            {unreadCount > 0 && (
              <Badge variant="outline" className="border-white/20 text-white/80 text-[10px] font-bold px-2 py-0">
                {unreadCount} جديد
              </Badge>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((n, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={n.id} 
                  className={cn(
                    "p-5 hover:bg-slate-50 transition-colors flex gap-4",
                    !n.is_read && "bg-blue-50/30"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    n.title.includes("نجاح") ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {n.title.includes("نجاح") ? <Check size={20} /> : <Info size={20} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-black text-sm text-slate-800 leading-none">{n.title}</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 font-bold pt-1">{new Date(n.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Bell size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">لا توجد تنبيهات جديدة حالياً</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
          <Button variant="ghost" className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
            عرض كافة السجلات
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
