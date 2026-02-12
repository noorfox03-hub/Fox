// src/pages/admin/AdminUsers.tsx

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types';

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllUsers().then(data => setUsers(data as UserProfile[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t('user_management')}</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="rounded-xl border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('full_name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>{t('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  // استخراج الدور من المصفوفة
                  const userRole = user.user_roles && user.user_roles.length > 0 ? user.user_roles[0].role : 'unknown';
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell dir="ltr">{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          userRole === 'driver' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          userRole === 'shipper' ? 'bg-green-50 text-green-700 border-green-200' :
                          userRole === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                        }>
                          {userRole === 'driver' ? t('driver') : 
                           userRole === 'shipper' ? t('shipper') : 
                           userRole === 'admin' ? t('admin') : userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('ar')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
