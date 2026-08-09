import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';

const CATEGORIES = [
  { id: 'cat_01', name: '💄 Lip Care & Lip Makeup' },
  { id: 'cat_02', name: '👁️ Eye Makeup' },
  { id: 'cat_03', name: '✨ Face Makeup' },
  { id: 'cat_04', name: '💅 Nail Care & Nail Art' },
  { id: 'cat_05', name: '🧴 Skincare' },
  { id: 'cat_06', name: '🧖 Hair Care' },
  { id: 'cat_07', name: '🌸 Fragrance & Perfume' },
  { id: 'cat_08', name: '🧼 Personal Care' },
  { id: 'cat_09', name: '💇 Hair Accessories' },
  { id: 'cat_10', name: '💍 Bangles' },
  { id: 'cat_11', name: '💎 Jewellery & Fashion Accessories' },
  { id: 'cat_12', name: '👰 Bridal & Wedding Collection' },
  { id: 'cat_13', name: '🎀 Bindis & Traditional Accessories' },
  { id: 'cat_14', name: '👜 Bags & Pouches' },
  { id: 'cat_15', name: '🧿 Fashion & Beauty Accessories' },
  { id: 'cat_16', name: '🧹 Household Essentials' },
  { id: 'cat_17', name: '🍽️ Kitchen & Home Utility' },
  { id: 'cat_18', name: '🎁 Gifts & Decorative Items' },
  { id: 'cat_19', name: '✏️ Stationery & General Items' },
  { id: 'cat_20', name: '🧸 Kids & Miscellaneous' }
];

const PRODUCTS_PER_CAT = 10; // 20 * 10 = 200 products

// Helper to generate a random product
function generateDummyProduct(category, index) {
  const isBangle = category.name.includes('Bangles');
  const basePrice = Math.floor(Math.random() * 500) + 50;
  const mrp = basePrice + Math.floor(Math.random() * 200) + 50;

  const product = {
    name: `${category.name.replace(/[^\w\s&]/gi, '').trim()} Item ${index + 1}`,
    categoryId: category.id,
    categoryName: category.name,
    brand: 'Generic',
    sku: `SKU-${category.id}-${index + 1}`,
    barcode: Math.floor(Math.random() * 10000000000).toString(),
    purchasePrice: Math.floor(basePrice * 0.6),
    sellingPrice: basePrice,
    mrp: mrp,
    gst: 18,
    stock: Math.floor(Math.random() * 50) + 10,
    unit: isBangle ? 'Set' : 'Piece',
    lowStockLimit: 5,
    showInStore: true,
    description: `This is a premium quality ${category.name.replace(/[^\w\s&]/gi, '').trim()} product perfect for everyday use.`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (isBangle) {
    product.bangleType = ['Glass', 'Metal', 'Lac', 'Designer'][Math.floor(Math.random() * 4)];
    product.size = ['2.2', '2.4', '2.6', '2.8'][Math.floor(Math.random() * 4)];
    product.color = ['Red', 'Green', 'Gold', 'Multicolor'][Math.floor(Math.random() * 4)];
    product.material = product.bangleType;
  }

  return product;
}

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);

    // 1. Add Categories
    for (const cat of CATEGORIES) {
      const catRef = doc(db, 'categories', cat.id);
      batch.set(catRef, { name: cat.name, createdAt: serverTimestamp() });
    }

    // 2. Add Products
    for (const cat of CATEGORIES) {
      for (let i = 0; i < PRODUCTS_PER_CAT; i++) {
        const prod = generateDummyProduct(cat, i);
        const prodRef = doc(collection(db, 'products')); // auto-generate ID
        batch.set(prodRef, prod);
      }
    }

    // Commit all writes at once (max 500 per batch, we are doing 20 + 200 = 220)
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
