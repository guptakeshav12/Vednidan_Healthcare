const fs = require('fs');
const path = require('path');
const { supabase, isConfigured, pool, isPoolReady } = require('../config/supabase');

const productsFilePath = path.join(__dirname, '../data/products.json');
const bookingsFilePath = path.join(__dirname, '../data/bookings.json');
const therapistBookingsFilePath = path.join(__dirname, '../data/therapist_bookings.json');
const ordersFilePath = path.join(__dirname, '../data/orders.json');
const usersFilePath = path.join(__dirname, '../data/users.json');
const accountsFilePath = path.join(__dirname, '../data/provider_accounts.json');
const doctorsFilePath = path.join(__dirname, '../data/doctors.json');
const therapistsFilePath = path.join(__dirname, '../data/therapists.json');

// Standard fallback doctor/therapist lists
const localDoctors = [
  { id: 101, name: "Dr. Vasudev Shashtri", specialty: "Nadi Pariksha & Pulse Diagnosis", rating: 4.9, experience: "22 years" },
  { id: 102, name: "Dr. Ananya Mishra", specialty: "Ayurvedic Skincare & Hair Care Expert", rating: 4.8, experience: "14 years" },
  { id: 103, name: "Dr. Raghavan Nair", specialty: "Panchakarma & Chronic Pain Specialist", rating: 4.9, experience: "18 years" }
];

const localTherapists = [
  { id: 201, name: "Vaidya Pradeep Sharma", specialty: "Panchakarma & Detox Specialist", rating: 4.9, experience: "25 years", therapies: ["Panchakarma", "Vamana", "Virechana", "Basti"] },
  { id: 202, name: "Vaidya Meera Kulkarni", specialty: "Abhyanga & Oil Therapy Expert", rating: 4.8, experience: "18 years", therapies: ["Abhyanga", "Shirodhara", "Pizhichil", "Elakizhi"] }
];

const readFileHelper = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultData;
  }
};

const writeFileHelper = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 1. GET /api/admin/stats — Comprehensive Revenue & Business Metrics
exports.getStats = async (req, res) => {
  try {
    const products = readFileHelper(productsFilePath);
    const bookings = readFileHelper(bookingsFilePath);
    const therapistBookings = readFileHelper(therapistBookingsFilePath);
    const orders = readFileHelper(ordersFilePath);

    // 1. Orders revenue (all received orders)
    const ordersRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    // 2. Doctor consultation fees received (₹499 each)
    const doctorRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 499), 0);

    // 3. Therapist session fees received (₹799 each)
    const therapistRevenue = therapistBookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 799), 0);

    // Total Grand Amount Received
    const totalRevenue = Math.round(ordersRevenue + doctorRevenue + therapistRevenue);

    return res.json({
      revenue: totalRevenue,
      totalRevenueReceived: totalRevenue,
      ordersRevenue: Math.round(ordersRevenue),
      doctorRevenue: Math.round(doctorRevenue),
      therapistRevenue: Math.round(therapistRevenue),
      ordersCount: orders.length,
      bookingsCount: bookings.length,
      therapistBookingsCount: therapistBookings.length,
      productsCount: products.length
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error retrieving admin statistics: ' + error.message });
  }
};

// 2. GET /api/admin/bookings
exports.getBookings = async (req, res) => {
  try {
    const list = readFileHelper(bookingsFilePath);
    const formatted = list.map(b => ({
      id: b.id,
      doctorId: b.doctorId || b.doctor_id,
      doctorName: b.doctorName || b.doctor_name || 'Dr. Ayurvedic Specialist',
      date: b.date,
      timeSlot: b.timeSlot || b.time_slot,
      patientName: b.patientName || b.patient_name,
      patientEmail: b.patientEmail || b.patient_email,
      symptom: b.symptom || 'General Consultation',
      amount: b.amount || 499,
      paymentMethod: b.paymentMethod || 'UPI Direct',
      paymentStatus: b.paymentStatus || 'Paid',
      status: b.status || 'Scheduled',
      prescription: b.prescription || '',
      videoRoomId: b.videoRoomId || b.video_room_id || '',
      bookedAt: b.bookedAt || b.booked_at || new Date().toISOString()
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching doctor bookings:', error);
    res.status(500).json({ message: 'Error retrieving doctor bookings' });
  }
};

// 3. DELETE /api/admin/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (!isConfigured) {
      let bookings = readFileHelper(bookingsFilePath);
      const initialLen = bookings.length;
      bookings = bookings.filter(b => b.id !== id);
      if (bookings.length === initialLen) return res.status(404).json({ message: 'Booking not found' });
      writeFileHelper(bookingsFilePath, bookings);
      return res.json({ success: true, message: 'Booking cancelled' });
    }

    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
};

// 4. GET /api/admin/therapist-bookings
exports.getTherapistBookings = async (req, res) => {
  try {
    const list = readFileHelper(therapistBookingsFilePath);
    const formatted = list.map(b => ({
      id: b.id,
      therapistId: b.therapistId || b.therapist_id,
      therapistName: b.therapistName || b.therapist_name || 'Vaidya Ayurvedic Therapist',
      date: b.date,
      timeSlot: b.timeSlot || b.time_slot,
      patientName: b.patientName || b.patient_name,
      patientEmail: b.patientEmail || b.patient_email,
      therapyType: b.therapyType || b.therapy_type || 'Panchakarma / Abhyanga',
      address: b.address || 'In-Clinic Session',
      amount: b.amount || 799,
      paymentMethod: b.paymentMethod || 'UPI Direct',
      paymentStatus: b.paymentStatus || 'Paid',
      status: b.status || 'Confirmed',
      otpCode: b.otpCode || b.otp_code || '----',
      feedback: b.feedback || '',
      rating: b.rating || 5,
      bookedAt: b.bookedAt || b.booked_at || new Date().toISOString()
    }));
    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching therapist bookings:', error);
    res.status(500).json({ message: 'Error retrieving therapist bookings' });
  }
};

// 5. DELETE /api/admin/therapist-bookings/:id
exports.deleteTherapistBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (!isConfigured) {
      let bookings = readFileHelper(therapistBookingsFilePath);
      const initialLen = bookings.length;
      bookings = bookings.filter(b => b.id !== id);
      if (bookings.length === initialLen) return res.status(404).json({ message: 'Booking not found' });
      writeFileHelper(therapistBookingsFilePath, bookings);
      return res.json({ success: true, message: 'Therapist booking cancelled' });
    }

    const { error } = await supabase.from('therapist_bookings').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Therapist booking cancelled successfully' });
  } catch (error) {
    console.error('Error deleting therapist booking:', error);
    res.status(500).json({ message: 'Error cancelling therapist booking' });
  }
};

