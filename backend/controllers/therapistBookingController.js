const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../config/supabase');

const therapistBookingsPath = path.join(__dirname, '../data/therapist_bookings.json');

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
  { id: 202, name: "Vaidya Meera Kulkarni", specialty: "Abhyanga & Oil Therapy Expert", rating: 4.8, experience: "18 years", therapies: ["Abhyanga", "Shirodhara", "Pizhichil", "Elakizhi"] },
  { id: 203, name: "Vaidya Ramesh Iyer", specialty: "Yoga & Pranayama Therapist", rating: 4.9, experience: "20 years", therapies: ["Yoga Therapy", "Pranayama", "Meditation", "Marma Chikitsa"] },
  { id: 204, name: "Vaidya Sunita Deshpande", specialty: "Nadi Pariksha & Diagnosis", rating: 4.7, experience: "15 years", therapies: ["Nadi Pariksha", "Nasyam", "Raktamokshana", "Agni Karma"] },
  { id: 205, name: "Vaidya Karthik Menon", specialty: "Kati Basti & Musculoskeletal Care", rating: 4.8, experience: "16 years", therapies: ["Kati Basti", "Janu Basti", "Greeva Basti", "Pinda Sweda"] },
  { id: 206, name: "Vaidya Lakshmi Nair", specialty: "Shirodhara & Stress Relief", rating: 4.9, experience: "22 years", therapies: ["Shirodhara", "Takradhara", "Shirovasti", "Thalam"] },
  { id: 207, name: "Vaidya Arjun Patel", specialty: "Netra Basti & Eye Care Specialist", rating: 4.7, experience: "12 years", therapies: ["Netra Basti", "Netra Tarpana", "Anjana", "Aschotana"] },
  { id: 208, name: "Vaidya Revathi Krishnan", specialty: "Women's Wellness & Fertility", rating: 4.9, experience: "19 years", therapies: ["Uttara Basti", "Yoni Pichu", "Udvartana", "Sthanika Basti"] }
];

const timeSlots = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getTherapists = async (req, res) => {
  try {
    if (!isConfigured) {
      return res.json({ therapists: localTherapists });
    }

    const { data: dbTherapists, error } = await supabase
      .from('therapists')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({ therapists: dbTherapists });
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
        therapists: localTherapists
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

    if (!isConfigured) {
      // Fallback
      const therapist = localTherapists.find(t => t.id === tIdInt);
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
      therapy_type: therapyType || "General Consultation"
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
