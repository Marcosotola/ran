'use client';

import { useEffect, useState } from 'react';
import { getContactMessages, markMessageAsRead, ContactMessage } from '@/lib/firebase/messages';
import { formatDate } from '@/lib/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, 
  Mail, 
  User, 
  Calendar, 
  CheckCircle2, 
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'read'>('all');

  const loadMessages = async () => {
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch (err) {
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markMessageAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
      toast.success('Mensaje marcado como leído');
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
  };

  const filtered = messages.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="h-10 w-10 text-ran-cerulean" /> Mensajes de Contacto
          </h1>
          <p className="text-slate-500 font-medium italic">Consultas recibidas desde el sitio web</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, email o mensaje..." 
            className="pl-10 h-12 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('all')}
            className="rounded-xl h-12"
          >
            Todos
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? 'default' : 'outline'} 
            onClick={() => setStatusFilter('pending')}
            className="rounded-xl h-12 text-amber-600 border-amber-200"
          >
            Pendientes
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-ran-cerulean" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-20 text-center rounded-3xl border-dashed">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-10" />
          <p className="text-lg font-medium text-slate-400">No se encontraron mensajes</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map(msg => (
            <Card key={msg.id} className={`p-6 rounded-3xl border transition-all ${msg.status === 'pending' ? 'border-l-4 border-l-amber-500 shadow-md ring-1 ring-amber-100' : 'opacity-80'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-ran-navy/5 flex items-center justify-center">
                    <User className="h-6 w-6 text-ran-navy" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-none">{msg.name} {msg.lastName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" /> {msg.email}
                    </p>
                  </div>
                </div>
                <Badge className={msg.status === 'pending' ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-0" : "bg-green-100 text-green-700 hover:bg-green-200 border-0"}>
                  {msg.status === 'pending' ? 'Pendiente' : 'Leído'}
                </Badge>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl mb-4 italic text-slate-700 text-sm leading-relaxed border border-slate-100">
                "{msg.message}"
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  <Calendar className="h-3.5 w-3.5" />
                  {msg.createdAt ? formatDate(msg.createdAt) : '—'}
                </div>
                
                {msg.status === 'pending' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleMarkAsRead(msg.id!)}
                    className="rounded-xl h-10 px-4 ran-gradient text-white border-0 font-bold text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar leído
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