// 6. GET /api/admin/orders
exports.getOrders = async (req, res) => {
  try {
    if (!isConfigured) {
      const orders = readFileHelper(ordersFilePath);
      orders.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
      return res.json(orders);
    }

    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('ordered_at', { ascending: false });

    if (error) throw error;

    const formatted = dbOrders.map(o => ({
      id: o.id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      items: o.items,
      subtotal: parseFloat(o.subtotal),
      discount: parseFloat(o.discount),
      shipping: parseFloat(o.shipping),
      total: parseFloat(o.total),
      status: o.status,
      orderedAt: o.ordered_at,
      shippingAddress: o.shipping_address,
      shippingCity: o.shipping_city,
      shippingState: o.shipping_state,
      shippingZip: o.shipping_zip,
      shippingPhone: o.shipping_phone
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error retrieving orders list' });
  }
};

// 7. POST /api/admin/orders (Real checkout API)
exports.createOrder = async (req, res) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      items, 
      subtotal, 
      discount, 
      shipping, 
      total,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingPhone 
    } = req.body;

    if (!customerName || !customerEmail || !items || items.length === 0 || !shippingAddress || !shippingCity || !shippingState || !shippingZip || !shippingPhone) {
      return res.status(400).json({ message: 'Missing shipping details or cart items' });
    }

    const orderId = Date.now();

    if (!isConfigured) {
      // Fallback
      const orders = readFileHelper(ordersFilePath);
      const newOrder = {
        id: orderId,
        customerName,
        customerEmail,
        items,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount || 0),
        shipping: parseFloat(shipping || 0),
        total: parseFloat(total),
        paymentMethod: req.body.paymentMethod || 'Online (Razorpay)',
        paymentId: req.body.paymentId || ('pay_' + Math.random().toString(36).substring(2, 10)),
        paymentStatus: req.body.paymentMethod === 'Cash on Delivery' ? 'Due on Delivery' : 'Paid',
        status: "Processing",
        orderedAt: new Date().toISOString(),
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingPhone
      };
      orders.push(newOrder);
      writeFileHelper(ordersFilePath, orders);
      return res.status(201).json({ success: true, order: newOrder });
    }

    // Connect to Supabase
    const newOrder = {
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      items: items,
      subtotal: parseFloat(subtotal),
      discount: parseFloat(discount || 0),
      shipping: parseFloat(shipping || 0),
      total: parseFloat(total),
      status: 'Pending',
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_state: shippingState,
      shipping_zip: shippingZip,
      shipping_phone: shippingPhone
    };

    const { data: dbOrder, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select('*')
      .single();

    if (error) throw error;

    // Format for return
    const formatted = {
      id: dbOrder.id,
      customerName: dbOrder.customer_name,
      customerEmail: dbOrder.customer_email,
      items: dbOrder.items,
      subtotal: parseFloat(dbOrder.subtotal),
      discount: parseFloat(dbOrder.discount),
      shipping: parseFloat(dbOrder.shipping),
      total: parseFloat(dbOrder.total),
      status: dbOrder.status,
      orderedAt: dbOrder.ordered_at
    };

    res.status(201).json({ success: true, message: 'Order created successfully', order: formatted });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error saving checkout order' });
  }
};

