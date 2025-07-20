import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  deleteDoc,
  limit,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { logActivity } from './analyticsService';
import { createNotification } from './notificationService';
import { getPatientInsurance } from './insuranceService';

// Billing interfaces
export interface BillingItem {
  id: string;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'imaging' | 'other';
  taxable: boolean;
  discountAmount?: number;
  discountReason?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'insurance' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  processedBy?: string; // userId
  processedAt: Timestamp;
}

export interface Invoice {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  invoiceNumber: string;
  items: BillingItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate: Timestamp;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  payments: Payment[];
  insuranceClaim?: {
    claimId?: string;
    status: 'not_submitted' | 'submitted' | 'in_progress' | 'approved' | 'partially_approved' | 'denied';
    approvedAmount?: number;
    denialReason?: string;
  };
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  issuedAt?: Timestamp;
  paidAt?: Timestamp;
}

// Create a new invoice
export const createInvoice = async (
  patientId: string,
  doctorId: string,
  items: Omit<BillingItem, 'id'>[],
  taxRate: number = 0,
  discountAmount: number = 0,
  dueDate: Date,
  appointmentId?: string,
  notes?: string
): Promise<string> => {
  try {
    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    
    // Get count of invoices for today to generate unique number
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const existingInvoicesQuery = query(
      collection(db, 'invoices'),
      where('createdAt', '>=', Timestamp.fromDate(todayStart)),
      where('createdAt', '<=', Timestamp.fromDate(todayEnd))
    );
    
    const existingInvoicesSnapshot = await getDocs(existingInvoicesQuery);
    const invoiceCount = existingInvoicesSnapshot.size + 1;
    
    const invoiceNumber = `INV-${dateStr}-${invoiceCount.toString().padStart(4, '0')}`;
    
    // Prepare items with IDs and calculate totals
    const itemsWithIds: BillingItem[] = [];
    let subtotal = 0;
    
    items.forEach(item => {
      const totalPrice = item.unitPrice * item.quantity - (item.discountAmount || 0);
      subtotal += totalPrice;
      
      itemsWithIds.push({
        ...item,
        id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        totalPrice
      });
    });
    
    // Calculate tax and total
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    const invoiceData: Omit<Invoice, 'id'> = {
      patientId,
      doctorId,
      appointmentId,
      invoiceNumber,
      items: itemsWithIds,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      dueDate: Timestamp.fromDate(dueDate),
      status: 'draft',
      payments: [],
      insuranceClaim: {
        status: 'not_submitted'
      },
      notes,
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp
    };
    
    const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);
    
    // Log activity
    await logActivity(
      doctorId,
      'doctor',
      'create',
      'medical-record',
      invoiceRef.id,
      JSON.stringify({ patientId, invoiceNumber, totalAmount })
    );
    
    return invoiceRef.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// Get an invoice by ID
export const getInvoice = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      return null;
    }
    
    return {
      id: invoiceDoc.id,
      ...invoiceDoc.data()
    } as Invoice;
  } catch (error) {
    console.error('Error getting invoice:', error);
    throw error;
  }
};

// Get an invoice by invoice number
export const getInvoiceByNumber = async (invoiceNumber: string): Promise<Invoice | null> => {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('invoiceNumber', '==', invoiceNumber),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    
    return {
      id: doc.id,
      ...doc.data()
    } as Invoice;
  } catch (error) {
    console.error('Error getting invoice by number:', error);
    throw error;
  }
};

// Get all invoices for a patient
export const getPatientInvoices = async (patientId: string): Promise<Invoice[]> => {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const invoices: Invoice[] = [];
    
    querySnapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...doc.data()
      } as Invoice);
    });
    
    return invoices;
  } catch (error) {
    console.error('Error getting patient invoices:', error);
    throw error;
  }
};

// Get invoices created by a doctor
export const getDoctorInvoices = async (doctorId: string): Promise<Invoice[]> => {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const invoices: Invoice[] = [];
    
    querySnapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...doc.data()
      } as Invoice);
    });
    
    return invoices;
  } catch (error) {
    console.error('Error getting doctor invoices:', error);
    throw error;
  }
};

