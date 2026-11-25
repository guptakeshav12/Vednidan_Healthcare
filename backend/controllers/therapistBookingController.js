const fs = require('fs');
const path = require('path');
const { supabase, isConfigured, pool, isPoolReady } = require('../config/supabase');

const therapistBookingsPath = path.join(__dirname, '../data/therapist_bookings.json');
const therapistsFilePath = path.join(__dirname, '../data/therapists.json');
const accountsFilePath = path.join(__dirname, '../data/provider_accounts.json');

const getLocalBookings = () => {
  if (!fs.existsSync(therapistBookingsPath)) {
    fs.writeFileSync(therapistBookingsPath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const jsonData = fs.readFileSync(therapistBookingsPath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (e) {
    return [];
  }
};

const saveLocalBookings = (bookings) => {
  fs.writeFileSync(therapistBookingsPath, JSON.stringify(bookings, null, 2));
};

// Hardcoded fallback list of therapists
const localTherapists = [
  { id: 201, name: "Vaidya Pradeep Sharma", specialty: "Panchakarma & Detox Specialist", rating: 4.9, experience: "25 years", fee: 799, therapies: ["Panchakarma", "Vamana", "Virechana", "Basti"], avatar: "assets/doctor_avatar.png" },
  { id: 202, name: "Vaidya Meera Kulkarni", specialty: "Abhyanga & Oil Therapy Expert", rating: 4.8, experience: "18 years", fee: 799, therapies: ["Abhyanga", "Shirodhara", "Pizhichil", "Elakizhi"], avatar: "assets/doctor_avatar.png" },
  { id: 203, name: "Vaidya Ramesh Iyer", specialty: "Yoga & Pranayama Therapist", rating: 4.9, experience: "20 years", fee: 799, therapies: ["Yoga Therapy", "Pranayama", "Meditation", "Marma Chikitsa"], avatar: "assets/doctor_avatar.png" }
];

const getLocalTherapists = () => {
  let list = [];
  if (fs.existsSync(therapistsFilePath)) {
    try { list = JSON.parse(fs.readFileSync(therapistsFilePath, 'utf-8')); } catch (e) { list = [...localTherapists]; }
  } else {
    list = [...localTherapists];
  }

  // Cross-merge with any registered therapist accounts
  if (fs.existsSync(accountsFilePath)) {
    try {
      const accounts = JSON.parse(fs.readFileSync(accountsFilePath, 'utf-8'));
      accounts.filter(a => a.role === 'therapist').forEach(acc => {
        if (!list.some(t => t.id === acc.id || (t.email && acc.email && t.email.toLowerCase() === acc.email.toLowerCase()))) {
          list.push({
            id: acc.id,
            name: acc.name,
            email: acc.email,
            phone: acc.phone || '',
            qualification: acc.qualification || 'Certified Panchakarma Vaidya',
            specialty: acc.specialty || 'General Ayurvedic Therapist',
            rating: acc.rating || 4.8,
            experience: acc.experience || '5 years',
            fee: 799,
            therapies: acc.therapies && acc.therapies.length ? acc.therapies : ["General Consultation", "Panchakarma", "Abhyanga"],
            avatar: acc.avatar || 'assets/doctor_avatar.png'
          });
        }
      });
    } catch (e) {}
  }

  return list.map(t => ({
    ...t,
    fee: t.fee || 799,
    avatar: t.avatar || 'assets/doctor_avatar.png',
    experience: t.experience ? (t.experience.includes('exp') || t.experience.includes('years') ? t.experience : `${t.experience} exp`) : '10 yrs exp',
    therapies: t.therapies && t.therapies.length ? t.therapies : ["Panchakarma", "Abhyanga", "Shirodhara"]
  }));
};

const timeSlots = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getTherapists = async (req, res) => {
  try {
    if (pool && isPoolReady && isPoolReady()) {
      try {
        const result = await pool.query('SELECT * FROM therapists ORDER BY id ASC');
        if (result.rowCount > 0) {
          const dbTherapists = result.rows.map(t => ({
            ...t,
            fee: t.fee || 799,
            avatar: t.avatar || 'assets/doctor_avatar.png'
          }));
          return res.json({ therapists: dbTherapists });
        }
      } catch (dbErr) {
        console.warn('[Booking getTherapists DB fallback]', dbErr.message);
      }
    }
    res.json({ therapists: getLocalTherapists() });
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ message: 'Error retrieving therapist list: ' + error.message });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { therapistId, date } = req.query;
    if (!therapistId || !date) {
      return res.status(400).json({ message: 'Therapist ID and Date are required' });
    }

    const tIdInt = parseInt(therapistId);
    const bookings = getLocalBookings();
    const bookedTimes = bookings
      .filter(b => b.therapistId === tIdInt && b.date === date)
      .map(b => b.timeSlot);

    const slotsStatus = timeSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));

    const therapists = getLocalTherapists();

    res.json({
      date,
      therapistId: tIdInt,
      slots: slotsStatus,
      therapists
    });

  } catch (error) {
    console.error('Error fetching therapist slots:', error);
    res.status(500).json({ message: 'Error retrieving therapist availability data: ' + error.message });
  }
};