// 8. PUT /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!isConfigured) {
      const orders = readFileHelper(ordersFilePath);
      const order = orders.find(o => o.id === id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      order.status = status;
      writeFileHelper(ordersFilePath, orders);
      return res.json({ success: true, order });
    }

    const { data: dbOrder, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Order status updated', order: dbOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

// 9. Products CRUD
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, image, rating, reviewsCount, shortDescription, longDescription, isBestSeller, benefits, usageDirections, ingredients } = req.body;
    
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Product name, category, and price are required' });
    }

    if (!isConfigured) {
      const products = readFileHelper(productsFilePath);
      const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name, category, price: parseFloat(price), image, rating: parseFloat(rating || 4.5), reviewsCount: parseInt(reviewsCount || 10),
        shortDescription, longDescription, isBestSeller: !!isBestSeller, benefits: benefits || [], usageDirections, ingredients: ingredients || []
      };
      products.push(newProduct);
      writeFileHelper(productsFilePath, products);
      return res.status(201).json({ success: true, product: newProduct });
    }

    const { data: maxIdData } = await supabase.from('products').select('id').order('id', { ascending: false }).limit(1);
    const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

    const newProduct = {
      id: nextId,
      name, category,
      price: parseFloat(price),
      image: image || "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300",
      rating: parseFloat(rating || 4.5),
      reviews_count: parseInt(reviewsCount || 10),
      short_description: shortDescription || "",
      long_description: longDescription || "",
      is_bestseller: !!isBestSeller,
      benefits: benefits || [],
      usage_directions: usageDirections || "",
      ingredients: ingredients || []
    };

    const { data: dbProduct, error } = await supabase.from('products').insert(newProduct).select('*').single();
    if (error) throw error;

    res.status(201).json({ success: true, message: 'Product added successfully', product: dbProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error adding new product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    if (!isConfigured) {
      const products = readFileHelper(productsFilePath);
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return res.status(404).json({ message: 'Product not found' });

      products[index] = {
        ...products[index],
        ...updates,
        price: updates.price ? parseFloat(updates.price) : products[index].price,
        isBestSeller: updates.isBestSeller !== undefined ? !!updates.isBestSeller : products[index].isBestSeller
      };
      writeFileHelper(productsFilePath, products);
      return res.json({ success: true, product: products[index] });
    }

    // Map fields
    const dbUpdates = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.price) dbUpdates.price = parseFloat(updates.price);
    if (updates.image) dbUpdates.image = updates.image;
    if (updates.rating) dbUpdates.rating = parseFloat(updates.rating);
    if (updates.reviewsCount) dbUpdates.reviews_count = parseInt(updates.reviewsCount);
    if (updates.shortDescription) dbUpdates.short_description = updates.shortDescription;
    if (updates.longDescription) dbUpdates.long_description = updates.longDescription;
    if (updates.isBestSeller !== undefined) dbUpdates.is_bestseller = !!updates.isBestSeller;
    if (updates.benefits) dbUpdates.benefits = updates.benefits;
    if (updates.usageDirections) dbUpdates.usage_directions = updates.usageDirections;
    if (updates.ingredients) dbUpdates.ingredients = updates.ingredients;

    const { data: dbProduct, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Product updated', product: dbProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (!isConfigured) {
      let products = readFileHelper(productsFilePath);
      const prev = products.length;
      products = products.filter(p => p.id !== id);
      if (products.length === prev) return res.status(404).json({ message: 'Product not found' });
      writeFileHelper(productsFilePath, products);
      return res.json({ success: true, message: 'Product deleted' });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error removing product' });
  }
};

// 10. NEW: GET /api/admin/users (Registered Customers list & Order aggregations)
exports.getUsersList = async (req, res) => {
  try {
    let users = [];
    let orders = [];

    if (!isConfigured) {
      users = readFileHelper(usersFilePath);
      orders = readFileHelper(ordersFilePath);
    } else {
      const { data: dbUsers, error: uError } = await supabase.from('users').select('id, name, email, registered_at');
      if (uError) throw uError;
      
      const { data: dbOrders, error: oError } = await supabase.from('orders').select('customer_email, total');
      if (oError) throw oError;

      users = (dbUsers || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        registeredAt: u.registered_at
      }));
      orders = dbOrders || [];
    }

    // Aggregate statistics
    const userStats = users.map(user => {
      const userOrders = orders.filter(o => 
        (o.customerEmail || '').toLowerCase() === user.email.toLowerCase()
      );
      
      const totalSpend = userOrders.reduce((sum, o) => sum + parseFloat(o.total || o.total || 0), 0);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        registeredAt: user.registeredAt,
        ordersCount: userOrders.length,
        totalSpend: Math.round(totalSpend * 100) / 100
      };
    });

    // Sort users by spend descending
    userStats.sort((a, b) => b.totalSpend - a.totalSpend);
    res.json(userStats);

  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Error loading user directories' });
  }
};