// Get invoices by status
export const getInvoicesByStatus = async (status: Invoice['status']): Promise<Invoice[]> => {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const invoices: Invoice[] = [];
    
    querySnapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...doc.data()
      } as Invoice);
    });
    
    return invoices;
  } catch (error) {
    console.error('Error getting invoices by status:', error);
    throw error;
  }
};

// Get overdue invoices
export const getOverdueInvoices = async (): Promise<Invoice[]> => {
  try {
    const today = Timestamp.now();
    
    const q = query(
      collection(db, 'invoices'),
      where('dueDate', '<', today),
      where('status', 'in', ['issued', 'partially_paid']),
      orderBy('dueDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const invoices: Invoice[] = [];
    
    querySnapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...doc.data()
      } as Invoice);
    });
    
    return invoices;
  } catch (error) {
    console.error('Error getting overdue invoices:', error);
    throw error;
  }
};

// Update an invoice
export const updateInvoice = async (
  invoiceId: string,
  updates: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>>
): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    
    // Prevent updating if invoice is already paid or cancelled
    if (['paid', 'cancelled', 'refunded'].includes(invoiceData.status) && updates.items) {
      throw new Error('Cannot update items on a paid, cancelled, or refunded invoice');
    }
    
    // Recalculate totals if items are updated
    if (updates.items) {
      let subtotal = 0;
      updates.items.forEach(item => {
        subtotal += item.totalPrice;
      });
      
      const taxRate = updates.taxRate !== undefined ? updates.taxRate : invoiceData.taxRate;
      const discountAmount = updates.discountAmount !== undefined ? updates.discountAmount : invoiceData.discountAmount;
      
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount - discountAmount;
      
      updates.subtotal = subtotal;
      updates.taxAmount = taxAmount;
      updates.totalAmount = totalAmount;
      updates.amountDue = totalAmount - invoiceData.amountPaid;
    }
    
    // Prepare the update object
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'invoices', invoiceId), updateData);
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({ patientId: invoiceData.patientId, invoiceNumber: invoiceData.invoiceNumber, updates: Object.keys(updates) })
    );
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Issue an invoice (change status from draft to issued)
export const issueInvoice = async (invoiceId: string): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    
    // Check if invoice is in draft status
    if (invoiceData.status !== 'draft') {
      throw new Error('Only draft invoices can be issued');
    }
    
    // Update the invoice status
    await updateDoc(doc(db, 'invoices', invoiceId), {
      status: 'issued',
      issuedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({
        patientId: invoiceData.patientId,
        invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        totalAmount: invoiceData.totalAmount
      })
    );
    
    // Create notification for the patient
    await createNotification(
      invoiceData.patientId,
      'New Invoice Issued',
      `A new invoice (${invoiceData.invoiceNumber}) has been issued for $${invoiceData.totalAmount.toFixed(2)}.`,
      'info'
    );
  } catch (error) {
    console.error('Error issuing invoice:', error);
    throw error;
  }
};

// Cancel an invoice
export const cancelInvoice = async (invoiceId: string, reason: string): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    
    // Check if invoice can be cancelled
    if (['paid', 'cancelled', 'refunded'].includes(invoiceData.status)) {
      throw new Error(`Cannot cancel an invoice with status: ${invoiceData.status}`);
    }
    
    // Update the invoice status
    await updateDoc(doc(db, 'invoices', invoiceId), {
      status: 'cancelled',
      notes: `${invoiceData.notes || ''} \n\nCancellation reason: ${reason}`,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({ patientId: invoiceData.patientId, invoiceNumber: invoiceData.invoiceNumber, reason, status: 'cancelled' })
    );
    
    // Create notification for the patient
    await createNotification(
      invoiceData.patientId,
      'Invoice Cancelled',
      `Invoice ${invoiceData.invoiceNumber} has been cancelled. Reason: ${reason}`,
      'info'
    );
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    throw error;
  }
};

