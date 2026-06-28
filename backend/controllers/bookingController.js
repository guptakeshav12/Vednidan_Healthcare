const fs = require('fs');
const path = require('path');

const bookingsFilePath = path.join(__dirname, '../data/bookings.json');

const getBookings = () => {
  if (!fs.existsSync(bookingsFilePath)) {
    fs.writeFileSync(bookingsFilePath, JSON.stringify([], null, 2));
    return [];
  }
  const jsonData = fs.readFileSync(bookingsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

const saveBookings = (bookings) => {
  fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2));
};

// Doctors database list
const doctors = [
  { id: 101, name: "Dr. Vasudev Shashtri", specialty: "Nadi Pariksha & Pulse Diagnosis", rating: 4.9, experience: "22 years" },
  { id: 102, name: "Dr. Ananya Mishra", specialty: "Ayurvedic Skincare & Hair Care Expert", rating: 4.8, experience: "14 years" },
  { id: 103, name: "Dr. Raghavan Nair", specialty: "Panchakarma & Chronic Pain Specialist", rating: 4.9, experience: "18 years" }
];

// Available standard slot timings
const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getAvailableSlots = (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and Date are required' });
    }

    const bookings = getBookings();
    const docIdInt = parseInt(doctorId);

    // Find slots that are already booked for this doctor on this date
    const bookedTimes = bookings
      .filter(b => b.doctorId === docIdInt && b.date === date)
      .map(b => b.timeSlot);

    // Map timeSlots indicating if they are available
    const slotsStatus = timeSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));

    res.json({
      date,
      doctorId: docIdInt,
      slots: slotsStatus,
      doctors
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Error retrieving availability data' });
  }
};

exports.bookConsultation = (req, res) => {
  try {
    const { doctorId, date, timeSlot, patientName, patientEmail, symptom } = req.body;
    if (!doctorId || !date || !timeSlot || !patientName || !patientEmail) {
      return res.status(400).json({ message: 'Doctor ID, date, time slot, patient name, and email are required' });
    }

    const docIdInt = parseInt(doctorId);
    const doctor = doctors.find(d => d.id === docIdInt);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const bookings = getBookings();

    // Double check availability
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
    saveBookings(bookings);

    res.status(201).json({
      success: true,
      message: 'Consultation slot booked successfully!',
      booking: newBooking
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Error recording consultation booking' });
  }
};
