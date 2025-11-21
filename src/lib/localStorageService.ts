import { Database, User, Store, Product } from '../lib/database';
import { mockData } from './mockData';

const DB_KEYS = {
  USERS: 'audit_app_users',
  STORES: 'audit_app_stores',
  PRODUCTS: 'audit_app_products'
} as const;

// Current logged in user key
const CURRENT_USER_KEY = 'audit_app_current_user';

class LocalStorageService {
  // Initialize database with mock data
  initializeDatabase(): void {
    if (!this.isDatabaseInitialized()) {
      const { users, stores, products } = mockData;

      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

      console.log('Database initialized with mock data');
    }
  }

  // Check if database is already initialized
  isDatabaseInitialized(): boolean {
    return !!(localStorage.getItem(DB_KEYS.USERS) && 
              localStorage.getItem(DB_KEYS.STORES) && 
              localStorage.getItem(DB_KEYS.PRODUCTS));
  }

  // Users
  getUsers(): User[] {
    const users = localStorage.getItem(DB_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  }

  getUserById(id: number): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.username === username) || null;
  }
  
  getAuthenticatedUser(email: string, password: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email && user.password === password) || null;
  }

  addUser(user: Omit<User, 'id'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: this.getNextId(users)
    };
    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    return newUser;
  }

  // Stores
  getStores(): Store[] {
    const stores = localStorage.getItem(DB_KEYS.STORES);
    return stores ? JSON.parse(stores) : [];
  }

  getStoresByUserId(userId: number): Store[] {
    const stores = this.getStores();
    return stores.filter(Store => Store.assignedUserId === userId);
  }

  getStoreById(id: number): Store | null {
    const stores = this.getStores();
    return stores.find(Store => Store.id === id) || null;
  }



  updateStore(id: number, updates: Partial<Store>): Store | null {
    const stores = this.getStores();
    const index = stores.findIndex(Store => Store.id === id);

    if (index === -1) return null;

    stores[index] = { ...stores[index], ...updates } as Store;
    localStorage.setItem(DB_KEYS.STORES, JSON.stringify(stores));
    return stores[index];
  }

  // Products
  getProducts(): Product[] {
    const products = localStorage.getItem(DB_KEYS.PRODUCTS);
    return products ? JSON.parse(products) : [];
  }
  getProductsByStoreId(storeId: number): Product[] {
    const products = this.getProducts();
    return products.filter(product => product.storeId === storeId);
  }

  getProductById(id: number): Product | null {
    const products = this.getProducts();
    return products.find(product => product.id === id) || null;
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: this.getNextId(products)
    };
    products.push(newProduct);
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(product => product.id === id);

    if (index === -1) return null;

    products[index] = { ...products[index], ...updates };
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    return products[index];
  }

  // Helper method to generate next ID
  private getNextId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
  }

  // Current user/session helpers
  setCurrentUserId(userId: number): void {
    localStorage.setItem(CURRENT_USER_KEY, String(userId));
  }

  getCurrentUserId(): number | null {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    return id ? parseInt(id, 10) : null;
  }

  getCurrentUser(): User | null {
    const id = this.getCurrentUserId();
    return id !== null ? this.getUserById(id) : null;
  }

  clearCurrentUser(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // Clear all data (for testing/reset)
  clearDatabase(): void {
    localStorage.removeItem(DB_KEYS.USERS);
    localStorage.removeItem(DB_KEYS.STORES);
    localStorage.removeItem(DB_KEYS.PRODUCTS);
  }

  // Export all data
  exportDatabase(): Database {
    return {
      users: this.getUsers(),
      stores: this.getStores(),
      products: this.getProducts()
    };
  }
}

export const localStorageService = new LocalStorageService();