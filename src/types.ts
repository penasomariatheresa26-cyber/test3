export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'meals' | 'drinks' | 'desserts' | 'sides';
  available: boolean;
  featured?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  customerName: string;
  address: string;
  phone: string;
  paymentMethod: string;
  createdAt: string;
}
