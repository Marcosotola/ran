// ============================================================
// RAN Pisos & Revestimientos — Core TypeScript Types
// ============================================================

export type UserRole =
  | 'cliente'
  | 'vendedor'
  | 'contenido'
  | 'secretaria'
  | 'finanzas'
  | 'admin'
  | 'dev';

export interface RANUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
  isActive: boolean;
  fcmToken?: string;
  fcmTokens?: string[];
  fcmLastUpdated?: string;
  notificationsEnabled?: boolean;
}

// ----- Products -----
export type ProductCategory = 'pisos' | 'paredes' | 'ambos';
export type ProductFinish = 'Brillante' | 'Mate' | 'Pulido' | 'Rectificado' | 'Natural' | 'Otro';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  size: string; // e.g. "56x56", "31x53"
  finish: ProductFinish;
  description: string;
  images: string[]; // Firebase Storage URLs
  stock: number; // number of boxes in stock
  stockPallets?: number; // New field: Current stock in pallets
  pricePerBox: number; // ARS
  pricePerM2: number; // ARS
  m2PerBox: number;
  m2PerPallet?: number; // New field
  piecesPerBox: number;
  weight?: number; // kg per box
  sku?: string;
  isActive: boolean;
  createdBy: string; // uid
  updatedAt: Date;
  tags?: string[];
  isFeatured?: boolean;
  isOffer?: boolean;
  isOfferM2?: boolean;
}

// ----- Quotes -----
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteItem {
  productId: string;
  name: string;
  size: string;
  m2: number;
  pallets?: number; // New field
  boxes: number; // ceil(m2 / m2PerBox * 1.1) — 10% waste
  pricePerBox: number;
  pricePerM2?: number; // New field
  subtotal: number;
}

export interface Quote {
  id: string;
  clientId?: string;
  clientName?: string; // only filled after acceptance
  clientEmail?: string;
  clientPhone?: string;
  items: QuoteItem[];
  totalMaterials: number;
  grandTotal: number;
  status: QuoteStatus;
  assignedVendorId?: string;
  aiConversationLog: ChatMessage[];
  shipping?: number;
  notes?: string;
  createdAt: Date;
  acceptedAt?: Date;
}

// ----- Chat -----
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
  userMeta?: string; // Optional field for tracking specific interactions (e.g. productId)
}

export interface ChatSession {
  id: string;
  userId: string; // uid or "anonymous_" + session
  messages: ChatMessage[];
  quoteId?: string;
  createdAt: Date;
}

// ----- Sales -----
export type SaleStatus = 'pending' | 'partial' | 'paid' | 'delivered';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito' | 'cheque';

export interface Sale {
  id: string;
  quoteId?: string;
  clientId: string;
  clientName: string;
  vendorId: string;
  items: QuoteItem[];
  totalAmount: number;
  shipping?: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  createdAt: Date;
  deliveredAt?: Date;
}

// ----- Finance -----
export type ExpenseCategory =
  | 'proveedores'
  | 'operativo'
  | 'sueldos'
  | 'impuestos'
  | 'mantenimiento'
  | 'marketing'
  | 'otro';

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  registeredBy: string;
}

// ----- Stock -----
export type StockMovementType = 'in' | 'out' | 'adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number; // boxes
  reason: string;
  date: Date;
  registeredBy: string;
}

// ----- Subscription -----
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'pending';

export interface Subscription {
  status: SubscriptionStatus;
  mpPreapprovalId?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  amount: number; // ARS
  checkoutUrl?: string; // Link de pago inicial
  managementUrl?: string; // Link para gestionar suscripción (Baja/Cambios)
}

export interface ContactInfo {
  phone: string;
  email: string;
  emailAdmin?: string;
  emailSales?: string;
  address: string;
  instagram?: string;
  facebook?: string;
  whatsapp: string;
  workingHours?: string;
  googleMapsEmbed?: string;
}
