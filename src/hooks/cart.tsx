import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsResponse = await AsyncStorage.getItem('@cart_products');

      if (productsResponse) {
        setProducts(JSON.parse(productsResponse));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productAlreadyInCart = products.findIndex(
        item => item.id === product.id,
      );

      if (productAlreadyInCart !== -1) {
        products[productAlreadyInCart].quantity += 1;
        setProducts(products);
      } else {
        const cartProduct = { ...product, quantity: 1 };
        setProducts([...products, cartProduct]);
      }
      await AsyncStorage.setItem('@cart_products', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );

      setProducts(newProducts);
      await AsyncStorage.setItem('@cart_products', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(item =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter(item => item.quantity > 0);

      setProducts(newProducts);
      await AsyncStorage.setItem('@cart_products', JSON.stringify(newProducts));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
