// ملف: @/components/DriverNotifications.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';

export default function DriverNotifications() {
  const { t } = useTranslation();
  const [newLoads, setNewLoads] = useState<any[]>([]);

  // استلام الحمولات الجديدة بشكل فوري عبر WebSocket
  useEffect(() => {
    const socket = new WebSocket('wss://your-server.com/ws/loads');
    
    socket.onmessage = (event) => {
      const newLoad = JSON.parse(event.data);
      setNewLoads(prev => [newLoad, ...prev]);
    };

    return () => socket.close();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      {newLoads.length > 0 && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="bg-blue-600 text-white p-4 rounded-lg shadow-lg"
        >
          <p className="font-bold">{t('new_load_available')}</p>
          <button onClick={() => window.open(`/load/${newLoads[0].id}`, '_blank')}>
            {t('view_load')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
