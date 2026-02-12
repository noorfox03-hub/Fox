import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const data = await api.getAllUsers();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    const channel = supabase.channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-800">{t('user_management')}</h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">المستخدم</TableHead>
                  <TableHead className="font-bold">الدور</TableHead>
                  <TableHead className="font-bold">التواصل</TableHead>
                  <TableHead className="font-bold">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {users.map((user) => (
                    <TableRow key={user.id} component={motion.tr} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-primary">
                                {user.full_name?.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.user_roles?.[0]?.role === 'driver' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }>
                          {user.user_roles?.[0]?.role === 'driver' ? 'ناقل' : 'تاجر'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                            <p className="flex items-center gap-1 text-slate-500"><Mail size={12}/> {user.email}</p>
                            <p className="flex items-center gap-1 text-slate-500"><Phone size={12}/> {user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
