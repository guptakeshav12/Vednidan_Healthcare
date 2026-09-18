const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { supabase, isConfigured, pool } = require('../config/supabase');

// ===== LOCAL FILE PATHS =====
const bookingsFilePath = path.join(__dirname, '../data/bookings.json');
const therapistBookingsFilePath = path.join(__dirname, '../data/therapist_bookings.json');
const accountsFilePath = path.join(__dirname, '../data/provider_accounts.json');
const doctorsFilePath = path.join(__dirname, '../data/doctors.json');
const therapistsFilePath = path.join(__dirname, '../data/therapists.json');

// ===== FILE HELPERS =====
const readFileHelper = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch (e) { return defaultData; }
};

const writeFileHelper = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ===== OTP MEMORY STORE (for forgot password flow) =====
const otpStore = {}; // { email: { otp, expires } }

// ===== GENERATE 6-DIGIT OTP =====
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// =========================================================
// 1. POST /api/provider/signup
//    Register a new Doctor or Therapist account
// =========================================================
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, specialty, qualification, experience, phone, therapies } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }
    if (!['doctor', 'therapist'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "doctor" or "therapist".' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const emailLower = email.toLowerCase().trim();
    const accounts = readFileHelper(accountsFilePath, []);
    const existing = accounts.find(a => a.email.toLowerCase() === emailLower);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedTherapies = role === 'therapist' 
      ? (Array.isArray(therapies) ? therapies : (therapies ? therapies.split(',').map(s => s.trim()).filter(Boolean) : ["Panchakarma", "Abhyanga"]))
      : [];

    const defaultQual = role === 'doctor' ? 'BAMS, Ayurvedic Physician' : 'Certified Panchakarma Vaidya';
    const qual = qualification && qualification.trim() ? qualification.trim() : defaultQual;

    const newAccount = {
      id: Date.now(),
      name: name.trim(),
      email: emailLower,
      passwordHash: hashedPassword,
      role,
      phone: phone ? phone.trim() : '',
      qualification: qual,
      specialty: specialty || (role === 'doctor' ? 'General Ayurvedic Practitioner' : 'General Ayurvedic Therapist'),
      experience: experience || '0 years',
      therapies: parsedTherapies,
      rating: 4.5,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    writeFileHelper(accountsFilePath, accounts);

    // Auto-add to doctor or therapist public catalog
    if (role === 'doctor') {
      const doctors = readFileHelper(doctorsFilePath, []);
      if (!doctors.some(d => d.email === newAccount.email || d.id === newAccount.id)) {
        doctors.push({
          id: newAccount.id,
          name: newAccount.name,
          email: newAccount.email,
          phone: newAccount.phone,
          qualification: newAccount.qualification,
          specialty: newAccount.specialty,
          rating: newAccount.rating,
          experience: newAccount.experience,
          avatar: 'assets/doctor_avatar.png'
        });
        writeFileHelper(doctorsFilePath, doctors);
      }
    } else if (role === 'therapist') {
      const therapists = readFileHelper(therapistsFilePath, []);
      if (!therapists.some(t => t.email === newAccount.email || t.id === newAccount.id)) {
        therapists.push({
          id: newAccount.id,
          name: newAccount.name,
          email: newAccount.email,
          phone: newAccount.phone,
          qualification: newAccount.qualification,
          specialty: newAccount.specialty,
          rating: newAccount.rating,
          experience: newAccount.experience,
          therapies: parsedTherapies,
          avatar: 'assets/doctor_avatar.png'
        });
        writeFileHelper(therapistsFilePath, therapists);
      }
    }

    // Direct PostgreSQL pool synchronization
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO provider_accounts (id, name, email, password_hash, role, specialty, qualification, experience, rating, phone, therapies, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role, specialty = EXCLUDED.specialty, qualification = EXCLUDED.qualification,
            experience = EXCLUDED.experience, rating = EXCLUDED.rating, phone = EXCLUDED.phone,
            therapies = EXCLUDED.therapies, status = EXCLUDED.status
        `, [newAccount.id, newAccount.name, newAccount.email, newAccount.passwordHash, newAccount.role, newAccount.specialty, newAccount.qualification, newAccount.experience, newAccount.rating, newAccount.phone, newAccount.therapies, newAccount.status]);

        if (role === 'doctor') {
          await pool.query(`
            INSERT INTO doctors (id, name, email, phone, qualification, specialty, rating, experience)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
              qualification = EXCLUDED.qualification, specialty = EXCLUDED.specialty,
              rating = EXCLUDED.rating, experience = EXCLUDED.experience
          `, [newAccount.id, newAccount.name, newAccount.email, newAccount.phone, newAccount.qualification, newAccount.specialty, newAccount.rating, newAccount.experience]);
        } else if (role === 'therapist') {
          await pool.query(`
            INSERT INTO therapists (id, name, email, phone, qualification, specialty, rating, experience, therapies)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
              qualification = EXCLUDED.qualification, specialty = EXCLUDED.specialty,
              rating = EXCLUDED.rating, experience = EXCLUDED.experience, therapies = EXCLUDED.therapies
          `, [newAccount.id, newAccount.name, newAccount.email, newAccount.phone, newAccount.qualification, newAccount.specialty, newAccount.rating, newAccount.experience, newAccount.therapies]);
        }
      } catch (dbErr) {
        console.warn('[Provider Signup DB Sync Notice]', dbErr.message);
      }
    }

    const { passwordHash: _, ...safeAccount } = newAccount;
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! Please log in.',
      provider: { ...safeAccount }
    });

  } catch (error) {
    console.error('Provider signup error:', error);
    res.status(500).json({ message: 'Error creating account. Please try again.' });
  }
};

// =========================================================
// 2. POST /api/provider/login
//    Authenticate a Doctor or Therapist by email + password
// =========================================================
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check pool first if available
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT * FROM provider_accounts WHERE LOWER(email) = $1 AND role = $2 LIMIT 1',
          [emailLower, role]
        );
        if (result.rowCount > 0) {
          const account = result.rows[0];
          const passwordMatch = await bcrypt.compare(password, account.password_hash);
          if (!passwordMatch) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
          }
          return res.json({
            success: true,
            message: `Welcome back, ${account.name}!`,
            provider: {
              id: account.id,
              name: account.name,
              email: account.email,
              role: account.role,
              phone: account.phone || '',
              qualification: account.qualification || '',
              specialty: account.specialty,
              experience: account.experience,
              therapies: account.therapies || [],
              rating: account.rating ? parseFloat(account.rating) : 4.5
            }
          });
        }
      } catch (dbErr) {
        console.warn('[Provider Login DB fallback]', dbErr.message);
      }
    }

    // Local JSON fallback
    const accounts = readFileHelper(accountsFilePath, []);
    const account = accounts.find(
      a => a.email.toLowerCase() === emailLower && a.role === role
    );

    if (!account) {
      return res.status(401).json({ message: 'No account found with this email and role. Please sign up.' });
    }

    const passwordMatch = await bcrypt.compare(password, account.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const { passwordHash: _, ...safeAccount } = account;
    return res.json({
      success: true,
      message: `Welcome back, ${account.name}!`,
      provider: { ...safeAccount }
    });

  } catch (error) {
    console.error('Provider login error:', error);
    res.status(500).json({ message: 'Authentication error. Please try again.' });
  }
};

// =========================================================
// 3. POST /api/provider/forgot-password
//    Sends a 6-digit OTP to the registered email (simulated)
// =========================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required.' });
    }

    // Verify account exists
    let accountExists = false;
    if (!isConfigured) {
      const accounts = readFileHelper(accountsFilePath, []);
      accountExists = accounts.some(
        a => a.email.toLowerCase() === email.toLowerCase() && a.role === role
      );
    } else {
      const { data } = await supabase
        .from('provider_accounts')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('role', role)
        .maybeSingle();
      accountExists = !!data;
    }

    if (!accountExists) {
      return res.status(404).json({ message: 'No account found with this email and role.' });
    }

    // Generate and store OTP (valid 10 minutes)
    const otp = generateOtp();
    otpStore[email.toLowerCase()] = {
      otp,
      role,
      expires: Date.now() + 10 * 60 * 1000
    };

    // In production: send via nodemailer/SendGrid
    // For now, we return it in the response (demo mode)
    console.log(`[FORGOT PASSWORD OTP] Email: ${email} | OTP: ${otp}`);

    res.json({
      success: true,
      message: 'A 6-digit OTP has been sent to your registered email.',
      // DEMO ONLY: expose OTP in response for testing without email setup
      demoOtp: otp
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing reset request.' });
  }
};

// =========================================================
// 4. POST /api/provider/reset-password
//    Verifies OTP and sets new password
// =========================================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, role } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const stored = otpStore[email.toLowerCase()];
    if (!stored) {
      return res.status(400).json({ message: 'No password reset was requested for this email.' });
    }
    if (Date.now() > stored.expires) {
      delete otpStore[email.toLowerCase()];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    delete otpStore[email.toLowerCase()]; // Remove used OTP

    if (!isConfigured) {
      const accounts = readFileHelper(accountsFilePath, []);
      const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase() && a.role === role);
      if (idx === -1) return res.status(404).json({ message: 'Account not found.' });

      accounts[idx].passwordHash = hashedPassword;
      writeFileHelper(accountsFilePath, accounts);
      return res.json({ success: true, message: 'Password reset successfully! Please log in.' });
    }

    const { error } = await supabase
      .from('provider_accounts')
      .update({ password_hash: hashedPassword })
      .eq('email', email.toLowerCase())
      .eq('role', role);

    if (error) throw error;

    res.json({ success: true, message: 'Password reset successfully! Please log in.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
};

// =========================================================
// 4b. POST /api/provider/change-password
//     Updates the password from profile panel
// =========================================================
exports.changePassword = async (req, res) => {
  try {
    const { email, role, currentPassword, newPassword } = req.body;
    if (!email || !role || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All password fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    if (!isConfigured) {
      const accounts = readFileHelper(accountsFilePath, []);
      const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase().trim() && a.role === role);
      if (idx === -1) return res.status(404).json({ message: 'Account not found.' });

      const match = await bcrypt.compare(currentPassword, accounts[idx].passwordHash);
      if (!match) return res.status(401).json({ message: 'Incorrect current password.' });

      accounts[idx].passwordHash = await bcrypt.hash(newPassword, 10);
      writeFileHelper(accountsFilePath, accounts);
      return res.json({ success: true, message: 'Password updated successfully!' });
    }

    const { data: account, error } = await supabase
      .from('provider_accounts')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('role', role)
      .maybeSingle();

    if (error) throw error;
    if (!account) return res.status(404).json({ message: 'Account not found.' });

    const match = await bcrypt.compare(currentPassword, account.password_hash);
    if (!match) return res.status(401).json({ message: 'Incorrect current password.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from('provider_accounts')
      .update({ password_hash: hashedPassword })
      .eq('email', email.toLowerCase().trim())
      .eq('role', role);

    if (updateErr) throw updateErr;

    res.json({ success: true, message: 'Password updated successfully!' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error updating password.' });
  }
};

// =========================================================
// 5. GET /api/provider/bookings
//    Fetch assigned bookings for a provider
// =========================================================
exports.getBookings = async (req, res) => {
  try {
    const { providerId, role } = req.query;
    if (!providerId || !role) {
      return res.status(400).json({ message: 'Provider ID and Role are required' });
    }

    const pId = parseInt(providerId);

    if (!isConfigured) {
      const accounts = readFileHelper(accountsFilePath, []);
      const account = accounts.find(a => a.id === pId);
      const accountName = account ? account.name.toLowerCase() : '';

      if (role === 'doctor') {
        const list = readFileHelper(bookingsFilePath);
        let filtered = list.filter(b => b.doctorId === pId || (accountName && b.doctorName && b.doctorName.toLowerCase().includes(accountName)));
        if (filtered.length === 0) filtered = list; // Fallback to display active appointments if no strict ID filter match
        return res.json(filtered);
      } else {
        const list = readFileHelper(therapistBookingsFilePath);
        let filtered = list.filter(b => b.therapistId === pId || (accountName && b.therapistName && b.therapistName.toLowerCase().includes(accountName)));
        if (filtered.length === 0) filtered = list; // Fallback to display active therapy sessions if no strict ID filter match
        return res.json(filtered);
      }
    }

    if (role === 'doctor') {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('doctor_id', pId)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) throw error;
      const formatted = data.map(b => ({
        id: b.id, doctorId: b.doctor_id, doctorName: b.doctor_name,
        date: b.date, timeSlot: b.time_slot, patientName: b.patient_name,
        patientEmail: b.patient_email, symptom: b.symptom,
        status: b.status || 'Scheduled', prescription: b.prescription || '',
        videoRoomId: b.video_room_id || '', bookedAt: b.booked_at
      }));
      return res.json(formatted);
    } else {
      const { data, error } = await supabase
        .from('therapist_bookings')
        .select('*')
        .eq('therapist_id', pId)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) throw error;
      const formatted = data.map(t => ({
        id: t.id, therapistId: t.therapist_id, therapistName: t.therapist_name,
        date: t.date, timeSlot: t.time_slot, patientName: t.patient_name,
        patientEmail: t.patient_email, therapyType: t.therapy_type,
        address: t.address || '', status: t.status || 'Pending',
        otpCode: t.otp_code || '', feedback: t.feedback || '',
        rating: t.rating || 5, bookedAt: t.booked_at
      }));
      return res.json(formatted);
    }

  } catch (error) {
    console.error('Get provider bookings error:', error);
    res.status(500).json({ message: 'Error retrieving schedules' });
  }
};

// =========================================================
// 6. PUT /api/provider/doctor/booking/:id
//    Update consultation call state + prescription
// =========================================================
exports.updateDoctorBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, prescription } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    let videoRoomId = '';
    if (status === 'In-Call') videoRoomId = `VedNidan_Consultation_${id}`;

    if (!isConfigured) {
      const bookings = readFileHelper(bookingsFilePath);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return res.status(404).json({ message: 'Booking not found' });

      bookings[idx].status = status;
      if (videoRoomId) bookings[idx].videoRoomId = videoRoomId;
      if (prescription !== undefined) bookings[idx].prescription = prescription;

      writeFileHelper(bookingsFilePath, bookings);
      return res.json({ success: true, booking: bookings[idx] });
    }

    const updates = { status };
    if (videoRoomId) updates.video_room_id = videoRoomId;
    if (prescription !== undefined) updates.prescription = prescription;

    const { data, error } = await supabase
      .from('bookings').update(updates).eq('id', id).select('*').single();
    if (error) throw error;

    res.json({ success: true, booking: { id: data.id, status: data.status, videoRoomId: data.video_room_id, prescription: data.prescription } });
  } catch (error) {
    console.error('Update doctor booking error:', error);
    res.status(500).json({ message: 'Error saving session notes' });
  }
};

// =========================================================
// 7. PUT /api/provider/therapist/booking/:id
//    Update therapy dispatch status (with OTP verification)
// =========================================================
exports.updateTherapistBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, otpCode, feedback, rating } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    if (!isConfigured) {
      const list = readFileHelper(therapistBookingsFilePath);
      const idx = list.findIndex(b => b.id === id);
      if (idx === -1) return res.status(404).json({ message: 'Booking not found' });

      const currentBooking = list[idx];
      if (status === 'In Progress') {
        const storedOtp = currentBooking.otpCode || currentBooking.otp_code;
        if (!otpCode || String(otpCode).trim() !== String(storedOtp).trim()) {
          return res.status(400).json({ success: false, message: 'Invalid 4-digit Patient OTP. Session cannot begin!' });
        }
      }

      currentBooking.status = status;
      if (feedback !== undefined) currentBooking.feedback = feedback;
      if (rating !== undefined) currentBooking.rating = parseInt(rating);

      writeFileHelper(therapistBookingsFilePath, list);
      return res.json({ success: true, booking: currentBooking });
    }

    const { data: dbBooking, error: fetchErr } = await supabase
      .from('therapist_bookings').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    if (status === 'In Progress') {
      const storedOtp = dbBooking.otp_code;
      if (!otpCode || String(otpCode).trim() !== String(storedOtp).trim()) {
        return res.status(400).json({ success: false, message: 'Invalid 4-digit Patient OTP. Session cannot begin!' });
      }
    }

    const updates = { status };
    if (feedback !== undefined) updates.feedback = feedback;
    if (rating !== undefined) updates.rating = parseInt(rating);

    const { data: updated, error: updateErr } = await supabase
      .from('therapist_bookings').update(updates).eq('id', id).select('*').single();
    if (updateErr) throw updateErr;

    res.json({ success: true, booking: { id: updated.id, status: updated.status, feedback: updated.feedback, rating: updated.rating } });
  } catch (error) {
    console.error('Update therapist booking error:', error);
    res.status(500).json({ message: 'Error processing dispatch flow step' });
  }
};
