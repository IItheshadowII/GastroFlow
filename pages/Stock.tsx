import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  AlertCircle, 
  History, 
  Plus, 
  Minus,
  Edit3,
  Check,
  X,
  Filter,
  Loader2,
  Trash2,
  PlusCircle,
  Image as ImageIcon,
  Hash
} from 'lucide-react';
import { db } from '../services/db';
import { Product, Category, AuditLog, User } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

interface StockAdjustmentModalProps {
  product: Product;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ product, user, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('Compra de mercadería');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === 0) return;
    setLoading(true);
    
    setTimeout(() => {
      db.adjustStock(product.id, product.tenantId, user.id, amount, reason);
      setLoading(false);
      onSuccess();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100">Ajustar Stock</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-mono">
               {product.sku ? <span className="text-[10px] font-black uppercase">#{product.sku.slice(0,3)}</span> : <Package size={24} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">{product.name}</p>
              <p className="text-xs text-slate-500">Actual: {product.stockQuantity} unidades</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Cantidad a ajustar</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setAmount(prev => prev - 1)} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-red-400 transition-all active:scale-90"><Minus size={20} /></button>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-3 text-center text-xl font-bold text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
              <button type="button" onClick={() => setAmount(prev => prev + 1)} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center text-emerald-400 transition-all active:scale-90"><Plus size={20} /></button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Motivo</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
            >
              <option value="Compra de mercadería">Compra de mercadería</option>
              <option value="Merma / Desperdicio">Merma / Desperdicio</option>
              <option value="Consumo interno">Consumo interno</option>
              <option value="Error de inventario">Error de inventario</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-slate-100 font-bold transition-colors">Cancelar</button>
            <button type="submit" disabled={loading || amount === 0} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black transition-all shadow-lg flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />} Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StockPage: React.FC<{ tenantId: string, user: User }> = ({ tenantId, user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, [tenantId]);

  const refreshData = () => {
    const prods = db.query<Product>('products', tenantId).filter(p => p.stockEnabled);
    const cats = db.query<Category>('categories', tenantId);
    const activityLogs = db.query<AuditLog>('audit_logs', tenantId)
      .filter(l => l.action === 'STOCK_ADJUST')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setProducts(prods);
    setCategories(cats);
    setLogs(activityLogs);
  };

  const handleDeleteProduct = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar este item del inventario?')) {
      try {
        db.removeProduct(id, tenantId);
        refreshData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const productData: Product = {
      id: `p-${Date.now()}`,
      tenantId,
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      categoryId: formData.get('categoryId') as string,
      price: Number(formData.get('price')),
      stockEnabled: true,
      stockQuantity: Number(formData.get('stockQuantity') || 0),
      stockMin: Number(formData.get('stockMin') || 5),
      isActive: true,
    };

    db.insert<Product>('products', productData);

    setTimeout(() => {
      refreshData();
      setIsNewItemModalOpen(false);
      setLoading(false);
    }, 400);
  };

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
    const isLow = p.stockQuantity <= p.stockMin && p.stockQuantity > 0;
    const isOut = p.stockQuantity <= 0;
    
    if (filter === 'low') return matchesSearch && isLow;
    if (filter === 'out') return matchesSearch && isOut;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg"><Package size={24} /></div>
          <div><p className="text-slate-500 text-xs font-black uppercase tracking-widest">Total Items</p><h4 className="text-2xl font-black text-slate-100">{products.length}</h4></div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg"><AlertCircle size={24} /></div>
          <div><p className="text-amber-500 text-xs font-black uppercase tracking-widest">Stock Crítico</p><h4 className="text-2xl font-black text-amber-500">{products.filter(p => p.stockQuantity <= p.stockMin && p.stockQuantity > 0).length}</h4></div>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shadow-lg"><ArrowDownRight size={24} /></div>
          <div><p className="text-red-500 text-xs font-black uppercase tracking-widest">Sin Stock</p><h4 className="text-2xl font-black text-red-500">{products.filter(p => p.stockQuantity <= 0).length}</h4></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o ID/SKU..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                <button onClick={() => setFilter('all')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-slate-800 text-slate-100 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Todos</button>
                <button onClick={() => setFilter('low')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'low' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>Crítico</button>
                <button onClick={() => setFilter('out')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'out' ? 'bg-red-500/10 text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>Agotado</button>
              </div>
              <button onClick={() => setIsNewItemModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"><Plus size={18} /><span className="hidden sm:inline">Nuevo Item</span></button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/20 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-5">Código / Item</th>
                  <th className="px-6 py-5">Existencia</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 font-mono text-[10px] font-black text-blue-400">
                           {product.sku ? product.sku.slice(-4) : '---'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 mb-0.5">{product.name}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {categories.find(c => c.id === product.categoryId)?.name || 'Sin Categoría'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 font-black text-lg">
                        <span className={product.stockQuantity <= 0 ? 'text-red-500' : product.stockQuantity <= product.stockMin ? 'text-amber-500' : 'text-slate-200'}>
                          {product.stockQuantity}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase">unid.</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {product.stockQuantity <= 0 ? (
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-lg border border-red-500/20 tracking-widest">Agotado</span>
                      ) : product.stockQuantity <= product.stockMin ? (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-500/20 tracking-widest">Crítico</span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20 tracking-widest">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedProduct(product)} className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg active:scale-90"><Edit3 size={18} /></button>
                        <button onClick={(e) => handleDeleteProduct(e, product.id)} className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg active:scale-90"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-7 shadow-2xl sticky top-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 rounded-lg"><History className="text-blue-400" size={20} /></div>
                <h5 className="font-bold text-slate-100 text-lg">Actividad</h5>
              </div>
            </div>
            
            <div className="space-y-6">
              {logs.slice(0, 6).map(log => {
                const prod = products.find(p => p.id === log.entityId);
                const isPositive = log.after.stock > log.before.stock;
                return (
                  <div key={log.id} className="relative pl-7 border-l-2 border-slate-800 pb-4 last:pb-0">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-slate-950 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-start"><span className="text-sm font-bold text-slate-200 line-clamp-1">{prod?.name || 'Item Eliminado'}</span><div className={`text-[10px] font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{isPositive ? '+' : '-'}{Math.abs(log.after.stock - log.before.stock)}</div></div>
                      <p className="text-[11px] text-slate-500 italic bg-slate-800/30 p-2 rounded-lg">"{log.after.reason}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <StockAdjustmentModal 
          product={selectedProduct} 
          user={user}
          onClose={() => setSelectedProduct(null)}
          onSuccess={refreshData}
        />
      )}

      <Modal isOpen={isNewItemModalOpen} onClose={() => setIsNewItemModalOpen(false)} title="Agregar Item al Inventario">
        <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Código / SKU</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input name="sku" className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-10 pr-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono" placeholder="ID-001" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
              <input name="name" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="Ej: Insumo X" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
              <select name="categoryId" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 appearance-none"><option value="">Seleccionar...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Existencia</label><input name="stockQuantity" type="number" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100" placeholder="0" /></div>
            <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mínimo</label><input name="stockMin" type="number" defaultValue={5} className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100" /></div>
          </div>
          <div className="pt-6 border-t border-slate-800 flex justify-end gap-3"><button type="button" onClick={() => setIsNewItemModalOpen(false)} className="px-6 py-3 text-slate-400 font-bold">Cancelar</button><button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg">Añadir</button></div>
        </form>
      </Modal>
    </div>
  );
};