// 11. NEW: GET /api/admin/analytics (Monthly revenue and best sellers summary)
exports.getAnalytics = async (req, res) => {
  try {
    let orders = [];
    if (!isConfigured) {
      orders = readFileHelper(ordersFilePath);
    } else {
      const { data, error } = await supabase.from('orders').select('total, status, ordered_at, items');
      if (error) throw error;
      orders = data.map(o => ({
        total: parseFloat(o.total),
        status: o.status,
        orderedAt: o.ordered_at,
        items: o.items
      }));
    }

    const monthlyRevenue = {};
    const productSalesCount = {};

    orders.forEach(o => {
      const dateObj = new Date(o.orderedAt || o.ordered_at);
      if (isNaN(dateObj.getTime())) return;
      
      // Group by YYYY-MM
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      // Sum revenue if Shipped or Delivered
      if (o.status === 'Delivered' || o.status === 'Shipped' || o.status === 'Pending') {
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + o.total;
      }

      // Count quantities of each item
      const itemsList = o.items || [];
      itemsList.forEach(item => {
        const name = item.name;
        const qty = parseInt(item.quantity || 1) || 1;
        productSalesCount[name] = (productSalesCount[name] || 0) + qty;
      });
    });

    // Format Monthly Revenue object to sorted list
    const revenueList = Object.keys(monthlyRevenue).map(month => ({
      month,
      revenue: Math.round(monthlyRevenue[month])
    })).sort((a, b) => b.month.localeCompare(a.month)); // Newest months first

    // Format Product Sales object to sorted list
    const salesList = Object.keys(productSalesCount).map(name => ({
      name,
      unitsSold: productSalesCount[name]
    })).sort((a, b) => b.unitsSold - a.unitsSold);

    res.json({
      revenueByMonth: revenueList,
      bestSellers: salesList
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Error retrieving analytics data' });
  }
};

// 12. Doctors CRUD
exports.getDoctors = async (req, res) => {
  try {
    let doctors = readFileHelper(doctorsFilePath, localDoctors);

    // Cross-merge with any registered provider accounts with role === 'doctor'
    const accounts = readFileHelper(accountsFilePath, []);
    accounts.filter(a => a.role === 'doctor').forEach(acc => {
      if (!doctors.some(d => d.id === acc.id || (d.email && acc.email && d.email.toLowerCase() === acc.email.toLowerCase()))) {
        doctors.push({
          id: acc.id,
          name: acc.name,
          email: acc.email,
          phone: acc.phone || '',
          qualification: acc.qualification || 'BAMS, Ayurvedic Physician',
          specialty: acc.specialty || 'General Ayurvedic Consultation',
          rating: acc.rating || 4.8,
          experience: acc.experience || '5 years',
          avatar: acc.avatar || 'assets/doctor_avatar.png'
        });
      }
    });

    res.json(doctors);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching doctors' });
  }
};

exports.addDoctor = async (req, res) => {
  try {
    const { id, name, specialty, rating, experience, email, phone, qualification, password } = req.body;
    if (!name || !specialty) return res.status(400).json({ message: 'Name and specialty are required' });

    const docId = id ? parseInt(id) : Date.now();
    const docEmail = (email && email.trim()) ? email.trim().toLowerCase() : `dr.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@vednidan.com`;
    const docPhone = (phone && phone.trim()) ? phone.trim() : '9876543210';
    const docQual = (qualification && qualification.trim()) ? qualification.trim() : 'BAMS, Ayurvedic Physician';
    const docExp = experience || '10 years';
    const docRating = parseFloat(rating) || 4.8;
    const plainPassword = (password && password.trim()) ? password.trim() : 'Password123';

    const newDoc = {
      id: docId,
      name: name.trim(),
      email: docEmail,
      phone: docPhone,
      qualification: docQual,
      specialty: specialty.trim(),
      rating: docRating,
      experience: docExp,
      avatar: 'assets/doctor_avatar.png'
    };

    // Update local doctors.json
    const doctors = readFileHelper(doctorsFilePath, localDoctors);
    const existingIdx = doctors.findIndex(d => d.id === newDoc.id || (d.email && d.email.toLowerCase() === docEmail));
    if (existingIdx >= 0) {
      doctors[existingIdx] = { ...doctors[existingIdx], ...newDoc };
    } else {
      doctors.push(newDoc);
    }
    writeFileHelper(doctorsFilePath, doctors);

    // Auto-provision/sync provider account for Doctor portal login
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const accounts = readFileHelper(accountsFilePath, []);
    const accIdx = accounts.findIndex(a => a.email.toLowerCase() === docEmail);
    const providerAccount = {
      id: newDoc.id,
      name: newDoc.name,
      email: docEmail,
      passwordHash,
      role: 'doctor',
      phone: docPhone,
      qualification: docQual,
      specialty: newDoc.specialty,
      experience: docExp,
      rating: docRating,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    if (accIdx >= 0) {
      accounts[accIdx] = { ...accounts[accIdx], ...providerAccount };
    } else {
      accounts.push(providerAccount);
    }
    writeFileHelper(accountsFilePath, accounts);

    // Sync to PostgreSQL DB
    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query(`
          INSERT INTO doctors (id, name, email, phone, qualification, specialty, rating, experience)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
            qualification = EXCLUDED.qualification, specialty = EXCLUDED.specialty,
            rating = EXCLUDED.rating, experience = EXCLUDED.experience
        `, [newDoc.id, newDoc.name, newDoc.email, newDoc.phone, newDoc.qualification, newDoc.specialty, newDoc.rating, newDoc.experience]);

        await pool.query(`
          INSERT INTO provider_accounts (id, name, email, password_hash, role, specialty, qualification, experience, rating, phone, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role, specialty = EXCLUDED.specialty, qualification = EXCLUDED.qualification,
            experience = EXCLUDED.experience, rating = EXCLUDED.rating, phone = EXCLUDED.phone, status = EXCLUDED.status
        `, [newDoc.id, newDoc.name, docEmail, passwordHash, 'doctor', newDoc.specialty, newDoc.qualification, newDoc.experience, newDoc.rating, newDoc.phone, 'active']);
      } catch (dbErr) {
        console.warn('[Admin DB Sync addDoctor]', dbErr.message);
      }
    }

    return res.status(201).json({ success: true, doctor: newDoc });
  } catch (e) {
    console.error('Error adding doctor:', e);
    res.status(500).json({ message: 'Error saving doctor details' });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, qualification, specialty, rating, experience, password } = req.body;

    const doctors = readFileHelper(doctorsFilePath, localDoctors);
    const idx = doctors.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Doctor not found' });

    doctors[idx] = {
      ...doctors[idx],
      name: name ? name.trim() : doctors[idx].name,
      email: email ? email.trim().toLowerCase() : doctors[idx].email,
      phone: phone !== undefined ? phone.trim() : doctors[idx].phone,
      qualification: qualification !== undefined ? qualification.trim() : doctors[idx].qualification,
      specialty: specialty ? specialty.trim() : doctors[idx].specialty,
      rating: rating !== undefined ? parseFloat(rating) : doctors[idx].rating,
      experience: experience || doctors[idx].experience
    };
    writeFileHelper(doctorsFilePath, doctors);

    // Sync provider account
    const accounts = readFileHelper(accountsFilePath, []);
    const accIdx = accounts.findIndex(a => a.id === id || (doctors[idx].email && a.email.toLowerCase() === doctors[idx].email.toLowerCase()));
    if (accIdx !== -1) {
      if (name) accounts[accIdx].name = name.trim();
      if (email) accounts[accIdx].email = email.trim().toLowerCase();
      if (phone !== undefined) accounts[accIdx].phone = phone.trim();
      if (qualification !== undefined) accounts[accIdx].qualification = qualification.trim();
      if (specialty) accounts[accIdx].specialty = specialty.trim();
      if (experience) accounts[accIdx].experience = experience;
      if (rating !== undefined) accounts[accIdx].rating = parseFloat(rating);
      if (password && password.trim()) {
        const bcrypt = require('bcryptjs');
        accounts[accIdx].passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      writeFileHelper(accountsFilePath, accounts);
    }

    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query(`
          UPDATE doctors SET
            name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
            qualification = COALESCE($4, qualification), specialty = COALESCE($5, specialty),
            rating = COALESCE($6, rating), experience = COALESCE($7, experience)
          WHERE id = $8
        `, [doctors[idx].name, doctors[idx].email, doctors[idx].phone, doctors[idx].qualification, doctors[idx].specialty, doctors[idx].rating, doctors[idx].experience, id]);

        await pool.query(`
          UPDATE provider_accounts SET
            name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
            qualification = COALESCE($4, qualification), specialty = COALESCE($5, specialty),
            rating = COALESCE($6, rating), experience = COALESCE($7, experience)
          WHERE id = $8 OR email = $2
        `, [doctors[idx].name, doctors[idx].email, doctors[idx].phone, doctors[idx].qualification, doctors[idx].specialty, doctors[idx].rating, doctors[idx].experience, id]);
      } catch (dbErr) {
        console.warn('[Admin DB Sync updateDoctor]', dbErr.message);
      }
    }

    return res.json({ success: true, doctor: doctors[idx] });
  } catch (e) {
    console.error('Error updating doctor:', e);
    res.status(500).json({ message: 'Error updating doctor details' });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let doctors = readFileHelper(doctorsFilePath, localDoctors);
    const idx = doctors.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Doctor not found' });
    const deletedDoc = doctors[idx];
    doctors.splice(idx, 1);
    writeFileHelper(doctorsFilePath, doctors);

    // Remove corresponding provider account
    let accounts = readFileHelper(accountsFilePath, []);
    accounts = accounts.filter(a => a.id !== id && (!deletedDoc.email || a.email.toLowerCase() !== deletedDoc.email.toLowerCase()));
    writeFileHelper(accountsFilePath, accounts);

    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query('DELETE FROM doctors WHERE id = $1', [id]);
        await pool.query('DELETE FROM provider_accounts WHERE id = $1 OR email = $2', [id, deletedDoc.email || '']);
      } catch (dbErr) {
        console.warn('[Admin DB Sync deleteDoctor]', dbErr.message);
      }
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting doctor:', e);
    res.status(500).json({ message: 'Error deleting doctor details' });
  }
};

