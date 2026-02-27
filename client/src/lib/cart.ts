import { useSyncExternalStore, useCallback } from "react";

type Cart = Record<number, number>;
type Listener = () => void;

let cart: Cart = {};
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(): Cart {
  return cart;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function addToCartGlobal(productId: number) {
  cart = { ...cart, [productId]: (cart[productId] || 0) + 1 };
  emitChange();
}

function removeFromCartGlobal(productId: number) {
  const current = cart[productId] || 0;
  if (current <= 1) {
    const next = { ...cart };
    delete next[productId];
    cart = next;
  } else {
    cart = { ...cart, [productId]: current - 1 };
  }
  emitChange();
}

function clearCartGlobal() {
  cart = {};
  emitChange();
}

export function useCart() {
  const currentCart = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addToCart = useCallback((productId: number) => {
    addToCartGlobal(productId);
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    removeFromCartGlobal(productId);
  }, []);

  const clearCart = useCallback(() => {
    clearCartGlobal();
  }, []);

  return { cart: currentCart, addToCart, removeFromCart, clearCart };
}
