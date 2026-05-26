import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CartItem } from '../../../models/cartItem.models';
import { Product } from '../../../models/product.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/pos/sales';

  // --- ESTADO REACTIVO (SIGNALS) ---
  
  // La lista de productos en el carrito. Inicia como un arreglo vacío.
  public cart = signal<CartItem[]>([]);

  // 🔥 MAGIA DE ANGULAR 18: Esta variable calcula el total sola.
  // Solo se recalcula si la signal 'cart' sufre algún cambio.
  public total = computed(() => {
    return this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  });

  // --- MÉTODOS DEL CARRITO ---

  addProduct(product: Product) {
    this.cart.update(items => {
      // ¿El producto ya está en el carrito?
      const existingItem = items.find(i => i.product.id === product.id);
      
      if (existingItem) {
        // Si existe, mapeamos el arreglo y le sumamos 1 a la cantidad
        return items.map(i => 
          i.product.id === product.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      // Si es nuevo, lo agregamos al final con cantidad 1
      return [...items, { product, quantity: 1 }];
    });
  }

  increaseQuantity(productId: string) {
    this.cart.update(items =>
      items.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      )
    );
  }

  decreaseQuantity(productId: string) {
    this.cart.update(items => {
      const currentItem = items.find(i => i.product.id === productId);
      
      if (currentItem && currentItem.quantity === 1) {
        // Si tiene 1 y le damos a restar, se elimina del carrito
        return items.filter(i => i.product.id !== productId);
      }
      
      // Si tiene más de 1, simplemente le restamos 1
      return items.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  }

  removeItem(productId: string) {
    this.cart.update(items => items.filter(item => item.product.id !== productId));
  }

  clearCart() {
    this.cart.set([]);
  }

  // --- CONEXIÓN CON SPRING BOOT ---

  processSale(method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'QR' | 'TRANSFER'): Observable<any> {
    // Armamos el Payload (JSON) que espera tu backend
    const saleRequest = {
      paymentMethod: method,
      totalAmount: this.total(),
      items: this.cart().map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price
      }))
    };

    return this.http.post(`${this.apiUrl}/checkout`, saleRequest);
  }
}
