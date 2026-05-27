import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { MenuItem, CartItem, Order } from './types';
import { menuApi, ordersApi, healthApi, usersApi, ApiDbUser } from './lib/api';

// ============================================
// DEFAULT DATA (offline fallback only)
// ============================================
const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Grilled Chicken Platter', description: 'Tender grilled chicken breast served with roasted vegetables, garlic mashed potatoes, and our signature herb sauce.', price: 259, image: '/images/food-1.jpg', category: 'meals', available: true, featured: true },
  { id: '2', name: 'Classic Beef Burger', description: 'Juicy beef patty with lettuce, tomato, pickles, and special sauce on a toasted brioche bun. Served with crispy fries.', price: 199, image: '/images/food-2.jpg', category: 'meals', available: true, featured: true },
  { id: '3', name: 'Pasta Pomodoro', description: 'Al dente spaghetti tossed in a rich tomato basil sauce with fresh parmesan cheese and aromatic Italian herbs.', price: 175, image: '/images/food-3.jpg', category: 'meals', available: true, featured: true },
  { id: '4', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a molten center, topped with fresh berries and a dusting of powdered sugar.', price: 145, image: '/images/food-4.jpg', category: 'desserts', available: true, featured: true },
  { id: '5', name: 'Shrimp Salad', description: 'Fresh mixed greens with grilled shrimp, cherry tomatoes, and citrus vinaigrette dressing.', price: 185, image: '/images/food-5.jpg', category: 'meals', available: true },
  { id: '6', name: 'Iced Coffee Frappe', description: 'Blended iced coffee with milk, caramel drizzle, and whipped cream.', price: 85, image: '/images/food-6.jpg', category: 'drinks', available: true },
  { id: '7', name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt, honey, and ice. Naturally sweet and refreshing.', price: 75, image: '/images/food-6.jpg', category: 'drinks', available: true },
  { id: '8', name: 'Garlic Bread Basket', description: 'Warm garlic bread toasted to perfection with butter, garlic, and fresh parsley.', price: 65, image: '/images/food-2.jpg', category: 'sides', available: true },
  { id: '9', name: 'Leche Flan', description: 'Classic Filipino custard dessert with caramelized sugar topping. Smooth and creamy.', price: 95, image: '/images/food-4.jpg', category: 'desserts', available: true },
  { id: '10', name: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan cheese, croutons, and creamy Caesar dressing.', price: 125, image: '/images/food-5.jpg', category: 'sides', available: true },
  { id: '11', name: 'Calamansi Juice', description: 'Freshly squeezed calamansi juice with a hint of honey. Served ice cold.', price: 45, image: '/images/food-6.jpg', category: 'drinks', available: true },
  { id: '12', name: 'Pork BBQ Platter', description: 'Slow-cooked pork BBQ skewers glazed with house-made sweet BBQ sauce, served with java rice.', price: 189, image: '/images/food-1.jpg', category: 'meals', available: true },
];

// ============================================
// TYPES
// ============================================
export interface RegisteredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  walletBalance: number;
  createdAt: string;
}

interface AppState {
  menuItems: MenuItem[];
  cart: CartItem[];
  orders: Order[];
  isAdmin: boolean;
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userId: string | null;
  registeredUsers: RegisteredUser[];
  dbUsers: ApiDbUser[];
  isLoading: boolean;
  isOnline: boolean;
}

type Action =
  | { type: 'SET_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_DB_USERS'; payload: ApiDbUser[] }
  | { type: 'ADD_TO_CART'; payload: MenuItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM'; payload: string }
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: Order['status'] } }
  | { type: 'REGISTER_USER'; payload: RegisteredUser }
  | { type: 'LOGIN'; payload: { name: string; isAdmin: boolean; userId: string; email: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'TOGGLE_USER_ADMIN'; payload: { id: string; isAdmin: boolean } };

// Default admin for offline fallback
const DEFAULT_ADMIN: RegisteredUser = {
  id: 'admin-default', email: 'admin@theresse.com', password: 'admin123',
  name: 'Admin', isAdmin: true, walletBalance: 0, createdAt: '2025-01-01T00:00:00.000Z',
};

function loadLocalUsers(): RegisteredUser[] {
  try {
    const s = localStorage.getItem('theresse_users');
    if (s) {
      const u: RegisteredUser[] = JSON.parse(s);
      if (!u.some(x => x.id === DEFAULT_ADMIN.id)) return [DEFAULT_ADMIN, ...u];
      return u;
    }
  } catch (e) { /* */ }
  return [DEFAULT_ADMIN];
}

function saveLocalUsers(u: RegisteredUser[]) {
  localStorage.setItem('theresse_users', JSON.stringify(u));
}

const initialState: AppState = {
  menuItems: defaultMenuItems,
  cart: [],
  orders: [],
  isAdmin: false,
  isLoggedIn: false,
  userName: '',
  userEmail: '',
  userId: null,
  registeredUsers: loadLocalUsers(),
  dbUsers: [],
  isLoading: false,
  isOnline: false,
};

// ============================================
// REDUCER
// ============================================
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MENU_ITEMS':
      return { ...state, menuItems: action.payload.length > 0 ? action.payload : defaultMenuItems };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_DB_USERS':
      return { ...state, dbUsers: action.payload };
    case 'ADD_TO_CART': {
      const ex = state.cart.find(i => i.menuItem.id === action.payload.id);
      if (ex) return { ...state, cart: state.cart.map(i => i.menuItem.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i) };
      return { ...state, cart: [...state.cart, { menuItem: action.payload, quantity: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.menuItem.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
      if (action.payload.quantity <= 0) return { ...state, cart: state.cart.filter(i => i.menuItem.id !== action.payload.id) };
      return { ...state, cart: state.cart.map(i => i.menuItem.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i) };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'ADD_MENU_ITEM':
      return { ...state, menuItems: [...state.menuItems, action.payload] };
    case 'UPDATE_MENU_ITEM':
      return { ...state, menuItems: state.menuItems.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_MENU_ITEM':
      return { ...state, menuItems: state.menuItems.filter(i => i.id !== action.payload) };
    case 'PLACE_ORDER':
      return { ...state, orders: [action.payload, ...state.orders], cart: [] };
    case 'UPDATE_ORDER_STATUS':
      return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? { ...o, status: action.payload.status } : o) };
    case 'REGISTER_USER': {
      const upd = [...state.registeredUsers, action.payload];
      saveLocalUsers(upd);
      return { ...state, registeredUsers: upd };
    }
    case 'LOGIN':
      return { ...state, isLoggedIn: true, userName: action.payload.name, userEmail: action.payload.email, isAdmin: action.payload.isAdmin, userId: action.payload.userId };
    case 'LOGOUT':
      return { ...state, isLoggedIn: false, userName: '', userEmail: '', isAdmin: false, cart: [], userId: null };
    case 'DELETE_USER': {
      const f = state.registeredUsers.filter(u => u.id !== action.payload);
      saveLocalUsers(f);
      return { ...state, registeredUsers: f, dbUsers: state.dbUsers.filter(u => u.id !== action.payload) };
    }
    case 'TOGGLE_USER_ADMIN': {
      const t = state.registeredUsers.map(u => u.id === action.payload.id ? { ...u, isAdmin: action.payload.isAdmin } : u);
      saveLocalUsers(t);
      return { ...state, registeredUsers: t, dbUsers: state.dbUsers.map(u => u.id === action.payload.id ? { ...u, is_admin: action.payload.isAdmin } : u) };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Database-connected functions
  refreshMenu: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  addMenuItemToDb: (item: MenuItem) => Promise<void>;
  updateMenuItemInDb: (item: MenuItem) => Promise<void>;
  deleteMenuItemFromDb: (id: string) => Promise<void>;
  updateOrderStatusInDb: (orderId: string, status: Order['status']) => Promise<void>;
  placeOrderInDb: (order: Omit<Order, 'id' | 'createdAt' | 'items'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ========== REFRESH: Fetch latest from Aiven DB ==========

  const refreshMenu = useCallback(async () => {
    try {
      const items = await menuApi.getAll();
      if (items.length > 0) dispatch({ type: 'SET_MENU_ITEMS', payload: items });
    } catch (e) { console.log('Menu refresh failed, using local data'); }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!state.userId) return;
    try {
      const orders = await ordersApi.getAll(state.userId, state.isAdmin);
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (e) { console.log('Orders refresh failed'); }
  }, [state.userId, state.isAdmin]);

  const refreshUsers = useCallback(async () => {
    try {
      const users = await usersApi.getAll();
      dispatch({ type: 'SET_DB_USERS', payload: users });
    } catch (e) { console.log('Users refresh failed'); }
  }, []);

  // ========== MENU: Write to DB then refresh ==========

  const addMenuItemToDb = async (item: MenuItem) => {
    dispatch({ type: 'ADD_MENU_ITEM', payload: item }); // optimistic
    if (state.isOnline) {
      try {
        await menuApi.create({ ...item, featured: item.featured ?? false });
        await refreshMenu(); // re-fetch from DB
      } catch (e) { console.error('Failed to add menu item to DB:', e); }
    }
  };

  const updateMenuItemInDb = async (item: MenuItem) => {
    dispatch({ type: 'UPDATE_MENU_ITEM', payload: item }); // optimistic
    if (state.isOnline) {
      try {
        await menuApi.update(item.id, item);
        await refreshMenu(); // re-fetch from DB
      } catch (e) { console.error('Failed to update menu item in DB:', e); }
    }
  };

  const deleteMenuItemFromDb = async (id: string) => {
    dispatch({ type: 'DELETE_MENU_ITEM', payload: id }); // optimistic
    if (state.isOnline) {
      try {
        await menuApi.delete(id);
        await refreshMenu(); // re-fetch from DB
      } catch (e) { console.error('Failed to delete menu item from DB:', e); }
    }
  };

  // ========== ORDERS: Write to DB then refresh ==========

  const updateOrderStatusInDb = async (orderId: string, status: Order['status']) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: orderId, status } }); // optimistic
    if (state.isOnline) {
      try {
        await ordersApi.updateStatus(orderId, status);
        await refreshOrders(); // re-fetch from DB
      } catch (e) { console.error('Failed to update order status in DB:', e); }
    }
  };

  const placeOrderInDb = async (orderData: Omit<Order, 'id' | 'createdAt' | 'items'>) => {
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const order: Order = {
      ...orderData,
      id: orderId,
      items: [...state.cart],
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'PLACE_ORDER', payload: order }); // optimistic

    if (state.isOnline && state.userId) {
      try {
        await ordersApi.create({
          id: orderId,
          user_id: state.userId,
          customer_name: orderData.customerName,
          address: orderData.address,
          phone: orderData.phone,
          payment_method: orderData.paymentMethod,
          total: orderData.total,
          items: state.cart.map(i => ({
            menuItem: { ...i.menuItem, featured: i.menuItem.featured ?? false },
            quantity: i.quantity,
          })),
        });
        // Re-fetch orders from DB after placing
        setTimeout(() => refreshOrders(), 500);
      } catch (e) { console.error('Failed to save order to DB:', e); }
    }
  };

  // ========== STARTUP: Check DB connection, load data ==========

  useEffect(() => {
    const init = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const health = await healthApi.check();
        const online = health.database === 'connected';
        dispatch({ type: 'SET_ONLINE', payload: online });

        if (online) {
          await refreshMenu();
          console.log('✅ Connected to Aiven — data loaded from database');
        }
      } catch (e) {
        dispatch({ type: 'SET_ONLINE', payload: false });
        console.log('⚠️ Offline mode — using local data');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    init();
  }, [refreshMenu]);

  // ========== SYNC: When user logs in, fetch their data ==========

  useEffect(() => {
    if (state.isLoggedIn && state.userId && state.isOnline) {
      refreshOrders();
      if (state.isAdmin) refreshUsers();
    }
  }, [state.isLoggedIn, state.userId, state.isOnline, state.isAdmin, refreshOrders, refreshUsers]);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      refreshMenu, refreshOrders, refreshUsers,
      addMenuItemToDb, updateMenuItemInDb, deleteMenuItemFromDb,
      updateOrderStatusInDb, placeOrderInDb,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
