import React, { useEffect, useState } from 'react';
import MenuCard from '../components/MenuCard';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  featured: boolean;
}

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu'); // your backend route
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: MenuItem[] = await res.json();
        setMenuItems(data);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Failed to load menu items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  if (loading) return <p className="text-center py-10">Loading menu...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <div className="menu-page container mx-auto py-10">
      {menuItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <MenuCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <p className="text-center py-10">No menu items available.</p>
      )}
    </div>
  );
};

export default MenuPage;