// 13. Therapists CRUD
exports.getTherapists = async (req, res) => {
  try {
    let therapists = readFileHelper(therapistsFilePath, localTherapists);

    // Cross-merge with any registered provider accounts with role === 'therapist'
    const accounts = readFileHelper(accountsFilePath, []);
    accounts.filter(a => a.role === 'therapist').forEach(acc => {
      if (!therapists.some(t => t.id === acc.id || (t.email && acc.email && t.email.toLowerCase() === acc.email.toLowerCase()))) {
        therapists.push({
          id: acc.id,
          name: acc.name,
          email: acc.email,
          phone: acc.phone || '',
          qualification: acc.qualification || 'Certified Panchakarma Vaidya',
          specialty: acc.specialty || 'General Ayurvedic Therapist',
          rating: acc.rating || 4.8,
          experience: acc.experience || '5 years',
          therapies: acc.therapies && acc.therapies.length ? acc.therapies : ["General Consultation", "Panchakarma", "Abhyanga"],
          avatar: acc.avatar || 'assets/doctor_avatar.png'
        });
      }
    });

    res.json(therapists);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching therapists' });
  }
};

exports.addTherapist = async (req, res) => {
  try {
    const { id, name, specialty, rating, experience, therapies, email, phone, qualification, password } = req.body;
    if (!name || !specialty) return res.status(400).json({ message: 'Name and specialty are required' });

    const thId = id ? parseInt(id) : Date.now();
    const thEmail = (email && email.trim()) ? email.trim().toLowerCase() : `therapist.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@vednidan.com`;
    const thPhone = (phone && phone.trim()) ? phone.trim() : '9876543212';
    const thQual = (qualification && qualification.trim()) ? qualification.trim() : 'Certified Panchakarma Vaidya';
    const parsedTherapies = Array.isArray(therapies) ? therapies : (therapies ? therapies.split(',').map(s => s.trim()).filter(Boolean) : ["Panchakarma", "Abhyanga"]);
    const thExp = experience || '10 years';
    const thRating = parseFloat(rating) || 4.8;
    const plainPassword = (password && password.trim()) ? password.trim() : 'Password123';

    const newTherapist = {
      id: thId,
      name: name.trim(),
      email: thEmail,
      phone: thPhone,
      qualification: thQual,
      specialty: specialty.trim(),
      rating: thRating,
      experience: thExp,
      therapies: parsedTherapies,
      avatar: 'assets/doctor_avatar.png'
    };

    // Update local therapists.json
    const therapists = readFileHelper(therapistsFilePath, localTherapists);
    const existingIdx = therapists.findIndex(t => t.id === newTherapist.id || (t.email && t.email.toLowerCase() === thEmail));
    if (existingIdx >= 0) {
      therapists[existingIdx] = { ...therapists[existingIdx], ...newTherapist };
    } else {
      therapists.push(newTherapist);
    }
    writeFileHelper(therapistsFilePath, therapists);

    // Auto-provision/sync provider account for Therapist portal login
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const accounts = readFileHelper(accountsFilePath, []);
    const accIdx = accounts.findIndex(a => a.email.toLowerCase() === thEmail);
    const providerAccount = {
      id: newTherapist.id,
      name: newTherapist.name,
      email: thEmail,
      passwordHash,
      role: 'therapist',
      phone: thPhone,
      qualification: thQual,
      specialty: newTherapist.specialty,
      experience: thExp,
      therapies: parsedTherapies,
      rating: thRating,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    if (accIdx >= 0) {
      accounts[accIdx] = { ...accounts[accIdx], ...providerAccount };
    } else {
      accounts.push(providerAccount);
    }
    writeFileHelper(accountsFilePath, accounts);

    // Sync to PostgreSQL DB
    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query(`
          INSERT INTO therapists (id, name, email, phone, qualification, specialty, rating, experience, therapies)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
            qualification = EXCLUDED.qualification, specialty = EXCLUDED.specialty,
            rating = EXCLUDED.rating, experience = EXCLUDED.experience, therapies = EXCLUDED.therapies
        `, [newTherapist.id, newTherapist.name, newTherapist.email, newTherapist.phone, newTherapist.qualification, newTherapist.specialty, newTherapist.rating, newTherapist.experience, newTherapist.therapies]);

        await pool.query(`
          INSERT INTO provider_accounts (id, name, email, password_hash, role, specialty, qualification, experience, rating, phone, therapies, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role, specialty = EXCLUDED.specialty, qualification = EXCLUDED.qualification,
            experience = EXCLUDED.experience, rating = EXCLUDED.rating, phone = EXCLUDED.phone,
            therapies = EXCLUDED.therapies, status = EXCLUDED.status
        `, [newTherapist.id, newTherapist.name, thEmail, passwordHash, 'therapist', newTherapist.specialty, newTherapist.qualification, newTherapist.experience, newTherapist.rating, newTherapist.phone, newTherapist.therapies, 'active']);
      } catch (dbErr) {
        console.warn('[Admin DB Sync addTherapist]', dbErr.message);
      }
    }

    return res.status(201).json({ success: true, therapist: newTherapist });
  } catch (e) {
    console.error('Error adding therapist:', e);
    res.status(500).json({ message: 'Error saving therapist details' });
  }
};

