import React, { useState, useEffect, useMemo } from 'react';
import { Quotation, Product, Category, QuotationItem, Customer } from '../types';
import { useAuth } from '../components/AuthContext';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Calculator,
  ChevronLeft,
  Info,
  Percent,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface QuotationFormProps {
  initialData?: Quotation;
  onClose: () => void;
}

export default function QuotationForm({ initialData, onClose }: QuotationFormProps) {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Quotation>>(initialData || {
    clientName: '',
    headCount: 1,
    date: new Date().toISOString().split('T')[0],
    contactPerson: '',
    phone: '',
    items: [],
    status: 'draft',
    totalRetail: 0,
    totalDiscounted: 0,
    perPerson: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const allProducts = await response.json();
      setProducts(allProducts.filter((p: Product) => p.status === 'active'));
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const allCategories = await response.json();
      setCategories(allCategories.filter((c: Category) => c.status === 'active'));
    }
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      setCustomers(await response.json());
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const categoryTree = useMemo(() => {
    const rootCats = categories.filter(c => !c.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
    return rootCats.map(root => ({
      ...root,
      children: categories.filter(c => c.parentId === root.id).sort((a, b) => (a.order || 0) - (b.order || 0))
    }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || 
        p.bigCategoryId === selectedCategory || 
        p.smallCategoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const calculateTotals = (items: QuotationItem[]) => {
    const totalRetail = items.reduce((sum, item) => sum + (item.retailPrice * item.quantity * item.days), 0);
    const totalDiscounted = items.reduce((sum, item) => sum + item.total, 0);
    const perPerson = formData.headCount ? totalDiscounted / formData.headCount : 0;
    return { totalRetail, totalDiscounted, perPerson };
  };

  const addItem = (product: Product) => {
    const newItem: QuotationItem = {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      retailPrice: product.retailPrice,
      quantity: 1,
      days: 1,
      discount: 1.0,
      total: product.retailPrice
    };
    const newItems = [...(formData.items || []), newItem];
    const totals = calculateTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const updateItem = (index: number, updates: Partial<QuotationItem>) => {
    const newItems = [...(formData.items || [])];
    const item = { ...newItems[index], ...updates };
    
    // Validate discount based on role
    if (updates.discount !== undefined && profile) {
      const product = products.find(p => p.id === item.productId);
      if (product && profile.role === 'quoter' && updates.discount < product.minDiscount) {
        alert(`您的权限不足以给予低于 ${product.minDiscount * 10} 折的优惠`);
        item.discount = product.minDiscount;
      }
    }

    item.total = item.retailPrice * item.quantity * item.days * item.discount;
    newItems[index] = item;
    const totals = calculateTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items?.filter((_, i) => i !== index) || [];
    const totals = calculateTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const applyGlobalDiscount = (discount: number) => {
    if (profile?.role === 'quoter' && discount < 0.8) {
      alert('普通报价员整单折扣不能低于 8 折，请联系管理员');
      return;
    }
    const newItems = (formData.items || []).map(item => {
      const product = products.find(p => p.id === item.productId);
      const finalDiscount = Math.max(discount, product?.minDiscount || 0);
      return {
        ...item,
        discount: finalDiscount,
        total: item.retailPrice * item.quantity * item.days * finalDiscount
      };
    });
    const totals = calculateTotals(newItems);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const categorySummary = useMemo(() => {
    const summary: { [key: string]: { name: string; retail: number; discounted: number } } = {};
    
    (formData.items || []).forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const categoryId = product?.bigCategoryId || 'other';
      const categoryName = categories.find(c => c.id === categoryId)?.name || '其他';
      
      if (!summary[categoryId]) {
        summary[categoryId] = { name: categoryName, retail: 0, discounted: 0 };
      }
      summary[categoryId].retail += item.retailPrice * item.quantity * item.days;
      summary[categoryId].discounted += item.total;
    });
    
    return Object.values(summary);
  }, [formData.items, products, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.items?.length) {
      alert('请至少添加一个项目');
      return;
    }
    setIsSaving(true);
    const token = localStorage.getItem('token');
    try {
      let currentCustomerId = formData.customerId;

      // Check if this is a new customer name
      const existingCustomer = customers.find(c => c.name === formData.clientName);
      if (!existingCustomer && formData.clientName) {
        // Create new customer
        const newCustomerData = {
          name: formData.clientName || '',
          contactPerson: formData.contactPerson || '',
          phone: formData.phone || '',
          email: '',
          address: '',
          taxId: '',
          notes: '从报价单自动创建',
          status: 'active'
        };
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newCustomerData)
        });
        if (response.ok) {
          const newCustomer = await response.json();
          currentCustomerId = newCustomer.id;
        }
      } else if (existingCustomer) {
        currentCustomerId = existingCustomer.id;
      }

      const data = {
        ...formData,
        customerId: currentCustomerId,
        quoterId: profile?.id,
        createdAt: initialData?.createdAt || new Date().toISOString()
      };
      if (initialData?.id) {
        await fetch(`/api/quotations/${initialData.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      } else {
        await fetch('/api/quotations', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{initialData ? '编辑报价单' : '新建报价单'}</h2>
          <p className="text-gray-500">填写活动信息并选择服务项目</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Basic Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">基础信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">活动单位 / 客户名称</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={e => {
                      setFormData({ ...formData, clientName: e.target.value, customerId: '' });
                      setShowCustomerList(true);
                    }}
                    onFocus={() => setShowCustomerList(true)}
                    onBlur={() => setTimeout(() => setShowCustomerList(false), 200)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="输入客户名称或从下方选择..."
                  />
                  {showCustomerList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        选择已有客户
                      </div>
                      {customers
                        .filter(c => c.name.toLowerCase().includes((formData.clientName || '').toLowerCase()))
                        .map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                customerId: customer.id,
                                clientName: customer.name,
                                contactPerson: customer.contactPerson,
                                phone: customer.phone
                              });
                              setShowCustomerList(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="font-bold text-gray-900 text-sm">{customer.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              <span>{customer.contactPerson}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>{customer.phone}</span>
                            </div>
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomerList(false)}
                        className="w-full p-2 text-center text-xs text-blue-600 font-bold hover:bg-gray-50"
                      >
                        关闭列表
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动人数</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.headCount}
                  onChange={e => {
                    const count = parseInt(e.target.value);
                    setFormData({ ...formData, headCount: count });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动日期</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">项目明细</h3>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => applyGlobalDiscount(0.9)}
                  className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
                >
                  整单 9 折
                </button>
                <button 
                  type="button" 
                  onClick={() => applyGlobalDiscount(0.8)}
                  className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
                >
                  整单 8 折
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-3">项目名称</th>
                    <th className="px-4 py-3 text-center">数量</th>
                    <th className="px-4 py-3 text-center">天数</th>
                    <th className="px-6 py-3 text-right">小计</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formData.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400">{formatCurrency(item.retailPrice)} / {item.unit}</div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(index, { quantity: parseInt(e.target.value) })}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.days}
                          onChange={e => updateItem(index, { days: parseInt(e.target.value) })}
                          className="w-12 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                        请从右侧产品库中选择项目添加到报价单
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Card - Moved from sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">费用汇总</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category Breakdown */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">分类明细</p>
                <div className="space-y-2">
                  {categorySummary.length > 0 ? (
                    categorySummary.map(cat => (
                      <div key={cat.name} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-gray-600 font-medium">{cat.name}</span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{formatCurrency(cat.discounted)}</div>
                          <div className="text-[10px] text-orange-600 font-bold">
                            {((cat.discounted / cat.retail) * 10).toFixed(1)} 折
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">暂无明细</p>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">最终结算</p>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">原价总计</span>
                    <span className="text-gray-900 font-medium line-through">{formatCurrency(formData.totalRetail || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">优惠金额</span>
                    <span className="text-orange-600 font-medium">-{formatCurrency((formData.totalRetail || 0) - (formData.totalDiscounted || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">整单折扣</span>
                    <span className="text-orange-600 font-bold">
                      {formData.totalRetail ? ((formData.totalDiscounted || 0) / formData.totalRetail * 10).toFixed(1) : '10.0'} 折
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
                    <span className="text-gray-900 font-bold">最终总价</span>
                    <span className="text-2xl font-black text-blue-600">{formatCurrency(formData.totalDiscounted || 0)}</span>
                  </div>
                  <div className="bg-blue-100/50 p-3 rounded-xl flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-blue-600">人均单价</span>
                    <span className="text-lg font-black text-blue-700">{formatCurrency(formData.perPerson || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Product Selector */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">产品库选择</h3>
            
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索产品名称..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-100 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {searchQuery ? (
                // Search Results
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">搜索结果</p>
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addItem(product)}
                      className="w-full p-3 text-left border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(product.retailPrice)} / {product.unit}</p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">未找到相关产品</p>
                  )}
                </div>
              ) : (
                // Hierarchical Categories
                <div className="space-y-1">
                  {categoryTree.map(root => (
                    <div key={root.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleCategory(root.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-lg text-sm font-bold transition-colors",
                          expandedCategories.includes(root.id) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span>{root.name}</span>
                        {expandedCategories.includes(root.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                      {expandedCategories.includes(root.id) && (
                        <div className="pl-3 space-y-1 border-l-2 border-blue-100 ml-2">
                          {/* Products directly in root category */}
                          {products.filter(p => p.bigCategoryId === root.id && !p.smallCategoryId).map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addItem(product)}
                              className="w-full p-2 text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors flex justify-between items-center group"
                            >
                              <span className="truncate">{product.name}</span>
                              <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                          
                          {/* Subcategories */}
                          {root.children.map(sub => (
                            <div key={sub.id} className="space-y-1">
                              <button
                                type="button"
                                onClick={() => toggleCategory(sub.id)}
                                className={cn(
                                  "w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors",
                                  expandedCategories.includes(sub.id) ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                <span>{sub.name}</span>
                                {expandedCategories.includes(sub.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                              
                              {expandedCategories.includes(sub.id) && (
                                <div className="pl-3 space-y-1 border-l border-gray-200 ml-2">
                                  {products.filter(p => p.smallCategoryId === sub.id).map(product => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => addItem(product)}
                                      className="w-full p-2 text-left text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded transition-colors flex justify-between items-center group"
                                    >
                                      <span className="truncate">{product.name}</span>
                                      <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存报价
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Loader2(props: any) {
  return <Calculator {...props} />;
}
