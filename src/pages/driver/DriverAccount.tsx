import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, FileText, Camera, CheckCircle } from 'lucide-react';

export default function DriverAccount() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
  });

  const handleUpload = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file || !userProfile?.id) return;

    setLoading(true);
    try {
      const fileName = `${userProfile.id}/${type}_${Date.now()}.jpg`;
      const url = await api.uploadFile(fileName, file);
      await api.updateProfile(userProfile.id, { [`${type}_url`]: url });
      toast.success("تم رفع الصورة وتحديث الملف!");
    } catch (error) {
      toast.error("فشل رفع الصورة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center"><User size={24}/></div>
                الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="font-bold mr-2">الاسم بالكامل</Label>
                    <Input value={form.full_name} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" readOnly />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold mr-2">رقم الجوال</Label>
                    <Input value={form.phone} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" dir="ltr" readOnly />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FileText className="text-primary"/> توثيق الحساب والوثائق
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { id: 'license', label: 'رخصة القيادة', icon: <FileText/> },
                        { id: 'truck_photo', label: 'صورة الشاحنة', icon: <Camera/> }
                    ].map(doc => (
                        <div key={doc.id} className="relative group">
                            <input type="file" id={doc.id} className="hidden" onChange={(e) => handleUpload(e, doc.id)} disabled={loading} />
                            <label 
                                htmlFor={doc.id}
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                            >
                                {loading ? <Loader2 className="animate-spin text-primary" /> : (
                                    <>
                                        <div className="p-4 bg-slate-100 rounded-2xl text-slate-500 group-hover:text-primary transition-colors">{doc.icon}</div>
                                        <span className="mt-3 font-bold text-slate-700">{doc.label}</span>
                                        <span className="text-[10px] text-slate-400 mt-1">اضغط للرفع (JPG/PNG)</span>
                                    </>
                                )}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