exports.updateTherapist = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, qualification, specialty, rating, experience, therapies, password } = req.body;

    const therapists = readFileHelper(therapistsFilePath, localTherapists);
    const idx = therapists.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Therapist not found' });

    const parsedTherapies = therapies ? (Array.isArray(therapies) ? therapies : therapies.split(',').map(s => s.trim()).filter(Boolean)) : therapists[idx].therapies;

    therapists[idx] = {
      ...therapists[idx],
      name: name ? name.trim() : therapists[idx].name,
      email: email ? email.trim().toLowerCase() : therapists[idx].email,
      phone: phone !== undefined ? phone.trim() : therapists[idx].phone,
      qualification: qualification !== undefined ? qualification.trim() : therapists[idx].qualification,
      specialty: specialty ? specialty.trim() : therapists[idx].specialty,
      rating: rating !== undefined ? parseFloat(rating) : therapists[idx].rating,
      experience: experience || therapists[idx].experience,
      therapies: parsedTherapies
    };
    writeFileHelper(therapistsFilePath, therapists);

    // Sync provider account
    const accounts = readFileHelper(accountsFilePath, []);
    const accIdx = accounts.findIndex(a => a.id === id || (therapists[idx].email && a.email.toLowerCase() === therapists[idx].email.toLowerCase()));
    if (accIdx !== -1) {
      if (name) accounts[accIdx].name = name.trim();
      if (email) accounts[accIdx].email = email.trim().toLowerCase();
      if (phone !== undefined) accounts[accIdx].phone = phone.trim();
      if (qualification !== undefined) accounts[accIdx].qualification = qualification.trim();
      if (specialty) accounts[accIdx].specialty = specialty.trim();
      if (experience) accounts[accIdx].experience = experience;
      if (parsedTherapies) accounts[accIdx].therapies = parsedTherapies;
      if (rating !== undefined) accounts[accIdx].rating = parseFloat(rating);
      if (password && password.trim()) {
        const bcrypt = require('bcryptjs');
        accounts[accIdx].passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      writeFileHelper(accountsFilePath, accounts);
    }

    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query(`
          UPDATE therapists SET
            name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
            qualification = COALESCE($4, qualification), specialty = COALESCE($5, specialty),
            rating = COALESCE($6, rating), experience = COALESCE($7, experience),
            therapies = COALESCE($8, therapies)
          WHERE id = $9
        `, [therapists[idx].name, therapists[idx].email, therapists[idx].phone, therapists[idx].qualification, therapists[idx].specialty, therapists[idx].rating, therapists[idx].experience, therapists[idx].therapies, id]);

        await pool.query(`
          UPDATE provider_accounts SET
            name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
            qualification = COALESCE($4, qualification), specialty = COALESCE($5, specialty),
            rating = COALESCE($6, rating), experience = COALESCE($7, experience),
            therapies = COALESCE($8, therapies)
          WHERE id = $9 OR email = $2
        `, [therapists[idx].name, therapists[idx].email, therapists[idx].phone, therapists[idx].qualification, therapists[idx].specialty, therapists[idx].rating, therapists[idx].experience, therapists[idx].therapies, id]);
      } catch (dbErr) {
        console.warn('[Admin DB Sync updateTherapist]', dbErr.message);
      }
    }

    return res.json({ success: true, therapist: therapists[idx] });
  } catch (e) {
    console.error('Error updating therapist:', e);
    res.status(500).json({ message: 'Error updating therapist details' });
  }
};

