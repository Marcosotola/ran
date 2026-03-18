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
  pricePerBox: number; // ARS
  pricePerM2: number; // ARS
  m2PerBox: number;
  piecesPerBox: number;
  weight?: number; // kg per box
  sku?: string;
  isActive: boolean;
  createdBy: string; // uid
  updatedAt: Date;
  tags?: string[];
  isFeatured?: boolean;
  isOffer?: boolean;
}

// ----- Quotes -----
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteItem {
  productId: string;
  name: string;
  size: string;
  m2: number;
  boxes: number; // ceil(m2 / m2PerBox * 1.1) — 10% waste
  pricePerBox: number;
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
  createdAt: Date;
  acceptedAt?: Date;
}

// ----- Chat -----
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: Date;
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
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  instagram?: string;
  facebook?: string;
  whatsapp: string;
  workingHours?: string;
  googleMapsEmbed?: string;
}
