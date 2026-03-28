import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../components/AuthContext';
import { Shield, UserPlus, Trash2, Edit2, CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function UserManager() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', role: 'quoter' as UserRole });

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'super_admin') return;
    
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newUser,
        status: 'active'
      })
    });

    if (res.ok) {
      setIsAdding(false);
      setNewUser({ email: '', name: '', password: '', role: 'quoter' });
      fetchUsers();
    } else {
      const err = await res.json();
      alert(err.error || '新增失败');
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    if (profile?.role !== 'super_admin') {
      alert('只有超级管理员可以修改角色');
      return;
    }
    const token = localStorage.getItem('token');
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const token = localStorage.getItem('token');
    await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchUsers();
  };

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'super_admin', label: '超级管理员', color: 'text-purple-600 bg-purple-50' },
    { value: 'admin', label: '管理员', color: 'text-blue-600 bg-blue-50' },
    { value: 'quoter', label: '报价员', color: 'text-green-600 bg-green-50' },
    { value: 'viewer', label: '查看员', color: 'text-gray-600 bg-gray-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">权限管理</h2>
          <p className="text-gray-500">管理系统用户及其访问权限</p>
        </div>
        {profile?.role === 'super_admin' && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            新增用户
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">新增预授权用户</h3>
            <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              required
              placeholder="用户邮箱"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              required
              placeholder="姓名"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              required
              placeholder="初始密码"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">确认新增</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">用户信息</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">当前角色</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">状态</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    disabled={profile?.role !== 'super_admin' || user.id === profile.id}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer",
                      roles.find(r => r.value === user.role)?.color
                    )}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={user.id === profile?.id}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-all",
                      user.status === 'active' ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                    )}
                  >
                    {user.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {user.status === 'active' ? '正常' : '禁用'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.id !== profile?.id && profile?.role === 'super_admin' && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
        <Shield className="w-6 h-6 text-blue-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">权限说明</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li><strong>超级管理员：</strong> 拥有所有权限，包括修改其他用户的角色。</li>
            <li><strong>管理员：</strong> 可管理产品库、分类和查看所有报价单。</li>
            <li><strong>报价员：</strong> 仅可创建和管理自己的报价单，折扣受限。</li>
            <li><strong>查看员：</strong> 仅可查看数据和报价单，不可修改。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
