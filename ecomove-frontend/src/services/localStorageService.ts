// src/services/localStorageService.ts
export interface SavedCard {
  id: string;
  last4: string;
  brand: string; // 'visa', 'mastercard', 'amex'
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  stripePaymentMethodId?: string; // ID del método de pago en Stripe
  createdAt: string;
}

class LocalStorageService {
  private readonly CARDS_KEY = 'ecomove_saved_cards';
  private readonly USER_PREFIX = 'user_';

  /**
   * Obtener clave única por usuario
   */
  private getUserKey(): string {
    try {
      const userString = localStorage.getItem('ecomove_user');
      if (!userString) return this.CARDS_KEY;
      
      const user = JSON.parse(userString);
      return `${this.CARDS_KEY}_${this.USER_PREFIX}${user.id}`;
    } catch {
      return this.CARDS_KEY;
    }
  }

  /**
   * Obtener todas las tarjetas guardadas del usuario
   */
  getSavedCards(): SavedCard[] {
    try {
      const key = this.getUserKey();
      const cardsString = localStorage.getItem(key);
      if (!cardsString) return [];
      
      return JSON.parse(cardsString);
    } catch (error) {
      console.error('Error al obtener tarjetas guardadas:', error);
      return [];
    }
  }

  /**
   * Guardar nueva tarjeta
   */
  saveCard(card: Omit<SavedCard, 'id' | 'createdAt'>): SavedCard {
    try {
      const cards = this.getSavedCards();
      
      // Si es la primera tarjeta o se marca como default, desmarcar otras
      if (card.isDefault) {
        cards.forEach(c => c.isDefault = false);
      }
      
      const newCard: SavedCard = {
        ...card,
        id: this.generateCardId(),
        createdAt: new Date().toISOString()
      };
      
      cards.push(newCard);
      
      const key = this.getUserKey();
      localStorage.setItem(key, JSON.stringify(cards));
      
      return newCard;
    } catch (error) {
      console.error('Error al guardar tarjeta:', error);
      throw new Error('No se pudo guardar la tarjeta');
    }
  }

  /**
   * Actualizar tarjeta existente
   */
  updateCard(cardId: string, updates: Partial<SavedCard>): void {
    try {
      const cards = this.getSavedCards();
      const index = cards.findIndex(c => c.id === cardId);
      
      if (index === -1) {
        throw new Error('Tarjeta no encontrada');
      }
      
      // Si se marca como default, desmarcar otras
      if (updates.isDefault) {
        cards.forEach(c => c.isDefault = false);
      }
      
      cards[index] = { ...cards[index], ...updates };
      
      const key = this.getUserKey();
      localStorage.setItem(key, JSON.stringify(cards));
    } catch (error) {
      console.error('Error al actualizar tarjeta:', error);
      throw error;
    }
  }

  /**
   * Eliminar tarjeta
   */
  deleteCard(cardId: string): void {
    try {
      let cards = this.getSavedCards();
      const cardToDelete = cards.find(c => c.id === cardId);
      
      cards = cards.filter(c => c.id !== cardId);
      
      // Si se eliminó la tarjeta default y hay otras, hacer la primera default
      if (cardToDelete?.isDefault && cards.length > 0) {
        cards[0].isDefault = true;
      }
      
      const key = this.getUserKey();
      localStorage.setItem(key, JSON.stringify(cards));
    } catch (error) {
      console.error('Error al eliminar tarjeta:', error);
      throw error;
    }
  }

  /**
   * Obtener tarjeta por defecto
   */
  getDefaultCard(): SavedCard | null {
    const cards = this.getSavedCards();
    return cards.find(c => c.isDefault) || cards[0] || null;
  }

  /**
   * Obtener tarjeta por ID
   */
  getCardById(cardId: string): SavedCard | null {
    const cards = this.getSavedCards();
    return cards.find(c => c.id === cardId) || null;
  }

  /**
   * Establecer tarjeta como default
   */
  setDefaultCard(cardId: string): void {
    try {
      const cards = this.getSavedCards();
      
      cards.forEach(card => {
        card.isDefault = card.id === cardId;
      });
      
      const key = this.getUserKey();
      localStorage.setItem(key, JSON.stringify(cards));
    } catch (error) {
      console.error('Error al establecer tarjeta default:', error);
      throw error;
    }
  }

  /**
   * Limpiar todas las tarjetas del usuario
   */
  clearAllCards(): void {
    try {
      const key = this.getUserKey();
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al limpiar tarjetas:', error);
    }
  }

  /**
   * Generar ID único para tarjeta
   */
  private generateCardId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validar si una tarjeta está expirada
   */
  isCardExpired(card: SavedCard): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const cardYear = parseInt(`20${card.expiryYear}`);
    const cardMonth = parseInt(card.expiryMonth);
    
    if (cardYear < currentYear) return true;
    if (cardYear === currentYear && cardMonth < currentMonth) return true;
    
    return false;
  }

  /**
   * Obtener marca de la tarjeta desde el número
   */
  getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    // Visa
    if (/^4/.test(cleaned)) return 'visa';
    
    // Mastercard
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    
    // American Express
    if (/^3[47]/.test(cleaned)) return 'amex';
    
    // Discover
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    
    return 'unknown';
  }

  /**
   * Validar número de tarjeta (algoritmo de Luhn)
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (!/^\d+$/.test(cleaned)) return false;
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Formatear número de tarjeta para mostrar
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Obtener últimos 4 dígitos
   */
  getLast4Digits(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.slice(-4);
  }
}

export const localStorageService = new LocalStorageService();