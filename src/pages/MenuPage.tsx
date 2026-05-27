// File: src/pages/MenuPage.tsx
import React, { useEffect, useState } from 'react';
import MenuCard from '../components/MenuCard'; // make sure the file is exactly MenuCard.tsx

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch menu:', err);
        setError('Unable to load menu.');
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center py-10">Loading menu...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <div className="menu-page container mx-auto py-10">
      {menuItems && menuItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <MenuCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <p className="text-center py-10">No menu items available.</p>
      )}
    </div>
  );
}
