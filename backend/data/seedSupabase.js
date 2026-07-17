const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../config/supabase');

const productsFilePath = path.join(__dirname, 'products.json');
const bookingsFilePath = path.join(__dirname, 'bookings.json');
const therapistBookingsFilePath = path.join(__dirname, 'therapist_bookings.json');
const ordersFilePath = path.join(__dirname, 'orders.json');

async function seed() {
  if (!isConfigured) {
    console.error('❌ Cannot run seed script. Please configure SUPABASE_URL and SUPABASE_KEY in backend/.env first.');
    process.exit(1);
  }

  console.log('🚀 Starting Supabase Database Seeding...');

  // 1. Seed Products
  if (fs.existsSync(productsFilePath)) {
    try {
      const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));
      console.log(`- Found ${productsData.length} products to seed.`);
      
      // Let's seed products in batches of 50 to avoid request body limits
      const batchSize = 50;
      for (let i = 0; i < productsData.length; i += batchSize) {
        const batch = productsData.slice(i, i + batchSize).map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          image: p.image,
          rating: p.rating || 4.5,
          reviews_count: p.reviewsCount || 0,
          short_description: p.shortDescription || '',
          long_description: p.longDescription || '',
          is_bestseller: !!p.isBestSeller,
          benefits: p.benefits || [],
          usage_directions: p.usageDirections || '',
          ingredients: p.ingredients || []
        }));

        const { error } = await supabase.from('products').upsert(batch);
        if (error) throw error;
      }
      console.log('✅ Products seeded successfully.');
    } catch (err) {
      console.error('❌ Error seeding products:', err.message || err);
    }
  }

  // 2. Seed Bookings
  if (fs.existsSync(bookingsFilePath)) {
    try {
      const bookingsData = JSON.parse(fs.readFileSync(bookingsFilePath, 'utf-8'));
      console.log(`- Found ${bookingsData.length} doctor bookings to seed.`);
      
      if (bookingsData.length > 0) {
        const mapped = bookingsData.map(b => ({
          id: b.id,
          doctor_id: b.doctorId,
          doctor_name: b.doctorName,
          date: b.date,
          time_slot: b.timeSlot,
          patient_name: b.patientName,
          patient_email: b.patientEmail,
          symptom: b.symptom || '',
          booked_at: b.bookedAt || new Date().toISOString()
        }));

        const { error } = await supabase.from('bookings').upsert(mapped);
        if (error) throw error;
      }
      console.log('✅ Doctor bookings seeded successfully.');
    } catch (err) {
      console.error('❌ Error seeding bookings:', err.message || err);
    }
  }

  // 3. Seed Therapist Bookings
  if (fs.existsSync(therapistBookingsFilePath)) {
    try {
      const tBookingsData = JSON.parse(fs.readFileSync(therapistBookingsFilePath, 'utf-8'));
      console.log(`- Found ${tBookingsData.length} therapist bookings to seed.`);
      
      if (tBookingsData.length > 0) {
        const mapped = tBookingsData.map(b => ({
          id: b.id,
          therapist_id: b.therapistId,
          therapist_name: b.therapistName,
          date: b.date,
          time_slot: b.timeSlot,
          patient_name: b.patientName,
          patient_email: b.patientEmail,
          therapy_type: b.therapyType || 'General Consultation',
          booked_at: b.bookedAt || new Date().toISOString()
        }));

        const { error } = await supabase.from('therapist_bookings').upsert(mapped);
        if (error) throw error;
      }
      console.log('✅ Therapist bookings seeded successfully.');
    } catch (err) {
      console.error('❌ Error seeding therapist bookings:', err.message || err);
    }
  }

  // 4. Seed Orders
  if (fs.existsSync(ordersFilePath)) {
    try {
      const ordersData = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
      console.log(`- Found ${ordersData.length} orders to seed.`);
      
      if (ordersData.length > 0) {
        const mapped = ordersData.map(o => ({
          id: o.id,
          customer_name: o.customerName,
          customer_email: o.customerEmail,
          items: o.items,
          subtotal: o.subtotal,
          discount: o.discount || 0,
          shipping: o.shipping || 0,
          total: o.total,
          status: o.status || 'Pending',
          ordered_at: o.orderedAt || new Date().toISOString(),
          shipping_address: o.shippingAddress || 'Delhi Main Market, Ward 4',
          shipping_city: o.shippingCity || 'New Delhi',
          shipping_state: o.shippingState || 'Delhi',
          shipping_zip: o.shippingZip || '110001',
          shipping_phone: o.shippingPhone || '9876543210'
        }));

        const { error } = await supabase.from('orders').upsert(mapped);
        if (error) throw error;
      }
      console.log('✅ Orders seeded successfully.');
    } catch (err) {
      console.error('❌ Error seeding orders:', err.message || err);
    }
  }

  console.log('🎉 Seeding process complete!');
}

seed();
