import React from 'react';
import { Product, Category } from '../types';
import { ArrowLeft, Tag, DollarSign, Info, ShieldCheck, ShieldAlert, Package, Layers } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../lib/utils';

interface ProductDetailProps {
  product: Product;
  categories: Category[];
  onBack: () => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export default function ProductDetail({ product, categories, onBack, onEdit, onToggleStatus }: ProductDetailProps) {
  const bigCategory = categories.find(c => c.id === product.bigCategoryId);
  const smallCategory = categories.find(c => c.id === product.smallCategoryId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          title="返回列表"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <p className="text-gray-500 text-sm">产品详情信息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                基本信息
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">产品名称</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{product.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">所属分类</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {bigCategory?.name || '未分类'}
                    </span>
                    {smallCategory && (
                      <>
                        <span className="text-gray-300">/</span>
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-sm font-medium">
                          {smallCategory.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">计量单位</label>
                  <p className="text-base font-medium text-gray-700 mt-1 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    {product.unit}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">当前状态</label>
                  <div className="mt-1">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 w-fit",
                      product.status === 'active' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {product.status === 'active' ? (
                        <><ShieldCheck className="w-3.5 h-3.5" /> 启用中</>
                      ) : (
                        <><ShieldAlert className="w-3.5 h-3.5" /> 已禁用</>
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">创建时间</label>
                  <p className="text-base font-medium text-gray-700 mt-1">
                    {product.createdAt ? formatDate(product.createdAt) : '未知'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                产品描述
              </h3>
            </div>
            <div className="p-6">
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {product.description || '暂无详细描述信息。'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                价格体系
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">刊例单价</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-700">{formatCurrency(product.retailPrice)}</span>
                  <span className="text-sm text-blue-500 font-medium">/ {product.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">成本价</p>
                  <p className="text-xl font-bold text-gray-700">{formatCurrency(product.costPrice)}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">最低折扣</p>
                  <p className="text-xl font-bold text-orange-700">{product.minDiscount * 10} 折</p>
                  <p className="text-[10px] text-orange-400 mt-1 italic">最低可售价格：{formatCurrency(product.retailPrice * product.minDiscount)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">毛利空间 (估算)</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(product.retailPrice - product.costPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-500">毛利率</span>
                  <span className="font-bold text-green-600">
                    {(((product.retailPrice - product.costPrice) / product.retailPrice) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              快速操作
            </h4>
            <p className="text-blue-100 text-sm mb-4">您可以直接在此处进行编辑或下架操作。</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onEdit(product)}
                className="bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                编辑产品
              </button>
              <button 
                onClick={() => onToggleStatus(product)}
                className="bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                {product.status === 'active' ? '下架产品' : '上架产品'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