exports.deleteTherapist = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let therapists = readFileHelper(therapistsFilePath, localTherapists);
    const idx = therapists.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Therapist not found' });
    const deletedT = therapists[idx];
    therapists.splice(idx, 1);
    writeFileHelper(therapistsFilePath, therapists);

    // Remove corresponding provider account
    let accounts = readFileHelper(accountsFilePath, []);
    accounts = accounts.filter(a => a.id !== id && (!deletedT.email || a.email.toLowerCase() !== deletedT.email.toLowerCase()));
    writeFileHelper(accountsFilePath, accounts);

    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query('DELETE FROM therapists WHERE id = $1', [id]);
        await pool.query('DELETE FROM provider_accounts WHERE id = $1 OR email = $2', [id, deletedT.email || '']);
      } catch (dbErr) {
        console.warn('[Admin DB Sync deleteTherapist]', dbErr.message);
      }
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting therapist:', e);
    res.status(500).json({ message: 'Error deleting therapist details' });
  }
};

// =========================================================
// NEW: Partner Accounts management
// =========================================================
exports.getProviderAccounts = async (req, res) => {
  try {
    if (pool && isPoolReady && isPoolReady()) {
      try {
        const result = await pool.query(`
          SELECT id, name, email, role, specialty, qualification, experience, rating, phone, therapies, created_at
          FROM provider_accounts ORDER BY id ASC
        `);
        if (result.rowCount > 0) {
          const formatted = result.rows.map(a => ({
            id: a.id,
            name: a.name,
            email: a.email,
            role: a.role,
            phone: a.phone || '',
            qualification: a.qualification || '',
            specialty: a.specialty || '',
            experience: a.experience || '',
            therapies: a.therapies || [],
            rating: a.rating ? parseFloat(a.rating) : 4.5,
            createdAt: a.created_at
          }));
          return res.json(formatted);
        }
      } catch (dbErr) {
        console.warn('[Admin getProviderAccounts DB fallback]', dbErr.message);
      }
    }

    const list = readFileHelper(accountsFilePath, []);
    const safe = list.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      phone: a.phone || '',
      qualification: a.qualification || '',
      specialty: a.specialty || '',
      experience: a.experience || '',
      therapies: a.therapies || [],
      rating: a.rating ? parseFloat(a.rating) : 4.5,
      createdAt: a.createdAt || new Date().toISOString()
    }));
    return res.json(safe);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching partner accounts' });
  }
};

