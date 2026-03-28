import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { Plus, Edit2, Trash2, Search, Filter, Save, X, MoreHorizontal, Eye, Download, Upload, CheckSquare, Square, Trash, ChevronRight, ChevronDown, Folder, FolderOpen, ArrowUp, ArrowDown, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import ProductDetail from './ProductDetail';
import * as XLSX from 'xlsx';

export default function ProductLibrary() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isFlatView, setIsFlatView] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = useState<'retailPrice' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    bigCategoryId: '',
    smallCategoryId: '',
    retailPrice: 0,
    costPrice: 0,
    minDiscount: 0.5,
    unit: '位',
    description: '',
    status: 'active'
  });

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setProducts(await response.json());
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setCategories(await response.json());
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const bigCategories = categories.filter(c => !c.parentId);
  const smallCategories = categories.filter(c => c.parentId === formData.bigCategoryId);
  const existingUnits = Array.from(new Set([...products.map(p => p.unit), '位', '场', '间', '斤', '个', '次', '天', '晚', '套'])).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (editingId) {
      await fetch(`/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setEditingId(null);
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          createdAt: new Date().toISOString()
        })
      });
      setIsAdding(false);
    }
    setFormData({ name: '', bigCategoryId: '', smallCategoryId: '', retailPrice: 0, costPrice: 0, minDiscount: 0.5, unit: '位', description: '', status: 'active' });
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setSelectedProductId(null);
    setEditingId(product.id);
    setFormData(product);
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...product, status: newStatus })
      });
      fetchProducts();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该产品吗？')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
      fetchProducts();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchStatusUpdate = async (status: 'active' | 'inactive') => {
    const token = localStorage.getItem('token');
    await Promise.all(Array.from(selectedIds).map(id => {
      const product = products.find(p => p.id === id);
      if (!product) return Promise.resolve();
      return fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...product, status })
      });
    }));
    fetchProducts();
    alert(`已批量${status === 'active' ? '启用' : '禁用'} ${selectedIds.size} 个产品`);
  };

  const handleBatchDelete = async () => {
    if (confirm(`确定要删除选中的 ${selectedIds.size} 个产品吗？此操作不可撤销。`)) {
      const token = localStorage.getItem('token');
      await Promise.all(Array.from(selectedIds).map(id => 
        fetch(`/api/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      setSelectedIds(new Set());
      fetchProducts();
      alert('已批量删除选中的产品');
    }
  };

  const handleExportExcel = () => {
    const exportData = products.map(p => ({
      '产品名称': p.name,
      '大类': bigCategories.find(c => c.id === p.bigCategoryId)?.name || '',
      '小类': categories.find(c => c.id === p.smallCategoryId)?.name || '',
      '刊例单价': p.retailPrice,
      '成本价': p.costPrice,
      '最低折扣': p.minDiscount,
      '单位': p.unit,
      '状态': p.status === 'active' ? '启用' : '禁用',
      '产品说明': p.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "产品列表");
    XLSX.writeFile(wb, `产品库导出_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const token = localStorage.getItem('token');
      let count = 0;

      for (const item of data) {
        const bigCat = bigCategories.find(c => c.name === item['大类']);
        const smallCat = categories.find(c => c.name === item['小类'] && c.parentId === bigCat?.id);

        const productData = {
          name: item['产品名称'] || '未命名产品',
          bigCategoryId: bigCat?.id || '',
          smallCategoryId: smallCat?.id || '',
          retailPrice: Number(item['刊例单价']) || 0,
          costPrice: Number(item['成本价']) || 0,
          minDiscount: Number(item['最低折扣']) || 0.5,
          unit: item['单位'] || '位',
          status: item['状态'] === '禁用' ? 'inactive' : 'active',
          description: item['产品说明'] || '',
          createdAt: new Date().toISOString()
        };

        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
        if (res.ok) count++;
      }

      if (count > 0) {
        alert(`成功导入 ${count} 个产品`);
        fetchProducts();
      } else {
        alert('未在文件中找到有效数据或导入失败');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || p.bigCategoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortProducts = (productList: Product[]) => {
    return [...productList].sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  };

  // Grouping logic for tree view
  const groupedProducts = bigCategories.map(bigCat => {
    const bigCatProducts = filteredProducts.filter(p => p.bigCategoryId === bigCat.id);
    const smallCatsInBig = categories.filter(c => c.parentId === bigCat.id);
    
    const smallGroups = smallCatsInBig.map(smallCat => {
      const smallCatProducts = bigCatProducts.filter(p => p.smallCategoryId === smallCat.id);
      return {
        ...smallCat,
        products: sortProducts(smallCatProducts)
      };
    }).filter(group => group.products.length > 0);

    const uncategorizedProducts = bigCatProducts.filter(p => !p.smallCategoryId || !smallCatsInBig.find(sc => sc.id === p.smallCategoryId));

    return {
      ...bigCat,
      smallGroups,
      uncategorizedProducts: sortProducts(uncategorizedProducts),
      totalCount: bigCatProducts.length
    };
  }).filter(group => group.totalCount > 0);

  const toggleSort = (field: 'retailPrice' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandedGroups.size > 0) {
      setExpandedGroups(new Set());
    } else {
      const allIds = new Set<string>();
      bigCategories.forEach(bc => {
        allIds.add(bc.id);
        categories.filter(c => c.parentId === bc.id).forEach(sc => allIds.add(sc.id));
      });
      setExpandedGroups(allIds);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (selectedProduct) {
    return (
      <ProductDetail 
        product={selectedProduct} 
        categories={categories} 
        onBack={() => setSelectedProductId(null)} 
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">产品管理</h2>
          <p className="text-gray-500">统一管理所有旅游产品及服务项目</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="bg-white text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            导入 Excel
            <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
          </label>
          <button
            onClick={handleExportExcel}
            className="bg-white text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出 Excel
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors w-fit shadow-lg shadow-blue-100"
          >
            <Plus className="w-4 h-4" />
            新增产品
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索产品名称..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
          >
            <option value="">全部大类</option>
            {bigCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={() => setIsFlatView(!isFlatView)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors flex items-center gap-2",
              isFlatView ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {isFlatView ? "分类视图" : "列表视图"}
          </button>
          {!isFlatView && (
            <button
              onClick={toggleExpandAll}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {expandedGroups.size > 0 ? "全部折叠" : "全部展开"}
            </button>
          )}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'list' ? "bg-blue-50 text-blue-600" : "bg-white text-gray-400 hover:bg-gray-50"
              )}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 transition-colors",
                viewMode === 'grid' ? "bg-blue-50 text-blue-600" : "bg-white text-gray-400 hover:bg-gray-50"
              )}
              title="网格视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">{editingId ? '编辑产品' : '新增产品'}</h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计量单位</label>
              <input
                list="unit-options"
                type="text"
                required
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="选择或输入单位"
              />
              <datalist id="unit-options">
                {existingUnits.map(unit => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属大类</label>
              <select
                required
                value={formData.bigCategoryId}
                onChange={e => setFormData({ ...formData, bigCategoryId: e.target.value, smallCategoryId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">请选择</option>
                {bigCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属小类</label>
              <select
                value={formData.smallCategoryId}
                onChange={e => setFormData({ ...formData, smallCategoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">请选择</option>
                {smallCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">刊例单价 (元)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.retailPrice}
                onChange={e => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成本价 (元)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低折扣 (0.1-1.0)</label>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.1"
                value={formData.minDiscount}
                onChange={e => setFormData({ ...formData, minDiscount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品说明</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                placeholder="输入产品详细说明或备注..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                保存产品
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-4 shadow-xl shadow-blue-200">
          <div className="flex items-center gap-4">
            <span className="font-bold">已选中 {selectedIds.size} 个产品</span>
            <div className="w-px h-4 bg-blue-400" />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBatchStatusUpdate('active')}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                批量启用
              </button>
              <button 
                onClick={() => handleBatchStatusUpdate('inactive')}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                批量禁用
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBatchDelete}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash className="w-3.5 h-3.5" /> 批量删除
            </button>
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              selectedIds={selectedIds}
              toggleSelect={toggleSelect}
              setSelectedProductId={setSelectedProductId}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              bigCategories={bigCategories}
              categories={categories}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              未找到相关产品
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                      {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">产品名称</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => toggleSort('retailPrice')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      刊例价 / 单位
                      {sortField === 'retailPrice' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">最低折扣</th>
                  <th 
                    className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      创建时间
                      {sortField === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">状态</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isFlatView ? (
                  filteredProducts.map(product => (
                    <ProductRow 
                      key={product.id} 
                      product={product} 
                      selectedIds={selectedIds}
                      toggleSelect={toggleSelect}
                      setSelectedProductId={setSelectedProductId}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                      bigCategories={bigCategories}
                      categories={categories}
                    />
                  ))
                ) : (
                  groupedProducts.map(bigGroup => {
                    const isBigExpanded = expandedGroups.has(bigGroup.id) || searchQuery.length > 0;
                    return (
                      <React.Fragment key={bigGroup.id}>
                        {/* Big Category Header Row */}
                        <tr className="bg-gray-50/50 border-y border-gray-100">
                          <td className="px-6 py-3" colSpan={8}>
                            <button 
                              onClick={() => toggleGroup(bigGroup.id)}
                              className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors w-full text-left"
                            >
                              {isBigExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <FolderOpen className="w-4 h-4 text-blue-500" />
                              {bigGroup.name}
                              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full text-[10px] font-normal">
                                {bigGroup.totalCount} 个产品
                              </span>
                            </button>
                          </td>
                        </tr>

                        {isBigExpanded && (
                          <>
                            {/* Small Category Groups */}
                            {bigGroup.smallGroups.map(smallGroup => {
                              const smallGroupId = `${bigGroup.id}-${smallGroup.id}`;
                              const isSmallExpanded = expandedGroups.has(smallGroupId) || searchQuery.length > 0;
                              return (
                                <React.Fragment key={smallGroup.id}>
                                  <tr className="bg-white">
                                    <td className="px-6 py-2 pl-12" colSpan={8}>
                                      <button 
                                        onClick={() => toggleGroup(smallGroupId)}
                                        className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors w-full text-left"
                                      >
                                        {isSmallExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        <Folder className="w-3.5 h-3.5 text-blue-400" />
                                        {smallGroup.name}
                                        <span className="ml-2 text-[10px] font-normal text-gray-400">
                                          ({smallGroup.products.length})
                                        </span>
                                      </button>
                                    </td>
                                  </tr>
                                  {isSmallExpanded && smallGroup.products.map(product => (
                                    <ProductRow 
                                      key={product.id} 
                                      product={product} 
                                      selectedIds={selectedIds}
                                      toggleSelect={toggleSelect}
                                      setSelectedProductId={setSelectedProductId}
                                      handleEdit={handleEdit}
                                      handleDelete={handleDelete}
                                      bigCategories={bigCategories}
                                      categories={categories}
                                      indent
                                    />
                                  ))}
                                </React.Fragment>
                              );
                            })}

                            {/* Uncategorized products in this big category */}
                            {bigGroup.uncategorizedProducts.map(product => (
                              <ProductRow 
                                key={product.id} 
                                product={product} 
                                selectedIds={selectedIds}
                                toggleSelect={toggleSelect}
                                setSelectedProductId={setSelectedProductId}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                bigCategories={bigCategories}
                                categories={categories}
                              />
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      未找到相关产品
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const ProductCard: React.FC<{
  product: Product;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  setSelectedProductId: (id: string) => void;
  handleEdit: (product: Product) => void;
  handleDelete: (id: string) => Promise<void> | void;
  bigCategories: Category[];
  categories: Category[];
}> = ({
  product,
  selectedIds,
  toggleSelect,
  setSelectedProductId,
  handleEdit,
  handleDelete,
  bigCategories,
  categories,
}) => {
  const bigCategory = bigCategories.find(c => c.id === product.bigCategoryId);
  const smallCategory = categories.find(c => c.id === product.smallCategoryId);

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group relative",
      selectedIds.has(product.id) && "ring-2 ring-blue-500 border-transparent"
    )}>
      <div className="absolute top-3 left-3 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); toggleSelect(product.id); }}
          className="text-gray-400 hover:text-blue-600 transition-colors bg-white/80 backdrop-blur-sm rounded-md p-1 shadow-sm"
        >
          {selectedIds.has(product.id) ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="p-5" onClick={() => setSelectedProductId(product.id)}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3rem]">
              {product.name}
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                {bigCategory?.name || '未分类'}
              </span>
              {smallCategory && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                  {smallCategory.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="text-xs text-gray-500">刊例价</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(product.retailPrice)}
              <span className="text-xs font-normal text-gray-400 ml-1">/ {product.unit}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">最低折扣</span>
            <span className="font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {product.minDiscount * 10} 折
            </span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium",
              product.status === 'active' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
            )}>
              {product.status === 'active' ? '上架中' : '已下架'}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="编辑"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductRow: React.FC<{ 
  product: Product;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  setSelectedProductId: (id: string) => void;
  handleEdit: (product: Product) => void;
  handleDelete: (id: string) => Promise<void> | void;
  bigCategories: Category[];
  categories: Category[];
  indent?: boolean;
}> = ({ 
  product, 
  selectedIds, 
  toggleSelect, 
  setSelectedProductId, 
  handleEdit, 
  handleDelete, 
  bigCategories, 
  categories,
  indent = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className={cn(
        "hover:bg-gray-50 transition-colors group",
        selectedIds.has(product.id) && "bg-blue-50/50",
        isExpanded && "bg-gray-50"
      )}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => toggleSelect(product.id)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              {selectedIds.has(product.id) ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </td>
        <td className={cn("px-6 py-4", indent && "pl-16")}>
          <div 
            className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2 group/title"
            onClick={() => setSelectedProductId(product.id)}
          >
            {product.name}
            <Eye className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 transition-opacity" />
          </div>
          {!isExpanded && (
            <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description || '无说明'}</div>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-600">
            {bigCategories.find(c => c.id === product.bigCategoryId)?.name || '-'}
          </div>
          <div className="text-xs text-gray-400">
            {categories.find(c => c.id === product.smallCategoryId)?.name || '-'}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="text-sm font-bold text-blue-600">{formatCurrency(product.retailPrice)}</div>
          <div className="text-xs text-gray-400">/ {product.unit}</div>
        </td>
        <td className="px-6 py-4 text-center">
          <span className="text-sm text-gray-600">{product.minDiscount * 10} 折</span>
        </td>
        <td className="px-6 py-4 text-center">
          <div className="text-xs text-gray-500">{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}</div>
        </td>
        <td className="px-6 py-4 text-center">
          <span className={cn(
            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
            product.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {product.status === 'active' ? '启用' : '禁用'}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setSelectedProductId(product.id)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="查看详情">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="编辑">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50/30 border-b border-gray-100">
          <td className="px-6 py-4" colSpan={8}>
            <div className="pl-16 pr-6 pb-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">详细描述</h5>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {product.description || '暂无详细描述'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">成本价</h5>
                  <p className="text-sm font-medium text-gray-700">{formatCurrency(product.costPrice)}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">利润率</h5>
                  <p className="text-sm font-medium text-green-600">
                    {product.retailPrice > 0 ? (((product.retailPrice - product.costPrice) / product.retailPrice) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">最后更新</h5>
                  <p className="text-sm font-medium text-gray-700">
                    {product.createdAt ? new Date(product.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
