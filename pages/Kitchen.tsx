
import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, CheckCircle, AlertCircle, RefreshCw, 
  ChevronRight, Timer, Utensils
} from 'lucide-react';
import { db } from '../services/db';
import { Order, OrderItem, Table } from '../types';

export const KitchenPage: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    refreshData();
    const dataInterval = setInterval(refreshData, 10000); // Refresh data cada 10s
    const timeInterval = setInterval(() => setNow(Date.now()), 1000); // Update cronómetro cada segundo
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, [tenantId]);

  const refreshData = () => {
    const orders = db.query<Order>('orders', tenantId)
      .filter(o => o.status === 'OPEN' && o.items.some(i => i.status === 'PREPARING' || i.status === 'READY'));
    
    const tablesData = db.query<Table>('tables', tenantId);
    
    setActiveOrders(orders);
    setTables(tablesData);
  };

  const handleMarkAsReady = (orderId: string, productId: string) => {
    db.updateOrderItemStatus(orderId, productId, 'READY', tenantId);
    refreshData();
  };

  const getTimeElapsed = (sentAt?: string) => {
    if (!sentAt) return '0s';
    const diff = now - new Date(sentAt).getTime();
    const totalSeconds = Math.floor(diff / 1000);
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-lg">
            <ChefHat size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-100 italic tracking-tight">Pantalla de Cocina</h2>
            <p className="text-slate-500 text-sm font-medium">Pedidos pendientes de preparación</p>
          </div>
        </div>
        <button 
          onClick={() => { setLoading(true); refreshData(); setTimeout(() => setLoading(false), 500); }}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:rotate-180 duration-500"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 text-slate-700">
            <Utensils size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-400">Sin pedidos activos</h3>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">Cuando los mozos envíen pedidos a cocina, aparecerán aquí automáticamente.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeOrders.map(order => {
            const table = tables.find(t => t.id === order.tableId);
            const itemsToPrepare = order.items.filter(i => i.status === 'PREPARING');
            const readyItems = order.items.filter(i => i.status === 'READY');
            
            if (itemsToPrepare.length === 0 && readyItems.length === 0) return null;

            // Encontrar el item que lleva más tiempo esperando
            const validSentAts = itemsToPrepare.map(i => i.sentAt).filter(Boolean) as string[];
            const oldestSentAt = validSentAts.length > 0 
                ? validSentAts.reduce((oldest, current) => 
                    new Date(current) < new Date(oldest) ? current : oldest
                  )
                : undefined;

            return (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <div className={`p-6 border-b border-slate-800 flex justify-between items-center ${itemsToPrepare.length > 0 ? 'bg-slate-800/50' : 'bg-emerald-500/5'}`}>
                  <div>
                    <h4 className="text-2xl font-black text-slate-100 italic tracking-tighter">MESA {table?.number}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{table?.zone}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    {itemsToPrepare.length > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
                        <Timer size={14} className="animate-pulse" />
                        {getTimeElapsed(oldestSentAt)}
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-4">
                  {itemsToPrepare.length > 0 && (
                    <div className="space-y-3">
                       <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Circle size={6} fill="currentColor" /> Pendiente de Preparación
                       </p>
                       {itemsToPrepare.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-start group">
                            <div className="flex gap-3">
                               <span className="w-8 h-8 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-lg font-black text-lg">{item.quantity}</span>
                               <div className="flex flex-col">
                                 <span className="text-slate-100 font-bold leading-tight text-lg">{item.name}</span>
                                 <span className="text-[10px] text-slate-500 font-medium">{getTimeElapsed(item.sentAt)}</span>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleMarkAsReady(order.id, item.productId)}
                              className="w-10 h-10 bg-slate-800 hover:bg-emerald-600 text-slate-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                            >
                              <CheckCircle size={20} />
                            </button>
                         </div>
                       ))}
                    </div>
                  )}

                  {readyItems.length > 0 && (
                    <div className={`space-y-3 pt-4 ${itemsToPrepare.length > 0 ? 'border-t border-slate-800/50' : ''}`}>
                       <p className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <CheckCircle size={10} /> Listos para retirar
                       </p>
                       {readyItems.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center opacity-60">
                            <div className="flex gap-3 items-center">
                               <span className="text-slate-300 font-bold italic line-through">{item.quantity}x {item.name}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-800/20 border-t border-slate-800 flex justify-center">
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">ID: {order.id.slice(-6)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Circle = ({ size, fill, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);
