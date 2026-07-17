const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../config/supabase');

const bookingsFilePath = path.join(__dirname, '../data/bookings.json');

const getLocalBookings = () => {
  if (!fs.existsSync(bookingsFilePath)) {
    fs.writeFileSync(bookingsFilePath, JSON.stringify([], null, 2));
    return [];
  }
  const jsonData = fs.readFileSync(bookingsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

const saveLocalBookings = (bookings) => {
  fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2));
};

// Hardcoded fallback list of doctors
const localDoctors = [
  { id: 101, name: "Dr. Vasudev Shashtri", specialty: "Nadi Pariksha & Pulse Diagnosis", rating: 4.9, experience: "22 years" },
  { id: 102, name: "Dr. Ananya Mishra", specialty: "Ayurvedic Skincare & Hair Care Expert", rating: 4.8, experience: "14 years" },
  { id: 103, name: "Dr. Raghavan Nair", specialty: "Panchakarma & Chronic Pain Specialist", rating: 4.9, experience: "18 years" }
];

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and Date are required' });
    }

    const docIdInt = parseInt(doctorId);

    if (!isConfigured) {
      // Fallback
      const bookings = getLocalBookings();
      const bookedTimes = bookings
        .filter(b => b.doctorId === docIdInt && b.date === date)
        .map(b => b.timeSlot);

      const slotsStatus = timeSlots.map(time => ({
        time,
        isAvailable: !bookedTimes.includes(time)
      }));

      return res.json({
        date,
        doctorId: docIdInt,
        slots: slotsStatus,
        doctors: localDoctors
      });
    }

    // Connect to Supabase
    // 1. Fetch current doctor details or all doctors
    const { data: dbDoctors, error: docError } = await supabase
      .from('doctors')
      .select('*')
      .order('id', { ascending: true });

    if (docError) throw docError;

    // 2. Find slots booked for this doctor on this date
    const { data: dbBookings, error: bookError } = await supabase
      .from('bookings')
      .select('time_slot')
      .eq('doctor_id', docIdInt)
      .eq('date', date);

    if (bookError) throw bookError;

    const bookedTimes = dbBookings.map(b => b.time_slot);

    const slotsStatus = timeSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));

    res.json({
      date,
      doctorId: docIdInt,
      slots: slotsStatus,
      doctors: dbDoctors
    });

  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Error retrieving availability data' });
  }
};

exports.bookConsultation = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, patientName, patientEmail, symptom } = req.body;
    if (!doctorId || !date || !timeSlot || !patientName || !patientEmail) {
      return res.status(400).json({ message: 'Doctor ID, date, time slot, patient name, and email are required' });
    }

    const docIdInt = parseInt(doctorId);

    if (!isConfigured) {
      // Fallback
      const doctor = localDoctors.find(d => d.id === docIdInt);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const bookings = getLocalBookings();
      const isAlreadyBooked = bookings.some(b => 
        b.doctorId === docIdInt && 
        b.date === date && 
        b.timeSlot === timeSlot
      );

      if (isAlreadyBooked) {
        return res.status(409).json({ message: 'This slot is already booked. Please choose another time.' });
      }

      const newBooking = {
        id: Date.now(),
        doctorId: docIdInt,
        doctorName: doctor.name,
        date,
        timeSlot,
        patientName,
        patientEmail,
        symptom: symptom || "General wellness review",
        bookedAt: new Date().toISOString()
      };

      bookings.push(newBooking);
      saveLocalBookings(bookings);

      return res.status(201).json({
        success: true,
        message: 'Consultation slot booked successfully!',
        booking: newBooking
      });
    }

    // Connect to Supabase
    // 1. Verify doctor exists
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select('name')
      .eq('id', docIdInt)
      .maybeSingle();

    if (docError) throw docError;
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // 2. Verify slot availability
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('doctor_id', docIdInt)
      .eq('date', date)
      .eq('time_slot', timeSlot)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingBooking) {
      return res.status(409).json({ message: 'This slot is already booked. Please choose another time.' });
    }

    // 3. Save booking
    const newBooking = {
      id: Date.now(),
      doctor_id: docIdInt,
      doctor_name: doctor.name,
      date,
      time_slot: timeSlot,
      patient_name: patientName,
      patient_email: patientEmail,
      symptom: symptom || "General wellness review"
    };

    const { data: dbBooking, error: insertError } = await supabase
      .from('bookings')
      .insert(newBooking)
      .select('*')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'Consultation slot booked successfully!',
      booking: dbBooking
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Error recording consultation booking' });
  }
};
