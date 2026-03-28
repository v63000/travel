import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import CategoryManager from './views/CategoryManager';
import ProductLibrary from './views/ProductLibrary';
import QuotationManager from './views/QuotationManager';
import ContractManager from './views/ContractManager';
import CustomerManager from './views/CustomerManager';
import UserManager from './views/UserManager';
import Settings from './views/Settings';
import { LogIn, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">正在加载系统...</p>
      </div>
    );
  }

  if (!user) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setAuthLoading(true);
      try {
        if (isRegistering) {
          await register(email, password, name);
        } else {
          await login(email, password);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || '认证失败，请检查您的账号和密码。');
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">旅游报价管理系统</h1>
          <p className="text-gray-500 mb-8 text-center">
            {isRegistering ? '创建您的账号以开始使用' : '请输入您的账号信息以登录系统'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="您的真实姓名"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号 / 邮箱</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={isRegistering ? "您的邮箱地址" : "账号或邮箱"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="您的登录密码"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {isRegistering ? '立即注册' : '立即登录'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              {isRegistering ? '已有账号？立即登录' : '没有账号？立即注册'}
            </button>
          </div>
          
          {!isRegistering && (
            <p className="mt-6 text-xs text-gray-400 text-center">
              默认管理员：admin / admin888
            </p>
          )}
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'categories': return <CategoryManager />;
      case 'products': return <ProductLibrary />;
      case 'quotations': return <QuotationManager />;
      case 'contracts': return <ContractManager />;
      case 'customers': return <CustomerManager />;
      case 'users': return <UserManager />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
