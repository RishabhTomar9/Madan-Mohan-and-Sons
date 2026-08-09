import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export async function getDashboardStats() {
  const stats = {
    sales: { today: 0, week: 0, month: 0, todayCount: 0 },
    billing: { todayBills: 0, pendingAmount: 0, cancelledCount: 0 },
    khata: { receivable: 0, payable: 0, overdue: 0 },
    ecommerce: { todayOrders: 0, pendingOrders: 0, completedOrders: 0 },
    inventory: { total: 0, lowStock: 0, outOfStock: 0 },
    chartData: []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); 
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Pre-fill chartData for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    stats.chartData.push({
      date: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateValue: d.getTime(), // For comparison
      revenue: 0
    });
  }

  try {
    // 1. Invoices
    const invoicesSnap = await getDocs(collection(db, 'invoices'));
    invoicesSnap.forEach(doc => {
      const data = doc.data();
      const amount = data.grandTotal || 0;
      const createdAt = data.createdAt?.toDate() || new Date(0);

      if (data.status === 'cancelled') {
        stats.billing.cancelledCount++;
      } else {
        if (createdAt >= monthStart) stats.sales.month += amount;
        if (createdAt >= weekStart) stats.sales.week += amount;
        if (createdAt >= today) {
          stats.sales.today += amount;
          stats.sales.todayCount++;
          stats.billing.todayBills++;
        }
        
        // Add to chart data if within last 7 days
        const invDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime();
        const chartEntry = stats.chartData.find(c => c.dateValue === invDate);
        if (chartEntry) {
          chartEntry.revenue += amount;
        }
      }

      if (data.status === 'pending' || data.paymentStatus === 'pending') {
        stats.billing.pendingAmount += amount;
      }
    });

    // 2. KhataBook (Customers)
    const customersSnap = await getDocs(collection(db, 'customers'));
    customersSnap.forEach(doc => {
      const data = doc.data();
      const bal = data.khataBalance || 0;
      if (bal > 0) stats.khata.receivable += bal;
      if (bal < 0) stats.khata.payable += Math.abs(bal);
      stats.khata.overdue = stats.khata.receivable * 0.1;
    });

    // 3. E-commerce (Orders)
    const ordersSnap = await getDocs(collection(db, 'orders'));
    ordersSnap.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date(0);
      
      if (createdAt >= today) stats.ecommerce.todayOrders++;
      if (data.status === 'pending') stats.ecommerce.pendingOrders++;
      if (data.status === 'delivered') stats.ecommerce.completedOrders++;
    });

    // 4. Inventory (Products)
    const productsSnap = await getDocs(collection(db, 'products'));
    stats.inventory.total = productsSnap.size;
    productsSnap.forEach(doc => {
      const data = doc.data();
      const qty = data.stock || 0;
      if (qty === 0) stats.inventory.outOfStock++;
      else if (qty <= 5) stats.inventory.lowStock++;
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }

  return stats;
}
