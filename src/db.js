import Dexie from 'dexie';

const db = new Dexie('JoyeriaLlamasDB');

db.version(4).stores({
  products: '++id, sku, name, category, metal, weight, gemType, carats, buyingPrice, price, stock, lowStockAlert, supplier, description, createdAt',
  clients: '++id, name, phone, email, address, ringSize, braceletSize, metalPreferences, birthday, anniversary, notes, *hobbies, createdAt',
  repairs: '++id, clientId, clientName, description, status, images, entryDate, estimatedDate, deliveryDate, budget, deposit, notes, orderNumber, createdAt',
  invoices: '++id, invoiceNumber, clientName, clientNIF, date, items, subtotal, ivaRate, ivaAmount, discount, total, paymentMethod, type, createdAt',
  campaigns: '++id, name, subject, body, templateId, segment, recipients, sentAt, status, stats, createdAt',
  settings: '++id, key, value'
});

export default db;
