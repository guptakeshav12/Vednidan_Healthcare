const fs = require('fs');
const path = require('path');
const { supabase, isConfigured, pool, isPoolReady } = require('../config/supabase');

const bookingsFilePath = path.join(__dirname, '../data/bookings.json');
const doctorsFilePath = path.join(__dirname, '../data/doctors.json');
const accountsFilePath = path.join(__dirname, '../data/provider_accounts.json');

const getLocalBookings = () => {
  if (!fs.existsSync(bookingsFilePath)) {
    fs.writeFileSync(bookingsFilePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const jsonData = fs.readFileSync(bookingsFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (e) {
    return [];
  }
};

const saveLocalBookings = (bookings) => {
  fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2));
};

// Standard default doctor list
const localDoctors = [
  { id: 101, name: "Dr. Vasudev Shashtri", specialty: "Nadi Pariksha & Pulse Diagnosis", rating: 4.9, experience: "22 years", fee: 499, avatar: "assets/doctor_avatar.png" },
  { id: 102, name: "Dr. Ananya Mishra", specialty: "Ayurvedic Skincare & Hair Care Expert", rating: 4.8, experience: "14 years", fee: 499, avatar: "assets/doctor_avatar.png" },
  { id: 103, name: "Dr. Raghavan Nair", specialty: "Panchakarma & Chronic Pain Specialist", rating: 4.9, experience: "18 years", fee: 499, avatar: "assets/doctor_avatar.png" }
];

const getLocalDoctors = () => {
  let list = [];
  if (fs.existsSync(doctorsFilePath)) {
    try { list = JSON.parse(fs.readFileSync(doctorsFilePath, 'utf-8')); } catch (e) { list = [...localDoctors]; }
  } else {
    list = [...localDoctors];
  }

  // Cross-merge with any registered doctor accounts
  if (fs.existsSync(accountsFilePath)) {
    try {
      const accounts = JSON.parse(fs.readFileSync(accountsFilePath, 'utf-8'));
      accounts.filter(a => a.role === 'doctor').forEach(acc => {
        if (!list.some(d => d.id === acc.id || (d.email && acc.email && d.email.toLowerCase() === acc.email.toLowerCase()))) {
          list.push({
            id: acc.id,
            name: acc.name,
            email: acc.email,
            phone: acc.phone || '',
            qualification: acc.qualification || 'BAMS, Ayurvedic Physician',
            specialty: acc.specialty || 'General Ayurvedic Consultation',
            rating: acc.rating || 4.8,
            experience: acc.experience || '5 years',
            fee: 499,
            avatar: acc.avatar || 'assets/doctor_avatar.png'
          });
        }
      });
    } catch (e) {}
  }

  // Ensure every doctor has fee and avatar
  return list.map(d => ({
    ...d,
    fee: d.fee || 499,
    avatar: d.avatar || 'assets/doctor_avatar.png',
    experience: d.experience ? (d.experience.includes('exp') || d.experience.includes('years') ? d.experience : `${d.experience} exp`) : '10 yrs exp'
  }));
};

exports.getDoctors = async (req, res) => {
  try {
    if (pool && isPoolReady && isPoolReady()) {
      try {
        const result = await pool.query('SELECT * FROM doctors ORDER BY id ASC');
        if (result.rowCount > 0) {
          const dbDocs = result.rows.map(d => ({
            ...d,
            fee: d.fee || 499,
            avatar: d.avatar || 'assets/doctor_avatar.png'
          }));
          return res.json({ doctors: dbDocs });
        }
      } catch (dbErr) {
        console.warn('[Booking getDoctors DB fallback]', dbErr.message);
      }
    }
    res.json({ doctors: getLocalDoctors() });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error retrieving doctor list: ' + error.message });
  }
};

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and Date are required' });
    }

    const docIdInt = parseInt(doctorId);

    // Read bookings (local is always fast & synchronized)
    const bookings = getLocalBookings();
    const bookedTimes = bookings
      .filter(b => b.doctorId === docIdInt && b.date === date)
      .map(b => b.timeSlot);

    const slotsStatus = timeSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));

    const doctors = getLocalDoctors();

    res.json({
      date,
      doctorId: docIdInt,
      slots: slotsStatus,
      doctors
    });

  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Error retrieving availability data: ' + error.message });
  }
};

exports.bookConsultation = async (req, res) => {
  try {
    const { 
      doctorId, 
      date, 
      timeSlot, 
      patientName, 
      patientEmail, 
      symptom,
      paymentMethod,
      paymentStatus,
      paymentId,
      amount
    } = req.body;

    if (!doctorId || !date || !timeSlot || !patientName || !patientEmail) {
      return res.status(400).json({ 
        message: 'All fields are required: Doctor, date, time slot, patient name, and email' 
      });
    }

    const docIdInt = parseInt(doctorId);
    const doctor = getLocalDoctors().find(d => d.id === docIdInt);
    if (!doctor) {
      return res.status(404).json({ message: `Doctor with ID ${doctorId} not found in database.` });
    }

    const bookings = getLocalBookings();
    const isAlreadyBooked = bookings.some(b => 
      b.doctorId === docIdInt && 
      b.date === date && 
      b.timeSlot === timeSlot
    );

    if (isAlreadyBooked) {
      return res.status(409).json({ 
        message: `The slot ${timeSlot} on ${date} for ${doctor.name} is already booked. Please choose another time slot.` 
      });
    }

    const bookingFee = parseFloat(amount) || doctor.fee || 499;
    const finalPaymentMethod = paymentMethod || 'UPI Direct';
    const finalPaymentStatus = paymentStatus || 'Paid';
    const finalPaymentId = paymentId || `UPI-DOC-${Date.now()}`;

    const newBooking = {
      id: Date.now(),
      doctorId: docIdInt,
      doctorName: doctor.name,
      date,
      timeSlot,
      patientName,
      patientEmail,
      symptom: symptom || "General consultation",
      amount: bookingFee,
      paymentMethod: finalPaymentMethod,
      paymentStatus: finalPaymentStatus,
      paymentId: finalPaymentId,
      status: "Scheduled",
      prescription: "",
      videoRoomId: `vednidan-call-${Date.now()}`,
      bookedAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveLocalBookings(bookings);

    // Sync to Supabase if configured & ready
    if (isConfigured && supabase) {
      try {
        await supabase.from('bookings').insert({
          id: newBooking.id,
          doctor_id: docIdInt,
          doctor_name: doctor.name,
          date,
          time_slot: timeSlot,
          patient_name: patientName,
          patient_email: patientEmail,
          symptom: newBooking.symptom,
          status: "Scheduled",
          prescription: "",
          video_room_id: newBooking.videoRoomId
        });
      } catch (err) {
        console.warn('[Supabase Sync booking]', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Consultation slot booked successfully!',
      booking: newBooking
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Error recording consultation booking: ' + error.message });
  }
};
