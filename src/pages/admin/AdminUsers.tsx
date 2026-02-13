import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, User, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // دالة جلب البيانات مع حماية من الفشل
  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getAllUsers();
      if (data) setUsers(data);
    } catch (err) {
      console.error("فشل في جلب المستخدمين:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // استماع للتغييرات بدون إعادة تحميل الصفحة بالكامل (تحسين الأداء)
    const channel = supabase.channel('admin_users_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers(); // تحديث اللستة فقط عند حدوث تغيير حقيقي
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  // فلاتر البحث لسرعة الوصول
  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">إدارة الكوادر</h2>
            <div className="relative w-full md:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                    placeholder="بحث باسم المستخدم..." 
                    className="pr-10 rounded-2xl border-slate-200 focus:ring-blue-500 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-right font-black text-slate-500 py-5">المستخدم</TableHead>
                <TableHead className="text-right font-black text-slate-500">الصلاحية</TableHead>
                <TableHead className="text-right font-black text-slate-500">التواصل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton Loading (أفضل بكتير من لودر واحد بيخنق)
                [1,2,3,4,5].map(i => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-10 bg-slate-100 rounded-xl w-32"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-50 rounded-lg w-20"></div></TableCell>
                    <TableCell><div className="h-6 bg-slate-50 rounded-lg w-40"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  // حماية: التأكد من الدور حتى لو مش موجود في الداتا
                  const role = user.user_roles?.[0]?.role || 'shipper';
                  return (
                    <TableRow key={user.id} className="border-slate-50 hover:bg-blue-50/30 transition-all group">
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {user.full_name?.[0] || 'U'}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 leading-none mb-1">{user.full_name || 'مستخدم جديد'}</p>
                                <p className="text-[10px] text-slate-400 font-bold">ID: {user.id?.slice(0,8)}</p>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                            "rounded-lg font-black text-[10px] uppercase px-3 py-1",
                            role === 'admin' ? 'bg-rose-500' : role === 'driver' ? 'bg-blue-500' : 'bg-emerald-500'
                        )}>
                          {role === 'admin' ? 'مدير' : role === 'driver' ? 'ناقل' : 'تاجر'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] font-bold text-slate-500 space-y-1">
                            <div className="flex items-center gap-2"><Mail size={12} className="text-slate-300"/> {user.email || 'N/A'}</div>
                            <div className="flex items-center gap-2"><Phone size={12} className="text-slate-300"/> {user.phone || '---'}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center text-slate-400 font-bold italic">لا يوجد نتائج تطابق بحثك</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...inputs: any) { return inputs.filter(Boolean).join(' '); }
