import { useState, useCallback } from "react";

export function useCart() {
  const [cart, setCart] = useState<Record<number, number>>({});

  const addToCart = useCallback((productId: number) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: current - 1 };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  return { cart, addToCart, removeFromCart, clearCart };
}
