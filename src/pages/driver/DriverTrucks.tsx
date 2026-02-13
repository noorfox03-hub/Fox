import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Truck as TruckIcon, ShieldCheck, Gauge, Calendar, Hash, X } from 'lucide-react';
import { Truck } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverTrucks() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // الحالة الأولية للنموذج (مطابق لصفوف قاعدة البيانات)
  const [form, setForm] = useState({ 
    plate_number: '', 
    brand: '', 
    model_year: '', 
    truck_type: 'trella' as any, 
    capacity: '' 
  });

  // جلب الشاحنات من السيرفر
  const fetchTrucks = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .eq('owner_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTrucks(data as Truck[] || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchTrucks();
    // تحديث لحظي لو ضفت شاحنة من مكان تاني
    const channel = supabase.channel('trucks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, fetchTrucks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTrucks]);

  // إضافة شاحنة جديدة
  const handleAdd = async () => {
    if (!userProfile?.id) return;
    if (!form.plate_number) {
      toast.error("الرجاء إدخال رقم اللوحة");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('trucks').insert([{
        owner_id: userProfile.id,
        plate_number: form.plate_number,
        brand: form.brand,
        model_year: form.model_year,
        truck_type: form.truck_type,
        capacity: form.capacity
      }]);

      if (error) throw error;

      toast.success("تم تسجيل الشاحنة في الأسطول بنجاح");
      setDialogOpen(false);
      setForm({ plate_number: '', brand: '', model_year: '', truck_type: 'trella', capacity: '' });
      fetchTrucks();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإضافة");
    } finally {
      setSubmitting(false);
    }
  };

  // حذف شاحنة
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('trucks').delete().eq('id', id);
      if (error) throw error;
      toast.success("تم إزالة الشاحنة من النظام");
      fetchTrucks();
    } catch (err: any) {
      toast.error("لا يمكن حذف الشاحنة حالياً");
    }
  };

  // أنواع الشاحنات المعتمدة في الـ Enum
  const truckTypes = [
    { value: 'trella', label: 'تريلا (Trella)' },
    { value: 'lorry', label: 'لوري (Lorry)' },
    { value: 'dyna', label: 'دينا (Dyna)' },
    { value: 'pickup', label: 'بيك أب (Pickup)' },
    { value: 'refrigerated', label: 'مبردة (Refrigerated)' },
    { value: 'tanker', label: 'صهريج (Tanker)' },
    { value: 'flatbed', label: 'سطحة (Flatbed)' },
    { value: 'container', label: 'حاوية (Container)' }
  ];

  return (
    <AppLayout>
      <div className="space-y-8 pb-20">
        
        {/* Header القسم */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Fleet Management</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">إدارة أسطول النقل الخاص بك</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setOpen => {
              setDialogOpen(setOpen);
              if(!setOpen) setForm({ plate_number: '', brand: '', model_year: '', truck_type: 'trella', capacity: '' });
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black shadow-xl shadow-blue-500/20 gap-2">
                <Plus size={20} /> إضافة شاحنة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl">
              <div className="bg-slate-900 p-8 text-white relative">
                 <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                    <TruckIcon size={28} />
                 </div>
                 <h2 className="text-2xl font-black italic">Register New Asset</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">إضافة شاحنة جديدة للنظام</p>
                 <Button variant="ghost" onClick={() => setDialogOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white rounded-full"><X size={20}/></Button>
              </div>
              
              <div className="p-8 space-y-5 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black text-slate-700 text-xs uppercase mr-2">رقم اللوحة</Label>
                    <Input placeholder="1234 ABC" value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-slate-700 text-xs uppercase mr-2">نوع الشاحنة</Label>
                    <Select value={form.truck_type} onValueChange={v => setForm({...form, truck_type: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">
                        {truckTypes.map(tt => <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black text-slate-700 text-xs uppercase mr-2">الماركة</Label>
                    <Input placeholder="مرسيدس، مان.." value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-slate-700 text-xs uppercase mr-2">سنة الموديل</Label>
                    <Input type="number" placeholder="2024" value={form.model_year} onChange={e => setForm({...form, model_year: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-slate-700 text-xs uppercase mr-2">الحمولة القصوى (طن)</Label>
                  <Input type="number" placeholder="مثال: 25" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" dir="ltr" />
                </div>

                <Button onClick={handleAdd} disabled={submitting} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 mt-4 transition-all active:scale-95">
                  {submitting ? <Loader2 className="animate-spin" /> : "إكمال التسجيل وتفعيل الشاحنة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* قائمة الشاحنات */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : trucks.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-white/50 border-slate-200">
              <TruckIcon size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 font-black text-xl">لا توجد شاحنات مسجلة</p>
              <p className="text-slate-400 text-sm font-medium mt-1">قم بإضافة أول شاحنة لتبدأ في استقبال طلبات النقل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {trucks.map((truck, idx) => (
                <motion.div key={truck.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white group">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                <TruckIcon size={32} />
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => handleDelete(truck.id)}>
                                <Trash2 size={20} />
                            </Button>
                        </div>

                        <div className="space-y-1 mb-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{truck.plate_number}</h3>
                                <ShieldCheck size={18} className="text-emerald-500" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{truck.brand || 'Asset Active'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                                <Calendar size={14} className="text-slate-300 mb-1" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">الموديل</p>
                                <p className="text-sm font-black text-slate-700">{truck.model_year || '---'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                                <Gauge size={14} className="text-slate-300 mb-1" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">السعة</p>
                                <p className="text-sm font-black text-slate-700">{truck.capacity} طن</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                             <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase">
                                {truck.truck_type}
                             </Badge>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Verified Device</span>
                        </div>
                    </CardContent>
                    </Card>
                </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