// Record a payment for an invoice
export const recordPayment = async (
  invoiceId: string,
  amount: number,
  method: Payment['method'],
  processedBy: string,
  transactionId?: string,
  notes?: string
): Promise<string> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data() as Invoice;
    
    // Check if invoice can accept payments
    if (!['issued', 'partially_paid', 'overdue'].includes(invoiceData.status)) {
      throw new Error(`Cannot record payment for an invoice with status: ${invoiceData.status}`);
    }
    
    // Check if payment amount is valid
    if (amount <= 0 || amount > invoiceData.amountDue) {
      throw new Error(`Invalid payment amount. Amount must be between 0 and ${invoiceData.amountDue}`);
    }
    
    // Generate receipt number
    const receiptNumber = `RCPT-${Date.now().toString().substring(0, 10)}`;
    
    // Create payment object
    const payment: Payment = {
      id: `payment_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount,
      method,
      status: 'completed',
      transactionId,
      receiptNumber,
      notes,
      processedBy,
      processedAt: Timestamp.now()
    };
    
    // Update invoice with payment
    const payments = [...invoiceData.payments, payment];
    const amountPaid = invoiceData.amountPaid + amount;
    const amountDue = invoiceData.totalAmount - amountPaid;
    
    // Determine new status
    let status: Invoice['status'];
    if (amountDue <= 0) {
      status = 'paid';
    } else if (amountPaid > 0) {
      status = 'partially_paid';
    } else {
      status = invoiceData.status;
    }
    
    await updateDoc(doc(db, 'invoices', invoiceId), {
      payments,
      amountPaid,
      amountDue,
      status,
      paidAt: amountDue <= 0 ? serverTimestamp() : invoiceData.paidAt,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      processedBy,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({ patientId: invoiceData.patientId, invoiceNumber: invoiceData.invoiceNumber, paymentId: payment.id, amount, method })
    );
    
    // Create notification for the patient
    await createNotification(
      invoiceData.patientId,
      'Payment Recorded',
      `A payment of $${amount.toFixed(2)} has been recorded for invoice ${invoiceData.invoiceNumber}.`,
      'success'
    );
    
    return payment.id;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Void a payment
export const voidPayment = async (
  invoiceId: string,
  paymentId: string,
  reason: string
): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data() as Invoice;
    
    // Find the payment
    const paymentIndex = invoiceData.payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex === -1) {
      throw new Error('Payment not found in invoice');
    }
    
    const payment = invoiceData.payments[paymentIndex];
    
    // Check if payment can be voided
    if (payment.status !== 'completed') {
      throw new Error(`Cannot void a payment with status: ${payment.status}`);
    }
    
    // Update payment status
    payment.status = 'refunded';
    payment.notes = `${payment.notes || ''} \n\nVoid reason: ${reason}`;
    
    // Update invoice
    const amountPaid = invoiceData.amountPaid - payment.amount;
    const amountDue = invoiceData.totalAmount - amountPaid;
    
    // Determine new status
    let status: Invoice['status'];
    if (amountPaid <= 0) {
      status = 'issued';
    } else if (amountPaid < invoiceData.totalAmount) {
      status = 'partially_paid';
    } else {
      status = 'paid';
    }
    
    await updateDoc(doc(db, 'invoices', invoiceId), {
      payments: invoiceData.payments,
      amountPaid,
      amountDue,
      status,
      paidAt: amountPaid >= invoiceData.totalAmount ? invoiceData.paidAt : null,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({
        patientId: invoiceData.patientId,
        invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        paymentId,
        amount: payment.amount,
        reason
      })
    );
    
    // Create notification for the patient
    await createNotification(
      invoiceData.patientId,
      'Payment Voided',
      `A payment of $${payment.amount.toFixed(2)} for invoice ${invoiceData.invoiceNumber} has been voided.`,
      'warning'
    );
  } catch (error) {
    console.error('Error voiding payment:', error);
    throw error;
  }
};

// Submit an invoice to insurance
export const submitInvoiceToInsurance = async (
  invoiceId: string,
  insuranceClaimId: string
): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    
    // Check if invoice can be submitted to insurance
    if (!['issued', 'partially_paid', 'overdue'].includes(invoiceData.status)) {
      throw new Error(`Cannot submit to insurance an invoice with status: ${invoiceData.status}`);
    }
    
    // Update the invoice with insurance claim information
    await updateDoc(doc(db, 'invoices', invoiceId), {
      'insuranceClaim.claimId': insuranceClaimId,
      'insuranceClaim.status': 'submitted',
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({
        patientId: invoiceData.patientId,
        invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        insuranceClaimId
      })
    );
    
    // Create notification for the patient
    await createNotification(
      invoiceData.patientId,
      'Invoice Submitted to Insurance',
      `Invoice ${invoiceData.invoiceNumber} has been submitted to your insurance provider.`,
      'info'
    );
  } catch (error) {
    console.error('Error submitting invoice to insurance:', error);
    throw error;
  }
};

// Update insurance claim status
export const updateInsuranceClaimStatus = async (
  invoiceId: string,
  status: 'not_submitted' | 'submitted' | 'in_progress' | 'approved' | 'partially_approved' | 'denied',
  approvedAmount?: number,
  denialReason?: string
): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    
    // Check if invoice has an insurance claim
    if (!invoiceData.insuranceClaim || !invoiceData.insuranceClaim.claimId) {
      throw new Error('Invoice does not have an insurance claim');
    }
    
    // Prepare update object
    const updateData: Record<string, any> = {
      'insuranceClaim.status': status,
      updatedAt: serverTimestamp()
    };
    
    if (approvedAmount !== undefined) {
      updateData['insuranceClaim.approvedAmount'] = approvedAmount;
    }
    
    if (denialReason) {
      updateData['insuranceClaim.denialReason'] = denialReason;
    }
    
    // If claim is approved, record a payment from insurance
    if (status === 'approved' && approvedAmount && approvedAmount > 0) {
      // Get the current invoice with payments
      const fullInvoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
      const fullInvoiceData = fullInvoiceDoc.data() as Invoice;
      
      // Create payment object
      const payment: Payment = {
        id: `insurance_payment_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: approvedAmount,
        method: 'insurance',
        status: 'completed',
        transactionId: invoiceData.insuranceClaim.claimId,
        receiptNumber: `INS-${Date.now().toString().substring(0, 10)}`,
        notes: 'Payment from insurance claim',
        processedBy: invoiceData.doctorId,
        processedAt: Timestamp.now()
      };
      
      // Update invoice with payment
      const payments = [...fullInvoiceData.payments, payment];
      const amountPaid = fullInvoiceData.amountPaid + approvedAmount;
      const amountDue = fullInvoiceData.totalAmount - amountPaid;
      
      // Determine new status
      let invoiceStatus: Invoice['status'];
      if (amountDue <= 0) {
        invoiceStatus = 'paid';
      } else if (amountPaid > 0) {
        invoiceStatus = 'partially_paid';
      } else {
        invoiceStatus = fullInvoiceData.status;
      }
      
      updateData.payments = payments;
      updateData.amountPaid = amountPaid;
      updateData.amountDue = amountDue;
      updateData.status = invoiceStatus;
      
      if (amountDue <= 0) {
        updateData.paidAt = serverTimestamp();
      }
    }
    
    await updateDoc(doc(db, 'invoices', invoiceId), updateData);
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'update',
      'medical-record',
      invoiceId,
      JSON.stringify({
        patientId: invoiceData.patientId,
        invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        claimId: invoiceData.insuranceClaim.claimId,
        status,
        approvedAmount,
        denialReason
      })
    );
    
    // Create notification for the patient
    let notificationMessage = `Insurance claim for invoice ${invoiceData.invoiceNumber} has been ${status.replace('_', ' ')}.`;
    
    if (status === 'approved' && approvedAmount) {
      notificationMessage += ` Approved amount: $${approvedAmount.toFixed(2)}.`;
    } else if (status === 'partially_approved' && approvedAmount) {
      notificationMessage += ` Partially approved amount: $${approvedAmount.toFixed(2)}.`;
    } else if (status === 'denied' && denialReason) {
      notificationMessage += ` Reason: ${denialReason}.`;
    }
    
    await createNotification(
      invoiceData.patientId,
      'Insurance Claim Update',
      notificationMessage,
      status === 'approved' ? 'success' : status === 'denied' ? 'error' : 'info'
    );
  } catch (error) {
    console.error('Error updating insurance claim status:', error);
    throw error;
  }
};

