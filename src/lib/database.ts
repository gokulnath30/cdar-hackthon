export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  region: string;
  employeeId: string;
  no_of_audits: number;
  completed_audits: number;
  avg_audit_time: string;
}

export interface Store {
  id: number;
  storeName: string;
  address: string;
  shopType: string;
  lastVisited: string;
  progress: number;
  period: string;
  prevStatus: string;
  currentStatus: string;
  indexCode: string;
  seq: number;
  freq: string;
  activity: string;
  time: string;
  mode: string;
  priority: "high" | "medium" | "low";
  assignedUserId: number;
  assignedUserName: string;
  region: string;
}

export interface Product {
  id: number;
  name: string;
  categories: string[];
  brand: string;
  manufacturer: string;
  containers: number;
  brands: string;
  category: string;
  manufacturers: string;
  sku: string;
  status: string;
  lastUpdated: string;
  size: string;
  mrp: number;
  storeId?: number;
  self_Stock: number;
  other_Stock: number;
  retaile_selling_price: number;
  direct_price: number;
  indirect_price: number;
}

export interface Database {
  users: User[];
  stores: Store[];
  products: Product[];
}