const fs = require('fs');
const path = require('path');
const { pool } = require('../config/supabase');

const usersFilePath = path.join(__dirname, '../data/users.json');

const getLocalUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const jsonData = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch { return []; }
};

const saveLocalUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// ──────────────────────────────────────────────────────────────────────────────
// SIGN UP
// ──────────────────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // ── Try PostgreSQL pool (Supabase direct connection) ──────────────────────
    if (pool) {
      try {
        // 1. Check duplicate
        const checkRes = await pool.query(
          'SELECT id FROM users WHERE email = $1 LIMIT 1',
          [emailLower]
        );
        if (checkRes.rowCount > 0) {
          return res.status(409).json({ message: 'User already exists with this email address' });
        }

        // 2. Insert new user
        const insertRes = await pool.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
          [name.trim(), emailLower, password]
        );
        const newUser = insertRes.rows[0];

        return res.status(201).json({
          success: true,
          message: 'Signup successful!',
          user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
      } catch (dbErr) {
        console.error('[Signup DB Error]', dbErr.message);
        // Fall through to local JSON if DB fails
      }
    }

    // ── Fallback: local JSON file ─────────────────────────────────────────────
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      return res.status(409).json({ message: 'User already exists with this email address' });
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: emailLower,
      password,
      registeredAt: new Date().toISOString()
    };

    users.push(newUser);
    saveLocalUsers(users);

    return res.status(201).json({
      success: true,
      message: 'Signup successful!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    console.error('[Signup Error]', error);
    res.status(500).json({ message: 'Error processing signup. Please try again.' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // ── Try PostgreSQL pool ───────────────────────────────────────────────────
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT id, name, email FROM users WHERE email = $1 AND password = $2 LIMIT 1',
          [emailLower, password]
        );

        if (result.rowCount > 0) {
          const user = result.rows[0];
          return res.json({
            success: true,
            message: 'Login successful!',
            user: { id: user.id, name: user.name, email: user.email }
          });
        } else {
          return res.status(401).json({ message: 'Invalid email or password credentials' });
        }
      } catch (dbErr) {
        console.error('[Login DB Error]', dbErr.message);
        // Fall through to local JSON if DB fails
      }
    }

    // ── Fallback: local JSON file ─────────────────────────────────────────────
    const user = getLocalUsers().find(
      u => u.email.toLowerCase() === emailLower && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password credentials' });
    }

    return res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: 'Error processing login. Please try again.' });
  }
};

const ordersFilePath = path.join(__dirname, '../data/orders.json');
const bookingsFilePath = path.join(__dirname, '../data/bookings.json');
const therapistBookingsFilePath = path.join(__dirname, '../data/therapist_bookings.json');

// ──────────────────────────────────────────────────────────────────────────────
// USER ACTIVITY (Orders, Doctor Bookings, Therapist Bookings)
// ──────────────────────────────────────────────────────────────────────────────
exports.getUserActivity = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const emailLower = email.toLowerCase().trim();

    // 1. Orders
    let userOrders = [];
    if (fs.existsSync(ordersFilePath)) {
      try {
        const allOrders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf-8'));
        userOrders = allOrders.filter(o => o.customerEmail && o.customerEmail.toLowerCase().trim() === emailLower);
      } catch (e) {}
    }

    // 2. Doctor Bookings
    let userDoctorBookings = [];
    if (fs.existsSync(bookingsFilePath)) {
      try {
        const allBookings = JSON.parse(fs.readFileSync(bookingsFilePath, 'utf-8'));
        userDoctorBookings = allBookings.filter(b => b.patientEmail && b.patientEmail.toLowerCase().trim() === emailLower);
      } catch (e) {}
    }

    // 3. Therapist Bookings
    let userTherapistBookings = [];
    if (fs.existsSync(therapistBookingsFilePath)) {
      try {
        const allThBookings = JSON.parse(fs.readFileSync(therapistBookingsFilePath, 'utf-8'));
        userTherapistBookings = allThBookings.filter(t => t.patientEmail && t.patientEmail.toLowerCase().trim() === emailLower);
      } catch (e) {}
    }

    // Sort all newest first
    userOrders.sort((a, b) => (new Date(b.orderedAt || b.id) - new Date(a.orderedAt || a.id)));
    userDoctorBookings.sort((a, b) => (new Date(b.bookedAt || b.date) - new Date(a.bookedAt || a.date)));
    userTherapistBookings.sort((a, b) => (new Date(b.bookedAt || b.date) - new Date(a.bookedAt || a.date)));

    return res.json({
      success: true,
      orders: userOrders,
      doctorBookings: userDoctorBookings,
      therapistBookings: userTherapistBookings
    });
  } catch (error) {
    console.error('[getUserActivity Error]', error);
    res.status(500).json({ message: 'Error retrieving user activities' });
  }
};