// Get billing statistics
export const getBillingStatistics = async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  partiallyPaidInvoiceCount: number;
  overdueInvoiceCount: number;
  averageInvoiceAmount: number;
}> => {
  try {
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    const q = query(
      collection(db, 'invoices'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );
    
    const querySnapshot = await getDocs(q);
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let invoiceCount = 0;
    let paidInvoiceCount = 0;
    let partiallyPaidInvoiceCount = 0;
    let overdueInvoiceCount = 0;
    
    querySnapshot.forEach((doc) => {
      const invoice = doc.data() as Invoice;
      invoiceCount++;
      totalInvoiced += invoice.totalAmount;
      totalPaid += invoice.amountPaid;
      totalOutstanding += invoice.amountDue;
      
      if (invoice.status === 'paid') {
        paidInvoiceCount++;
      } else if (invoice.status === 'partially_paid') {
        partiallyPaidInvoiceCount++;
      } else if (invoice.status === 'overdue') {
        overdueInvoiceCount++;
      }
    });
    
    const averageInvoiceAmount = invoiceCount > 0 ? totalInvoiced / invoiceCount : 0;
    
    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      invoiceCount,
      paidInvoiceCount,
      partiallyPaidInvoiceCount,
      overdueInvoiceCount,
      averageInvoiceAmount
    };
  } catch (error) {
    console.error('Error getting billing statistics:', error);
    throw error;
  }
};

