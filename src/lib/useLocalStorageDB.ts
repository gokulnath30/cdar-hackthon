import { useState, useEffect, useCallback } from 'react';
import { localStorageService } from '../lib/localStorageService';
import { User, Store, Product } from '../lib/database';

export const useLocalStorageDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database on app start
  useEffect(() => {
    localStorageService.initializeDatabase();
    setIsInitialized(true);
  }, []);

  // Users
  const getUsers = useCallback((): User[] => {
    return localStorageService.getUsers();
  }, []);

  const setCurrentUserId = useCallback((userId: number): void => {
    localStorageService.setCurrentUserId(userId);
  }, []);

  const getCurrentUserId = useCallback((): number | null => {
    return localStorageService.getCurrentUserId();
  }, []);

  const getCurrentUser = useCallback((): User | null => {
    return localStorageService.getCurrentUser();
  }, []);

  const getUserById = useCallback((id: number): User | null => {
    return localStorageService.getUserById(id);
  }, []);

  const getUserByUsername = useCallback((username: string): User | null => {
    return localStorageService.getUserByUsername(username);
  }, []);
  
  const getAuthenticatedUser = useCallback((email: string, password: string): User | null => {
    return localStorageService.getAuthenticatedUser(email, password);
  }, []);

  // Stores
  const getStores = useCallback((): Store[] => {
    return localStorageService.getStores();
  }, []);

  const getStoresByUserId = useCallback((userId: number): Store[] => {
    return localStorageService.getStoresByUserId(userId);
  }, []);

  const getStoreById = useCallback((id: number): Store | null => {
    return localStorageService.getStoreById(id);
  }, []);

  const updateStore = useCallback((id: number, updates: Partial<Store>): Store | null => {
    return localStorageService.updateStore(id, updates);
  }, []);

  // Products
  const getProducts = useCallback((): Product[] => {
    return localStorageService.getProducts();
  }, []);

  const getProductById = useCallback((id: number): Product | null => {
    return localStorageService.getProductById(id);
  }, []);

  const getProductsByStoreId = useCallback((storeId: number): Product[] => {
    return localStorageService.getProductsByStoreId(storeId);
  }, []);

  const updateProduct = useCallback((id: number, updates: Partial<Product>): Product | null => {
    return localStorageService.updateProduct(id, updates);
  }, []);

  return {
    isInitialized,
    // Users
    getUsers,
    getUserById,
    getUserByUsername,
    getAuthenticatedUser,
    // Stores
    getStores,
    getStoresByUserId,
    getStoreById,
    updateStore,
    // Products
    getProducts,
    getProductById,
    getProductsByStoreId,
    updateProduct,

    // Current User Session
    setCurrentUserId,
    getCurrentUserId,
    getCurrentUser,
  };
};