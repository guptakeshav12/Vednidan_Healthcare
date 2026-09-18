const fs = require('fs');
const path = require('path');
const { supabase, isConfigured, pool } = require('../config/supabase');

const therapistBookingsPath = path.join(__dirname, '../data/therapist_bookings.json');
const therapistsFilePath = path.join(__dirname, '../data/therapists.json');

const getLocalBookings = () => {
  if (!fs.existsSync(therapistBookingsPath)) {
    fs.writeFileSync(therapistBookingsPath, JSON.stringify([], null, 2));
    return [];
  }
  const jsonData = fs.readFileSync(therapistBookingsPath, 'utf-8');
  return JSON.parse(jsonData);
};

const saveLocalBookings = (bookings) => {
  fs.writeFileSync(therapistBookingsPath, JSON.stringify(bookings, null, 2));
};

// Hardcoded fallback list of therapists
const localTherapists = [
  { id: 201, name: "Vaidya Pradeep Sharma", specialty: "Panchakarma & Detox Specialist", rating: 4.9, experience: "25 years", therapies: ["Panchakarma", "Vamana", "Virechana", "Basti"] },
  { id: 202, name: "Vaidya Meera Kulkarni", specialty: "Abhyanga & Oil Therapy Expert", rating: 4.8, experience: "18 years", therapies: ["Abhyanga", "Shirodhara", "Pizhichil", "Elakizhi"] }
];

const accountsFilePath = path.join(__dirname, '../data/provider_accounts.json');

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
            therapies: acc.therapies && acc.therapies.length ? acc.therapies : ["General Consultation", "Panchakarma", "Abhyanga"],
            avatar: acc.avatar || 'assets/doctor_avatar.png'
          });
        }
      });
    } catch (e) {}
  }
  return list;
};

const timeSlots = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getTherapists = async (req, res) => {
  try {
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM therapists ORDER BY id ASC');
        if (result.rowCount > 0) {
          return res.json({ therapists: result.rows });
        }
      } catch (dbErr) {
        console.warn('[Booking getTherapists DB fallback]', dbErr.message);
      }
    }
    res.json({ therapists: getLocalTherapists() });
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ message: 'Error retrieving therapist list' });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { therapistId, date } = req.query;
    if (!therapistId || !date) {
      return res.status(400).json({ message: 'Therapist ID and Date are required' });
    }

    const tIdInt = parseInt(therapistId);

    if (!isConfigured) {
      // Fallback
      const bookings = getLocalBookings();
      const bookedTimes = bookings
        .filter(b => b.therapistId === tIdInt && b.date === date)
        .map(b => b.timeSlot);

      const slotsStatus = timeSlots.map(time => ({
        time,
        isAvailable: !bookedTimes.includes(time)
      }));

      return res.json({
        date,
        therapistId: tIdInt,
        slots: slotsStatus,
        therapists: getLocalTherapists()
      });
    }

    // Connect to Supabase
    // 1. Fetch therapists list
    const { data: dbTherapists, error: tError } = await supabase
      .from('therapists')
      .select('*')
      .order('id', { ascending: true });

    if (tError) throw tError;

    // 2. Fetch bookings for this therapist on this date
    const { data: dbBookings, error: bookError } = await supabase
      .from('therapist_bookings')
      .select('time_slot')
      .eq('therapist_id', tIdInt)
      .eq('date', date);

    if (bookError) throw bookError;

    const bookedTimes = dbBookings.map(b => b.time_slot);

    const slotsStatus = timeSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));

    res.json({
      date,
      therapistId: tIdInt,
      slots: slotsStatus,
      therapists: dbTherapists
    });

  } catch (error) {
    console.error('Error fetching therapist slots:', error);
    res.status(500).json({ message: 'Error retrieving therapist availability data' });
  }
};

exports.bookSession = async (req, res) => {
  try {
    const { therapistId, date, timeSlot, patientName, patientEmail, therapyType } = req.body;
    if (!therapistId || !date || !timeSlot || !patientName || !patientEmail) {
      return res.status(400).json({ message: 'Therapist ID, date, time slot, patient name, and email are required' });
    }

    const tIdInt = parseInt(therapistId);
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const sessionAddress = req.body.address || "In-Clinic Session";

    if (!isConfigured) {
      // Fallback
      const therapist = getLocalTherapists().find(t => t.id === tIdInt);
      if (!therapist) {
        return res.status(404).json({ message: 'Therapist not found' });
      }

      const bookings = getLocalBookings();
      const isAlreadyBooked = bookings.some(b => 
        b.therapistId === tIdInt && 
        b.date === date && 
        b.timeSlot === timeSlot
      );

      if (isAlreadyBooked) {
        return res.status(409).json({ message: 'This therapy slot is already booked. Please choose another time.' });
      }

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
        status: "Pending",
        otpCode: otpCode,
        feedback: "",
        rating: 5,
        bookedAt: new Date().toISOString()
      };

      bookings.push(newBooking);
      saveLocalBookings(bookings);

      return res.status(201).json({
        success: true,
        message: 'Therapy session booked successfully!',
        booking: newBooking
      });
    }

    // Connect to Supabase
    // 1. Verify therapist exists
    const { data: therapist, error: tError } = await supabase
      .from('therapists')
      .select('name')
      .eq('id', tIdInt)
      .maybeSingle();

    if (tError) throw tError;
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    // 2. Verify slot availability
    const { data: existingBooking, error: checkError } = await supabase
      .from('therapist_bookings')
      .select('id')
      .eq('therapist_id', tIdInt)
      .eq('date', date)
      .eq('time_slot', timeSlot)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingBooking) {
      return res.status(409).json({ message: 'This therapy slot is already booked. Please choose another time.' });
    }

    // 3. Save booking
    const newBooking = {
      id: Date.now(),
      therapist_id: tIdInt,
      therapist_name: therapist.name,
      date,
      time_slot: timeSlot,
      patient_name: patientName,
      patient_email: patientEmail,
      therapy_type: therapyType || "General Consultation",
      address: sessionAddress,
      status: 'Pending',
      otp_code: otpCode,
      feedback: "",
      rating: 5
    };

    const { data: dbBooking, error: insertError } = await supabase
      .from('therapist_bookings')
      .insert(newBooking)
      .select('*')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'Therapy session booked successfully!',
      booking: dbBooking
    });

  } catch (error) {
    console.error('Therapist booking error:', error);
    res.status(500).json({ message: 'Error recording therapy session booking' });
  }
};