// Get patient billing summary
export const getPatientBillingSummary = async (patientId: string): Promise<{
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  overdueInvoiceCount: number;
  insuranceClaimCount: number;
  pendingInsuranceAmount: number;
}> => {
  try {
    const q = query(
      collection(db, 'invoices'),
      where('patientId', '==', patientId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let invoiceCount = 0;
    let overdueInvoiceCount = 0;
    let insuranceClaimCount = 0;
    let pendingInsuranceAmount = 0;
    
    const today = new Date();
    
    querySnapshot.forEach((doc) => {
      const invoice = doc.data() as Invoice;
      invoiceCount++;
      totalInvoiced += invoice.totalAmount;
      totalPaid += invoice.amountPaid;
      totalOutstanding += invoice.amountDue;
      
      // Check if overdue
      if (invoice.dueDate.toDate() < today && ['issued', 'partially_paid'].includes(invoice.status)) {
        overdueInvoiceCount++;
      }
      
      // Check insurance claims
      if (invoice.insuranceClaim && invoice.insuranceClaim.claimId) {
        insuranceClaimCount++;
        
        if (['submitted', 'in_progress'].includes(invoice.insuranceClaim.status)) {
          pendingInsuranceAmount += invoice.amountDue;
        }
      }
    });
    
    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      invoiceCount,
      overdueInvoiceCount,
      insuranceClaimCount,
      pendingInsuranceAmount
    };
  } catch (error) {
    console.error('Error getting patient billing summary:', error);
    throw error;
  }
};

// Check if patient has insurance coverage
export const checkInsuranceCoverage = async (patientId: string): Promise<boolean> => {
  try {
    // Get patient insurance information
    const patientInsurance = await getPatientInsurance(patientId);
    
    // Check if patient has active insurance
    return patientInsurance !== null && patientInsurance.status === 'active';
  } catch (error) {
    console.error('Error checking insurance coverage:', error);
    throw error;
  }
};

// Delete an invoice (only for draft invoices)
export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  try {
    // Get the current invoice
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }
    
    const invoiceData = invoiceDoc.data();
    
    // Check if invoice can be deleted
    if (invoiceData.status !== 'draft') {
      throw new Error('Only draft invoices can be deleted');
    }
    
    await deleteDoc(doc(db, 'invoices', invoiceId));
    
    // Log activity
    await logActivity(
      invoiceData.doctorId,
      'doctor',
      'delete',
      'medical-record',
      invoiceId,
      JSON.stringify({
        patientId: invoiceData.patientId,
        invoiceNumber: invoiceData.invoiceNumber
      })
    );
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};