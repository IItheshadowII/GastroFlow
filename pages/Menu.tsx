import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, Loader2, AlertCircle, Image as ImageIcon, Hash } from 'lucide-react';
import { db } from '../services/db';
import { Product, Category } from '../types';

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
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
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

export const MenuPage: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, [tenantId]);

  const refreshData = () => {
    const cats = db.query<Category>('categories', tenantId).sort((a, b) => a.order - b.order);
    const prods = db.query<Product>('products', tenantId);
    setCategories(cats);
    setProducts(prods);
  };

  const handleDeleteProduct = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        db.removeProduct(id, tenantId);
        refreshData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleDeleteCategory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const prodsInCategory = products.filter(p => p.categoryId === id);
    if (prodsInCategory.length > 0) {
      alert('No puedes eliminar una categoría que contiene productos. Mueve o elimina los productos primero.');
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        db.removeCategory(id, tenantId);
        if (selectedCategory === id) setSelectedCategory('all');
        refreshData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    if (editingItem && editingItem.order !== undefined) {
      db.update<Category>('categories', editingItem.id, tenantId, { name });
    } else {
      db.insert<Category>('categories', {
        id: `cat-${Date.now()}`,
        tenantId,
        name,
        order: categories.length + 1
      });
    }
    
    setTimeout(() => {
      refreshData();
      setIsCatModalOpen(false);
      setEditingItem(null);
      setLoading(false);
    }, 400);
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const productData: Partial<Product> = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      description: formData.get('description') as string,
      categoryId: formData.get('categoryId') as string,
      price: Number(formData.get('price')),
      stockEnabled: formData.get('stockEnabled') === 'on',
      stockQuantity: Number(formData.get('stockQuantity') || 0),
      stockMin: Number(formData.get('stockMin') || 5),
      isActive: true,
    };

    if (editingItem && editingItem.price !== undefined) {
      db.update<Product>('products', editingItem.id, tenantId, productData);
    } else {
      db.insert<Product>('products', {
        id: `p-${Date.now()}`,
        tenantId,
        ...productData as Product
      });
    }

    setTimeout(() => {
      refreshData();
      setIsProdModalOpen(false);
      setEditingItem(null);
      setLoading(false);
    }, 400);
  };

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingItem(null); setIsCatModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600"
          >
            <Plus size={18} />
            Categoría
          </button>
          <button 
            onClick={() => { setEditingItem(null); setIsProdModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} />
            Producto
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'all' 
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <div key={cat.id} className="group relative flex-shrink-0">
            <button
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border pr-10 ${
                selectedCategory === cat.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {cat.name}
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingItem(cat); setIsCatModalOpen(true); }}
                className={`p-1 rounded hover:bg-white/10 ${selectedCategory === cat.id ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-blue-400'}`}
              >
                <Edit2 size={12} />
              </button>
              <button 
                onClick={(e) => handleDeleteCategory(e, cat.id)}
                className={`p-1 rounded hover:bg-white/10 ${selectedCategory === cat.id ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-red-400'}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? filteredProducts.map(product => (
          <div key={product.id} className="group bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 shadow-lg hover:shadow-blue-500/5">
            <div className="h-44 bg-slate-800 relative overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
                  <ImageIcon size={48} strokeWidth={1.5} />
                </div>
              )}
              
              {product.sku && (
                <div className="absolute top-4 left-4 z-10">
                   <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-black tracking-[0.15em] text-blue-400 border border-blue-500/30 font-mono">
                     #{product.sku}
                   </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                <button 
                  onClick={() => { setEditingItem(product); setIsProdModalOpen(true); }}
                  className="p-2.5 bg-slate-900/90 backdrop-blur-md rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-2xl border border-slate-700/50"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={(e) => handleDeleteProduct(e, product.id)}
                  className="p-2.5 bg-slate-900/90 backdrop-blur-md rounded-xl text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-2xl border border-slate-700/50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                 <span className="px-3 py-1 bg-slate-950/60 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                   {categories.find(c => c.id === product.categoryId)?.name || 'Sin Cat.'}
                 </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-100 text-lg leading-tight">{product.name}</h4>
                <div className="text-right">
                  <span className="text-emerald-400 font-black text-xl tracking-tight">${product.price}</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed">{product.description || 'Sin descripción disponible.'}</p>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Stock</span>
                  <span className={`text-sm font-bold ${(product.stockEnabled && product.stockQuantity <= product.stockMin) ? 'text-amber-500' : 'text-slate-300'}`}>
                    {product.stockEnabled ? `${product.stockQuantity} unid.` : '∞ Ilimitado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Estado</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${product.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></span>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center">
            <div className="mb-6 inline-flex p-6 bg-slate-900 border border-slate-800 rounded-3xl text-slate-700 shadow-inner">
              <ImageIcon size={64} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No se encontraron productos</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Prueba ajustando tu búsqueda o selecciona otra categoría de la carta.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isCatModalOpen} 
        onClose={() => setIsCatModalOpen(false)} 
        title={editingItem ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre de la categoría</label>
            <input 
              name="name"
              required
              autoFocus
              defaultValue={editingItem?.name}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
              placeholder="Ej: Entradas, Plato Principal, Bebidas..."
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-6 py-2.5 text-slate-400 hover:text-slate-100 font-bold transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {editingItem ? 'Actualizar' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isProdModalOpen} 
        onClose={() => setIsProdModalOpen(false)} 
        title={editingItem ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Código / SKU</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  name="sku"
                  defaultValue={editingItem?.sku}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-10 pr-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono text-sm tracking-wider"
                  placeholder="ID-001"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
              <input 
                name="name"
                required
                defaultValue={editingItem?.name}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                placeholder="Ej: Hamburguesa Gourmet"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
              <textarea 
                name="description"
                rows={2}
                defaultValue={editingItem?.description}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all"
                placeholder="Ingredientes, alérgenos, preparación..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
              <select 
                name="categoryId"
                required
                defaultValue={editingItem?.categoryId}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
              >
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Precio de Venta</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-500">$</span>
                <input 
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingItem?.price}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-10 pr-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 p-5 bg-slate-800/40 rounded-3xl border border-slate-700/50">
              <input 
                id="stockEnabled"
                name="stockEnabled"
                type="checkbox"
                defaultChecked={editingItem?.stockEnabled}
                className="w-6 h-6 rounded-lg bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
              />
              <label htmlFor="stockEnabled" className="text-sm font-bold text-slate-300 cursor-pointer">Habilitar control de inventario</label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Existencia Inicial</label>
              <input 
                name="stockQuantity"
                type="number"
                defaultValue={editingItem?.stockQuantity || 0}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mínimo Crítico</label>
              <input 
                name="stockMin"
                type="number"
                defaultValue={editingItem?.stockMin || 5}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-5 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-6 py-3 text-slate-400 hover:text-slate-100 font-bold transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/30 flex items-center gap-3 active:scale-[0.97]">
              {loading && <Loader2 size={20} className="animate-spin" />}
              {editingItem ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};