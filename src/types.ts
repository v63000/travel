export type UserRole = 'super_admin' | 'admin' | 'quoter' | 'viewer';

export interface Permissions {
  view: boolean;
  edit: boolean;
}

export interface UserPermissions {
  dashboard: Permissions;
  quotation: Permissions;
  contract: Permissions;
  customer: Permissions;
  product: Permissions;
  category: Permissions;
  user: Permissions;
  settings: Permissions;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  status: 'active' | 'inactive';
  permissions?: UserPermissions;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  order: number;
}

export interface Product {
  id: string;
  name: string;
  bigCategoryId: string;
  smallCategoryId: string;
  retailPrice: number;
  costPrice?: number;
  minDiscount: number;
  unit: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface QuotationItem {
  productId: string;
  name: string;
  unit: string;
  retailPrice: number;
  quantity: number;
  days: number;
  discount: number;
  total: number;
}

export interface Quotation {
  id: string;
  customerId?: string;
  clientName: string;
  headCount: number;
  date: string;
  contactPerson: string;
  phone: string;
  quoterId: string;
  items: QuotationItem[];
  totalRetail: number;
  totalDiscounted: number;
  perPerson: number;
  status: 'draft' | 'sent' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Contract {
  id: string;
  customerId?: string;
  quotationId: string;
  contractNumber: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'signed' | 'completed' | 'cancelled';
  content: string;
  signedAt?: string;
  createdAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  createdAt: string;
}

export interface SystemSettings {
  companyName: string;
  logo: string;
  contactInfo: string;
}
