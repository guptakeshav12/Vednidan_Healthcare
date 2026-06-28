const fs = require('fs');
const path = require('path');

const therapistBookingsPath = path.join(__dirname, '../data/therapist_bookings.json');

const getBookings = () => {
  if (!fs.existsSync(therapistBookingsPath)) {
    fs.writeFileSync(therapistBookingsPath, JSON.stringify([], null, 2));
    return [];
  }
  const jsonData = fs.readFileSync(therapistBookingsPath, 'utf-8');
  return JSON.parse(jsonData);
};

const saveBookings = (bookings) => {
  fs.writeFileSync(therapistBookingsPath, JSON.stringify(bookings, null, 2));
};

// Therapists database
const therapists = [
  { id: 201, name: "Vaidya Pradeep Sharma", specialty: "Panchakarma & Detox Specialist", rating: 4.9, experience: "25 years", therapies: ["Panchakarma", "Vamana", "Virechana", "Basti"] },
  { id: 202, name: "Vaidya Meera Kulkarni", specialty: "Abhyanga & Oil Therapy Expert", rating: 4.8, experience: "18 years", therapies: ["Abhyanga", "Shirodhara", "Pizhichil", "Elakizhi"] },
  { id: 203, name: "Vaidya Ramesh Iyer", specialty: "Yoga & Pranayama Therapist", rating: 4.9, experience: "20 years", therapies: ["Yoga Therapy", "Pranayama", "Meditation", "Marma Chikitsa"] },
  { id: 204, name: "Vaidya Sunita Deshpande", specialty: "Nadi Pariksha & Diagnosis", rating: 4.7, experience: "15 years", therapies: ["Nadi Pariksha", "Nasyam", "Raktamokshana", "Agni Karma"] },
  { id: 205, name: "Vaidya Karthik Menon", specialty: "Kati Basti & Musculoskeletal Care", rating: 4.8, experience: "16 years", therapies: ["Kati Basti", "Janu Basti", "Greeva Basti", "Pinda Sweda"] },
  { id: 206, name: "Vaidya Lakshmi Nair", specialty: "Shirodhara & Stress Relief", rating: 4.9, experience: "22 years", therapies: ["Shirodhara", "Takradhara", "Shirovasti", "Thalam"] },
  { id: 207, name: "Vaidya Arjun Patel", specialty: "Netra Basti & Eye Care Specialist", rating: 4.7, experience: "12 years", therapies: ["Netra Basti", "Netra Tarpana", "Anjana", "Aschotana"] },
  { id: 208, name: "Vaidya Revathi Krishnan", specialty: "Women's Wellness & Fertility", rating: 4.9, experience: "19 years", therapies: ["Uttara Basti", "Yoni Pichu", "Udvartana", "Sthanika Basti"] }
];

// Available session time slots
const timeSlots = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

exports.getTherapists = (req, res) => {
  res.json({ therapists });
};

exports.getAvailableSlots = (req, res) => {
  try {
    const { therapistId, date } = req.query;
    if (!therapistId || !date) {
      return res.status(400).json({ message: 'Therapist ID and Date are required' });
    }

    const bookings = getBookings();
    const tIdInt = parseInt(therapistId);

    // Find slots already booked for this therapist on this date
    const bookedTimes = bookings
      .filter(b => b.therapistId === tIdInt && b.date === date)
      .map(b => b.timeSlot);

    // Map timeSlots indicating availability
    const slotsStatus = timeSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));

    res.json({
      date,
      therapistId: tIdInt,
      slots: slotsStatus,
      therapists
    });
  } catch (error) {
    console.error('Error fetching therapist slots:', error);
    res.status(500).json({ message: 'Error retrieving therapist availability data' });
  }
};

exports.bookSession = (req, res) => {
  try {
    const { therapistId, date, timeSlot, patientName, patientEmail, therapyType } = req.body;
    if (!therapistId || !date || !timeSlot || !patientName || !patientEmail) {
      return res.status(400).json({ message: 'Therapist ID, date, time slot, patient name, and email are required' });
    }

    const tIdInt = parseInt(therapistId);
    const therapist = therapists.find(t => t.id === tIdInt);
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    const bookings = getBookings();

    // Double check availability
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
    saveBookings(bookings);

    res.status(201).json({
      success: true,
      message: 'Therapy session booked successfully!',
      booking: newBooking
    });
  } catch (error) {
    console.error('Therapist booking error:', error);
    res.status(500).json({ message: 'Error recording therapy session booking' });
  }
};
