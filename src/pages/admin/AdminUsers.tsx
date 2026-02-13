import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const data = await api.getAllUsers();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // التحديث الفوري الشامل
    const channel = supabase.channel('admin-realtime-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">إدارة الكوادر والمستخدمين</h2>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">بث مباشر للنظام</Badge>
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[250px] text-right font-black text-slate-500 py-6">المستخدم</TableHead>
                <TableHead className="text-right font-black text-slate-500">الصلاحية</TableHead>
                <TableHead className="text-right font-black text-slate-500">بيانات التواصل</TableHead>
                <TableHead className="text-right font-black text-slate-500">تاريخ الانضمام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-60 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></TableCell></TableRow>
              ) : (
                <AnimatePresence>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 flex items-center justify-center font-black text-blue-600 border border-slate-200">
                                {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="font-black text-slate-800">{user.full_name || 'مستخدم غير معرف'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tabular-nums">ID: {user.id.slice(0, 8)}</p>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "rounded-xl font-black px-4 py-1",
                          user.user_roles?.[0]?.role === 'admin' ? 'bg-rose-500' : 
                          user.user_roles?.[0]?.role === 'driver' ? 'bg-blue-500' : 'bg-emerald-500'
                        )}>
                          {user.user_roles?.[0]?.role === 'admin' ? 'مدير' : user.user_roles?.[0]?.role === 'driver' ? 'ناقل' : 'تاجر'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Mail size={14} className="text-slate-300"/> {user.email}</div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Phone size={14} className="text-slate-300"/> {user.phone || 'بدون هاتف'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-black text-slate-400 tabular-nums">
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...inputs: any) { return inputs.filter(Boolean).join(' '); }
