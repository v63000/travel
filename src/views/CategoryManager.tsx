import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { Plus, Edit2, Trash2, Save, X, GripVertical, ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  handleClassName?: string;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children, className, handleClassName }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className={handleClassName}>
        <GripVertical className="text-gray-400 w-5 h-5 cursor-grab active:cursor-grabbing" />
      </div>
      {children}
    </div>
  );
};

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '', status: 'active' as const, order: 0 });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    fetchCategories();
  }, []);

  const bigCategories = categories.filter(c => !c.parentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (editingId) {
      await fetch(`/api/categories/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setEditingId(null);
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, order: categories.length })
      });
      setIsAdding(false);
    }
    setFormData({ name: '', parentId: '', status: 'active', order: 0 });
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, parentId: cat.parentId || '', status: cat.status, order: cat.order });
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该分类吗？')) {
      const token = localStorage.getItem('token');
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCategories();
    }
  };

  const handleDragEnd = async (event: DragEndEvent, items: Category[], parentId: string | null) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      
      const token = localStorage.getItem('token');
      // Update each item's order
      await Promise.all(newItems.map((item, index) => 
        fetch(`/api/categories/${item.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...item, order: index })
        })
      ));
      
      fetchCategories();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">分类管理</h2>
          <p className="text-gray-500">管理产品的大类与小类</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增分类
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-semibold mb-4">{editingId ? '编辑分类' : '新增分类'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="例如：餐饮、住宿"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属大类</label>
              <select
                value={formData.parentId}
                onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">顶级分类 (大类)</option>
                {bigCategories.map(cat => (
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
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e, bigCategories, null)}
        >
          <SortableContext
            items={bigCategories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {bigCategories.map(bigCat => {
              const isExpanded = expandedIds.has(bigCat.id);
              const subCategories = categories.filter(c => c.parentId === bigCat.id);
              
              return (
                <div key={bigCat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <SortableItem 
                    id={bigCat.id} 
                    className={cn(
                      "px-6 py-4 flex items-center justify-between transition-colors",
                      isExpanded ? "bg-blue-50/30 border-b border-gray-100" : "bg-gray-50"
                    )}
                    handleClassName="mr-3"
                  >
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(bigCat.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <FolderOpen className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Folder className="w-5 h-5 text-blue-400" />
                          )}
                          <span className="font-bold text-gray-900">{bigCat.name}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          bigCat.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {bigCat.status === 'active' ? '启用' : '禁用'}
                        </span>
                        <span className="text-xs text-gray-400 font-normal">
                          ({subCategories.length} 个子类)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(bigCat)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(bigCat.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </SortableItem>
                  
                  {isExpanded && (
                    <div className="divide-y divide-gray-100 animate-in slide-in-from-top-2 duration-200">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, subCategories, bigCat.id)}
                      >
                        <SortableContext
                          items={subCategories.map(c => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {subCategories.map(smallCat => (
                            <SortableItem 
                              key={smallCat.id} 
                              id={smallCat.id}
                              className="px-12 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group relative"
                              handleClassName="mr-3"
                            >
                              {/* Tree Line */}
                              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200" />
                              <div className="absolute left-8 top-1/2 w-4 h-px bg-gray-200" />
                              
                              <div className="flex-1 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-700">{smallCat.name}</span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-medium",
                                    smallCat.status === 'active' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                  )}>
                                    {smallCat.status === 'active' ? '启用' : '禁用'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(smallCat)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(smallCat.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </SortableItem>
                          ))}
                        </SortableContext>
                      </DndContext>
                      {subCategories.length === 0 && (
                        <div className="px-16 py-4 text-xs text-gray-400 italic flex items-center gap-2">
                          <div className="w-4 h-px bg-gray-200" />
                          暂无子分类
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
