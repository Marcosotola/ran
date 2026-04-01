'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { getUserContactMessages, ContactMessage } from '@/lib/firebase/messages';
import { formatDate } from '@/lib/utils/calculations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function MisConsultasPage() {
  const { ranUser } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ranUser) return;
    getUserContactMessages(ranUser.uid).then(setMessages).finally(() => setLoading(false));
  }, [ranUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-ran-cerulean" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/perfil" className="h-10 w-10 bg-white border rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Consultas</h1>
        </div>

        {messages.length === 0 ? (
          <Card className="p-16 text-center rounded-[32px] border-dashed">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <p className="text-xl font-bold text-slate-400">No has enviado ninguna consulta todavía.</p>
            <Link href="/contacto" className="text-ran-cerulean font-bold mt-2 inline-block hover:underline">
              Envíanos un mensaje ahora
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <Card key={msg.id} className="p-6 rounded-[24px] border-slate-200 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-ran-cerulean/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-ran-cerulean" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {msg.createdAt ? formatDate(msg.createdAt) : '—'}
                      </p>
                      <Badge className={msg.status === 'pending' ? "bg-amber-100 text-amber-700 border-0" : "bg-green-100 text-green-700 border-0"}>
                        {msg.status === 'pending' ? 'En espera de respuesta' : 'Respondido / Leído'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl italic text-slate-600 text-sm">
                  "{msg.message}"
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
