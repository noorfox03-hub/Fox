import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, AlertCircle } from 'lucide-react';

// تعريف أنواع البيانات
interface UserFormData {
  full_name: string;
  phone: string;
  email: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  // يمكن إضافة حقول أخرى حسب الحاجة
}

export default function ShipperAccount() {
  const { t } = useTranslation();
  const { userProfile, updateUserProfile } = useAuth(); // افترض أن هناك دالة لتحديث الملف الشخصي المحلي
  const [form, setForm] = useState<UserFormData>({
    full_name: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailEditable, setIsEmailEditable] = useState(true);

  // تحميل بيانات المستخدم عند تحميل المكون
  useEffect(() => {
    if (!userProfile) {
      toast.error(t('profile_not_found'));
      return;
    }

    setForm({
      full_name: userProfile.full_name || '',
      phone: userProfile.phone || '',
      email: userProfile.email || '',
    });

    // التحقق مما إذا كان البريد الإلكتروني قابل للتعديل (مثال: من إعدادات النظام)
    const checkEmailEditability = async () => {
      try {
        const settings = await api.getProfileSettings();
        setIsEmailEditable(settings.allow_email_edit || false);
      } catch (err) {
        setIsEmailEditable(false);
      }
    };
    checkEmailEditability();
  }, [userProfile, t]);

  // فحص صلاحيات المدخلات
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = t('required_field', { field: t('full_name') });
    } else if (form.full_name.length < 3) {
      newErrors.full_name = t('min_length', { field: t('full_name'), length: 3 });
    }

    if (!form.phone.trim()) {
      newErrors.phone = t('required_field', { field: t('phone') });
    } else if (!/^\+?[0-9\s\-()]{8,15}$/.test(form.phone)) {
      newErrors.phone = t('invalid_phone');
    }

    if (!form.email.trim()) {
      newErrors.email = t('required_field', { field: t('email') });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('invalid_email');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userProfile?.id) {
      toast.error(t('profile_not_found'));
      return;
    }

    // التحقق من صحة المدخلات
    if (!validateForm()) {
      toast.warning(t('check_form_errors'));
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await api.updateProfile(userProfile.id, form);
      toast.success(t('profile_updated_successfully'));
      
      // تحديث البيانات المحلية في useAuth
      if (updateUserProfile) {
        updateUserProfile(updatedProfile as UserProfile);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      // عرض رسالة خطأ مترجمة أو مبسطة
      const errorMsg = err.message || t('update_failed');
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // حالة عدم وجود مستخدم
  if (!userProfile) {
    return (
      <AppLayout>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} /> {t('profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg">
              <AlertCircle size={18} className="text-amber-500" />
              <p className="text-amber-700">{t('profile_not_found')}</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} /> {t('profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* حقل الاسم الكامل */}
          <div>
            <Label htmlFor="full_name">{t('full_name')}</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={e => setForm(p => ({...p, full_name: e.target.value}))}
              className={`mt-1 ${errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={saving}
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>

          {/* حقل البريد الإلكتروني */}
          <div>
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              value={form.email}
              onChange={e => setForm(p => ({...p, email: e.target.value}))}
              className={`mt-1 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              dir="ltr"
              disabled={saving || !isEmailEditable}
            />
            {isEmailEditable ? (
              errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            ) : (
              <p className="text-slate-500 text-xs mt-1">{t('email_not_editable')}</p>
            )}
          </div>

          {/* حقل الرقم الهاتفي */}
          <div>
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={e => setForm(p => ({...p, phone: e.target.value}))}
              className={`mt-1 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              dir="ltr"
              disabled={saving}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