exports.deleteProviderAccount = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!isConfigured) {
      let accounts = readFileHelper(accountsFilePath, []);
      accounts = accounts.filter(a => a.id !== id);
      writeFileHelper(accountsFilePath, accounts);
      return res.json({ success: true });
    }
    const { error } = await supabase.from('provider_accounts').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error deleting account' });
  }
};

exports.resetProviderPassword = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bcrypt = require('bcryptjs');
    const defaultHash = await bcrypt.hash('123456', 10);

    if (!isConfigured) {
      const accounts = readFileHelper(accountsFilePath, []);
      const idx = accounts.findIndex(a => a.id === id);
      if (idx === -1) return res.status(404).json({ message: 'Account not found' });
      accounts[idx].passwordHash = defaultHash;
      writeFileHelper(accountsFilePath, accounts);
      return res.json({ success: true, message: 'Password reset to 123456' });
    }

    const { error } = await supabase
      .from('provider_accounts')
      .update({ password_hash: defaultHash })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Password reset to 123456' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// GET /api/admin/consultation-logs
exports.getConsultationLogs = async (req, res) => {
  try {
    const consultationLogsFilePath = path.join(__dirname, '../data/consultation_logs.json');
    const logs = readFileHelper(consultationLogsFilePath, []);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching consultation logs:', error);
    res.status(500).json({ message: 'Error retrieving AI consultation logs' });
  }
};

// GET /api/admin/settings
exports.getSystemSettings = async (req, res) => {
  try {
    const accounts = readFileHelper(accountsFilePath, []);
    const products = readFileHelper(productsFilePath, []);
    const consultationLogs = readFileHelper(path.join(__dirname, '../data/consultation_logs.json'), []);

    res.json({
      systemName: "VedNidan Healthcare Control Center",
      version: "v2.5.0-production",
      environment: process.env.NODE_ENV || "development",
      databaseStatus: isConfigured ? "Connected (Supabase Cloud PostgreSQL)" : "Active (Local JSON Persistence Engine)",
      defaultCredentials: [
        { role: "Super Admin", portal: "/admin.html", defaultId: "admin", defaultPassword: "admin", notes: "Full system administration & metrics control" },
        { role: "Ayurvedic Doctor (Default)", portal: "/provider.html", defaultId: "dr.vasudev@vednidan.com / 9876543210", defaultPassword: "Password123", notes: "Doctor portal diagnosis & appointment management" },
        { role: "Ayurvedic Therapist (Default)", portal: "/provider.html", defaultId: "therapist.meera@vednidan.com / 9876543212", defaultPassword: "Password123", notes: "Therapist portal Panchakarma & session management" }
      ],
      partnerAccountsCount: accounts.length,
      productsCount: products.length,
      aiConsultationsCount: consultationLogs.length,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Error retrieving system settings' });
  }
};

// POST /api/admin/categories - Save a new custom product category
exports.addProductCategory = async (req, res) => {
  try {
    const { label, slug } = req.body || {};
    const cleanLabel = String(label || '').trim();
    const cleanSlug = (slug || cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    if (!cleanLabel || !cleanSlug) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const categoriesFilePath = path.join(__dirname, '../data/categories.json');
    const existing = readFileHelper(categoriesFilePath, []);
    if (!existing.some(c => c.slug === cleanSlug)) {
      existing.push({ slug: cleanSlug, label: cleanLabel });
      writeFileHelper(categoriesFilePath, existing);
    }

    res.status(201).json({ success: true, category: { slug: cleanSlug, label: cleanLabel }, categories: existing });
  } catch (error) {
    console.error('Error adding product category:', error);
    res.status(500).json({ message: 'Error saving custom category' });
  }
};
