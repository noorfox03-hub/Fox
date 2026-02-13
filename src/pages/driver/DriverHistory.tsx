import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, MapPin, Trash2, AlertTriangle, CheckCircle, Download, 
  Calendar, Scale, DollarSign, Filter, Map, FileText, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RangeCalendar } from "@/components/ui/range-calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// تعريف أنواع البيانات بشكل كامل
interface Load {
  id: string;
  origin: string;
  destination: string;
  weight: string;
  price: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  load_type?: string;
  documents?: string[];
  notes?: string;
  origin_coords?: { lat: number; lng: number };
  destination_coords?: { lat: number; lng: number };
}

interface FilterOptions {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minWeight?: string;
  maxWeight?: string;
  minPrice?: string;
  maxPrice?: string;
  loadType?: string;
}

export default function DriverHistory() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertLoadId, setAlertLoadId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | 'print'>('pdf');

  // جلب بيانات الشحنات
  const fetchMyLoads = async () => {
    if (!userProfile?.id) return;
    try {
      setLoading(true);
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
      setFilteredLoads(data || []);
    } catch (error) {
      console.error("حدث خطأ أثناء جلب الشحنات:", error);
      toast.error(t('load_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  // تطبيق الفلترة
  const applyFilters = () => {
    let result = [...loads];
    
    if (filterOptions.status) {
      result = result.filter(load => load.status === filterOptions.status);
    }
    
    if (filterOptions.startDate && filterOptions.endDate) {
      result = result.filter(load => {
        const loadDate = new Date(load.created_at);
        return loadDate >= filterOptions.startDate && loadDate <= filterOptions.endDate;
      });
    }
    
    if (filterOptions.minWeight) {
      result = result.filter(load => parseFloat(load.weight) >= parseFloat(filterOptions.minWeight));
    }
    
    if (filterOptions.maxWeight) {
      result = result.filter(load => parseFloat(load.weight) <= parseFloat(filterOptions.maxWeight));
    }
    
    if (filterOptions.minPrice) {
      result = result.filter(load => parseFloat(load.price) >= parseFloat(filterOptions.minPrice));
    }
    
    if (filterOptions.maxPrice) {
      result = result.filter(load => parseFloat(load.price) <= parseFloat(filterOptions.maxPrice));
    }
    
    if (filterOptions.loadType) {
      result = result.filter(load => load.load_type === filterOptions.loadType);
    }
    
    setFilteredLoads(result);
  };

  // إعادة تعيين الفلترة
  const resetFilters = () => {
    setFilterOptions({});
    setFilteredLoads([...loads]);
  };

  // تصدير البيانات
  const exportData = async () => {
    if (exportType === 'pdf') {
      const doc = new jsPDF();
      doc.text(t('my_loads_history'), 14, 16);
      
      const tableColumns = [
        t('load_id'),
        t('origin'),
        t('destination'),
        t('weight'),
        t('price'),
        t('status'),
        t('date')
      ];
      
      const tableData = filteredLoads.map(load => [
        load.id.slice(0, 8),
        load.origin,
        load.destination,
        load.weight,
        load.price,
        t(load.status),
        new Date(load.created_at).toLocaleDateString('ar-EG')
      ]);
      
      autoTable(doc, {
        head: [tableColumns],
        body: tableData,
        startY: 20
      });
      
      doc.save(`${t('my_loads')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } else if (exportType === 'excel') {
      const headers = [
        t('load_id'),
        t('origin'),
        t('destination'),
        t('weight'),
        t('price'),
        t('status'),
        t('date')
      ].join('\t');
      
      const rows = filteredLoads.map(load => [
        load.id,
        load.origin,
        load.destination,
        load.weight,
        load.price,
        t(load.status),
        new Date(load.created_at).toLocaleDateString('ar-EG')
      ].join('\t')).join('\n');
      
      const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${t('my_loads')}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportType === 'print') {
      window.print();
    }
    
    setShowExportDialog(false);
  };

  // تحميل وثائق الشحنة
  const downloadDocument = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تهيئة البيانات عند تحميل المكون
  useEffect(() => {
    fetchMyLoads();

    // تحديث تلقائي كل 5 دقائق
    const interval = setInterval(fetchMyLoads, 300000);
    
    // إعداد الإشعارات المدفوعة
    if (userProfile?.id) {
      const channel = supabase
        .channel(`driver-${userProfile.id}-notifications`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'loads', filter: `driver_id=eq.${userProfile.id}` }, 
          () => {
            fetchMyLoads();
            toast.info(t('loads_updated_notification'));
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
    
    return () => clearInterval(interval);
  }, [userProfile]);

  // تطبيق الفلترة عند تغيير الخيارات
  useEffect(() => {
    applyFilters();
  }, [filterOptions, loads]);

  // حالة عدم وجود مستخدم
  if (!userProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">{t('profile_not_found')}</h3>
          <p className="text-muted-foreground mb-4">{t('please_login')}</p>
        </div>
      </AppLayout>
    );
  }

  // بيانات للتقرير البياني
  const chartData = [
    { name: t('january'), completed: filteredLoads.filter(l => l.status === 'completed' && new Date(l.created_at).getMonth() === 0).length },
    { name: t('february'), completed: filteredLoads.filter(l => l.status === 'completed' && new Date(l.created_at).getMonth() === 1).length },
    { name: t('march'), completed: filteredLoads.filter(l => l.status === 'completed' && new Date(l.created_at).getMonth() === 2).length },
    { name: t('april'), completed: filteredLoads.filter(l => l.status === 'completed' && new Date(l.created_at).getMonth() === 3).length },
    { name: t('may'), completed: filteredLoads.filter(l => l.status === 'completed' && new Date(l.created_at).getMonth() === 4).length },
    { name: t('june'), completed: filteredLoads.filter(l => l.status === 'completed' && new Date(l.created_at).getMonth() === 5).length },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* عنوان الصفحة والتحكم */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold">{t('my_loads_history')}</h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter size={18} /> {t('filters')}
            </Button>
            
            <Button variant="ghost" onClick={() => setShowExportDialog(true)} className="flex items-center gap-2">
              <Download size={18} /> {t('export')}
            </Button>
            
            <Button variant="ghost" onClick={() => fetchMyLoads()} className="flex items-center gap-2">
              <Loader2 size={18} /> {t('refresh')}
            </Button>
          </div>
        </div>

        {/* قسم الفلترة */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">{t('filter_options')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select 
                    value={filterOptions.status} 
                    onValueChange={(value) => setFilterOptions({...filterOptions, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('all_statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_statuses')}</SelectItem>
                      <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('date_range')}</Label>
                  <RangeCalendar
                    mode="range"
                    onValueChange={(value) => setFilterOptions({
                      ...filterOptions,
                      startDate: value?.[0],
                      endDate: value?.[1]
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('load_type')}</Label>
                  <Select 
                    value={filterOptions.loadType} 
                    onValueChange={(value) => setFilterOptions({...filterOptions, loadType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('all_types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_types')}</SelectItem>
                      <SelectItem value="general">{t('general_cargo')}</SelectItem>
                      <SelectItem value="refrigerated">{t('refrigerated')}</SelectItem>
                      <SelectItem value="heavy">{t('heavy')}</SelectItem>
                      <SelectItem value="dangerous">{t('dangerous')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('weight_range')} (طن)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder={t('min')} 
                      value={filterOptions.minWeight}
                      onChange={(e) => setFilterOptions({...filterOptions, minWeight: e.target.value})}
                    />
                    <Input 
                      type="number" 
                      placeholder={t('max')} 
                      value={filterOptions.maxWeight}
                      onChange={(e) => setFilterOptions({...filterOptions, maxWeight: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('price_range')} (ر.س)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder={t('min')} 
                      value={filterOptions.minPrice}
                      onChange={(e) => setFilterOptions({...filterOptions, minPrice: e.target.value})}
                    />
                    <Input 
                      type="number" 
                      placeholder={t('max')} 
                      value={filterOptions.maxPrice}
                      onChange={(e) => setFilterOptions({...filterOptions, maxPrice: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={applyFilters}>{t('apply_filters')}</Button>
                <Button variant="ghost" onClick={resetFilters}>{t('reset_filters')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* تقرير بياني للشحنات */}
        {filteredLoads.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">{t('loads_report')}</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                   
