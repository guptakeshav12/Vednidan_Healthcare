const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '../data/products.json');
const bookingsFilePath = path.join(__dirname, '../data/bookings.json');
const therapistBookingsFilePath = path.join(__dirname, '../data/therapist_bookings.json');
const ordersFilePath = path.join(__dirname, '../data/orders.json');

// Helper functions for reading and writing files safely
const readFileHelper = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultData;
  }
};

const writeFileHelper = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 1. GET /api/admin/stats
exports.getStats = (req, res) => {
  try {
    const products = readFileHelper(productsFilePath);
    const bookings = readFileHelper(bookingsFilePath);
    const therapistBookings = readFileHelper(therapistBookingsFilePath);
    const orders = readFileHelper(ordersFilePath);

    // Calculate revenue from Delivered or Shipped orders
    const totalRevenue = orders
      .filter(o => o.status === 'Delivered' || o.status === 'Shipped')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    res.json({
      revenue: totalRevenue,
      ordersCount: orders.length,
      bookingsCount: bookings.length,
      therapistBookingsCount: therapistBookings.length,
      productsCount: products.length
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error retrieving admin statistics' });
  }
};

// 2. GET /api/admin/bookings
exports.getBookings = (req, res) => {
  try {
    const bookings = readFileHelper(bookingsFilePath);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching doctor bookings:', error);
    res.status(500).json({ message: 'Error retrieving doctor bookings' });
  }
};

// 3. DELETE /api/admin/bookings/:id
exports.deleteBooking = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let bookings = readFileHelper(bookingsFilePath);
    const initialLen = bookings.length;
    bookings = bookings.filter(b => b.id !== id);

    if (bookings.length === initialLen) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    writeFileHelper(bookingsFilePath, bookings);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
};

// 4. GET /api/admin/therapist-bookings
exports.getTherapistBookings = (req, res) => {
  try {
    const therapistBookings = readFileHelper(therapistBookingsFilePath);
    res.json(therapistBookings);
  } catch (error) {
    console.error('Error fetching therapist bookings:', error);
    res.status(500).json({ message: 'Error retrieving therapist bookings' });
  }
};

// 5. DELETE /api/admin/therapist-bookings/:id
exports.deleteTherapistBooking = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let therapistBookings = readFileHelper(therapistBookingsFilePath);
    const initialLen = therapistBookings.length;
    therapistBookings = therapistBookings.filter(b => b.id !== id);

    if (therapistBookings.length === initialLen) {
      return res.status(404).json({ message: 'Therapist booking not found' });
    }

    writeFileHelper(therapistBookingsFilePath, therapistBookings);
    res.json({ success: true, message: 'Therapist booking cancelled successfully' });
  } catch (error) {
    console.error('Error deleting therapist booking:', error);
    res.status(500).json({ message: 'Error cancelling therapist booking' });
  }
};

// 6. GET /api/admin/orders
exports.getOrders = (req, res) => {
  try {
    const orders = readFileHelper(ordersFilePath);
    // Sort by orderedAt descending
    orders.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error retrieving orders list' });
  }
};

// 7. POST /api/admin/orders (User checkout API)
exports.createOrder = (req, res) => {
  try {
    const { customerName, customerEmail, items, subtotal, discount, shipping, total } = req.body;
    if (!customerName || !customerEmail || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing customer details or cart items' });
    }

    const orders = readFileHelper(ordersFilePath);

    const newOrder = {
      id: Date.now(),
      customerName,
      customerEmail,
      items,
      subtotal: parseFloat(subtotal),
      discount: parseFloat(discount || 0),
      shipping: parseFloat(shipping || 0),
      total: parseFloat(total),
      status: "Pending",
      orderedAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeFileHelper(ordersFilePath, orders);

    res.status(201).json({ success: true, message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error saving checkout order' });
  }
};

// 8. PUT /api/admin/orders/:id/status
exports.updateOrderStatus = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const orders = readFileHelper(ordersFilePath);
    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    writeFileHelper(ordersFilePath, orders);

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

// 9. POST /api/admin/products
exports.createProduct = (req, res) => {
  try {
    const { name, category, price, image, rating, reviewsCount, shortDescription, longDescription, isBestSeller, benefits, usageDirections, ingredients } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Product name, category, and price are required' });
    }

    const products = readFileHelper(productsFilePath);

    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name,
      category,
      price: parseFloat(price),
      image: image || "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300",
      rating: parseFloat(rating || 4.5),
      reviewsCount: parseInt(reviewsCount || 10),
      shortDescription: shortDescription || "",
      longDescription: longDescription || "",
      isBestSeller: !!isBestSeller,
      benefits: benefits || [],
      usageDirections: usageDirections || "",
      ingredients: ingredients || []
    };

    products.push(newProduct);
    writeFileHelper(productsFilePath, products);

    res.status(201).json({ success: true, message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error adding new product' });
  }
};

// 10. PUT /api/admin/products/:id
exports.updateProduct = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const products = readFileHelper(productsFilePath);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Merge updates
    products[index] = {
      ...products[index],
      ...updates,
      price: updates.price ? parseFloat(updates.price) : products[index].price,
      rating: updates.rating ? parseFloat(updates.rating) : products[index].rating,
      reviewsCount: updates.reviewsCount ? parseInt(updates.reviewsCount) : products[index].reviewsCount,
      isBestSeller: updates.isBestSeller !== undefined ? !!updates.isBestSeller : products[index].isBestSeller
    };

    writeFileHelper(productsFilePath, products);

    res.json({ success: true, message: 'Product updated successfully', product: products[index] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product listing' });
  }
};

// 11. DELETE /api/admin/products/:id
exports.deleteProduct = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let products = readFileHelper(productsFilePath);
    const initialLen = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initialLen) {
      return res.status(404).json({ message: 'Product not found' });
    }

    writeFileHelper(productsFilePath, products);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error removing product listing' });
  }
};
