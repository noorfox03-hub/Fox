import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, UserPlus, X, Trash2, ShieldCheck } from 'lucide-react';

export default function DriverSubDrivers() {
  const { userProfile } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ driver_name: '', driver_phone: '', id_number: '' });

  const fetchDrivers = async () => {
    if (!userProfile?.id) return;
    api.getSubDrivers(userProfile.id).then(setDrivers).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, [userProfile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // تحقق صارم: لا يمكن الإرسال إذا وجد حقل فارغ
    if (!form.driver_name || !form.driver_phone || !form.id_number) {
      toast.error("خطأ: يجب تعبئة (الاسم، الجوال، الهوية) لإضافة السائق");
      return;
    }

    setSubmitting(true);
    try {
      await api.addSubDriver(form, userProfile!.id);
      toast.success("تم إضافة السائق لأسطولك بنجاح");
      setOpen(false);
      setForm({ driver_name: '', driver_phone: '', id_number: '' });
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
           <h1 className="text-2xl font-black italic">Driver Management</h1>
           <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl h-12 bg-blue-600 font-black gap-2 px-6">
                  <Plus size={18} /> إضافة سائق
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                 <DialogHeader className="sr-only"><DialogTitle>Add Driver</DialogTitle><DialogDescription>Form</DialogDescription></DialogHeader>
                 <div className="bg-slate-900 p-8 text-white relative">
                    <UserPlus className="text-blue-500 mb-2" size={32} />
                    <h2 className="text-xl font-black italic">Hire New Driver</h2>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/40"><X size={20}/></Button>
                 </div>
                 <form onSubmit={handleAdd} className="p-8 space-y-5">
                    <div className="space-y-2">
                       <Label className="font-bold mr-1">اسم السائق الكامل</Label>
                       <Input value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" placeholder="إجباري" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold mr-1">رقم الجوال</Label>
                       <Input value={form.driver_phone} onChange={e => setForm({...form, driver_phone: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" dir="ltr" placeholder="إجباري" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold mr-1">رقم الهوية / الإقامة</Label>
                       <Input value={form.id_number} onChange={e => setForm({...form, id_number: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" dir="ltr" placeholder="إجباري" />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-blue-600 font-black text-lg mt-4" disabled={submitting}>
                       {submitting ? <Loader2 className="animate-spin" /> : "إكمال التسجيل"}
                    </Button>
                 </form>
              </DialogContent>
           </Dialog>
        </div>

        {loading ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {drivers.map(d => (
              <Card key={d.id} className="p-6 rounded-[2rem] border-none shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><UserPlus /></div>
                    <div>
                      <p className="font-black text-slate-800">{d.driver_name}</p>
                      <p className="text-xs text-slate-400 font-bold" dir="ltr">{d.driver_phone}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">VERIFIED</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