exports.bookSession = async (req, res) => {
  try {
    const { 
      therapistId, 
      date, 
      timeSlot, 
      patientName, 
      patientEmail, 
      therapyType,
      address,
      paymentMethod,
      paymentStatus,
      paymentId,
      amount
    } = req.body;

    if (!therapistId || !date || !timeSlot || !patientName || !patientEmail) {
      return res.status(400).json({ 
        message: 'All fields are required: Therapist, date, time slot, patient name, and email' 
      });
    }

    const tIdInt = parseInt(therapistId);
    const therapist = getLocalTherapists().find(t => t.id === tIdInt);
    if (!therapist) {
      return res.status(404).json({ message: `Therapist with ID ${therapistId} not found in database.` });
    }

    const sessionAddress = address && address.trim() ? address.trim() : "In-Clinic / Registered Home Address";
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const bookings = getLocalBookings();
    const isAlreadyBooked = bookings.some(b => 
      b.therapistId === tIdInt && 
      b.date === date && 
      b.timeSlot === timeSlot
    );

    if (isAlreadyBooked) {
      return res.status(409).json({ 
        message: `The therapy slot ${timeSlot} on ${date} for ${therapist.name} is already booked. Please choose another time.` 
      });
    }

    const sessionFee = parseFloat(amount) || therapist.fee || 799;
    const finalPaymentMethod = paymentMethod || 'UPI Direct';
    const finalPaymentStatus = paymentStatus || 'Paid';
    const finalPaymentId = paymentId || `UPI-TH-${Date.now()}`;

    const newBooking = {
      id: Date.now(),
      therapistId: tIdInt,
      therapistName: therapist.name,
      date,
      timeSlot,
      patientName,
      patientEmail,
      therapyType: therapyType || "General Consultation",
      address: sessionAddress,
      amount: sessionFee,
      paymentMethod: finalPaymentMethod,
      paymentStatus: finalPaymentStatus,
      paymentId: finalPaymentId,
      status: "Confirmed",
      otpCode: otpCode,
      feedback: "",
      rating: 5,
      bookedAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveLocalBookings(bookings);

    // Sync to Supabase if configured & ready
    if (isConfigured && supabase) {
      try {
        await supabase.from('therapist_bookings').insert({
          id: newBooking.id,
          therapist_id: tIdInt,
          therapist_name: therapist.name,
          date,
          time_slot: timeSlot,
          patient_name: patientName,
          patient_email: patientEmail,
          therapy_type: newBooking.therapyType,
          address: sessionAddress,
          status: 'Confirmed',
          otp_code: otpCode,
          feedback: "",
          rating: 5
        });
      } catch (err) {
        console.warn('[Supabase Sync therapist booking]', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Therapy session booked successfully!',
      booking: newBooking
    });

  } catch (error) {
    console.error('Therapist booking error:', error);
    res.status(500).json({ message: 'Error recording therapy session booking: ' + error.message });
  }
};

// =========================================================
// 4. POST /api/therapist-booking/feedback
//    Patient submits rating & review after session completion
// =========================================================
exports.submitPatientFeedback = async (req, res) => {
  try {
    const { bookingId, rating, feedback } = req.body;
    const bId = parseInt(bookingId);

    if (!bId) {
      return res.status(400).json({ message: 'Valid booking ID is required.' });
    }

    const bookings = getLocalBookings();
    const index = bookings.findIndex(b => b.id === bId);

    if (index === -1) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating) || 5));
    bookings[index].patientRating = numericRating;
    bookings[index].patientFeedback = (feedback || '').trim();
    bookings[index].patientFeedbackAt = new Date().toISOString();

    saveLocalBookings(bookings);

    // Update therapist's average rating if therapist ID exists
    const therapistId = bookings[index].therapistId || bookings[index].therapist_id;
    if (therapistId) {
      try {
        const therapists = getLocalTherapists();
        const tIndex = therapists.findIndex(t => t.id === Number(therapistId));
        if (tIndex !== -1) {
          const currentRating = parseFloat(therapists[tIndex].rating) || 4.8;
          therapists[tIndex].rating = parseFloat(((currentRating * 4 + numericRating) / 5).toFixed(1));
          fs.writeFileSync(therapistsFilePath, JSON.stringify(therapists, null, 2));
        }
      } catch (e) {}
    }

    // Direct DB sync if pool is available
    if (pool && isPoolReady && isPoolReady()) {
      try {
        await pool.query(
          'UPDATE therapist_bookings SET feedback = $1, rating = $2 WHERE id = $3',
          [bookings[index].patientFeedback, numericRating, bId]
        );
      } catch (dbErr) {
        console.warn('[Feedback DB update notice]', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Thank you for your valuable feedback! It has been recorded.',
      booking: bookings[index]
    });

  } catch (error) {
    console.error('Patient feedback error:', error);
    res.status(500).json({ message: 'Failed to record feedback: ' + error.message });
  }
};
