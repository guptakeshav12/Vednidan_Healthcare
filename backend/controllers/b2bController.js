const fs = require('fs');
const path = require('path');

const inquiriesFilePath = path.join(__dirname, '../data/b2b_inquiries.json');

function readInquiries() {
  try {
    if (!fs.existsSync(inquiriesFilePath)) return [];
    const data = fs.readFileSync(inquiriesFilePath, 'utf-8');
    return JSON.parse(data) || [];
  } catch (e) {
    return [];
  }
}

function writeInquiries(list) {
  fs.writeFileSync(inquiriesFilePath, JSON.stringify(list, null, 2), 'utf-8');
}

// POST /api/b2b/inquiry
exports.submitInquiry = (req, res) => {
  try {
    const { contactName, organizationName, phone, city, email, service, requirements } = req.body || {};
    if (!contactName || !organizationName || !phone || !service) {
      return res.status(400).json({ success: false, message: 'Name, Hospital/Firm name, Phone, and Service are required.' });
    }

    const inquiries = readInquiries();
    const newInquiry = {
      id: 'B2B-' + Date.now(),
      contactName: String(contactName).trim(),
      organizationName: String(organizationName).trim(),
      phone: String(phone).trim(),
      city: String(city || '').trim(),
      email: String(email || '').trim(),
      service: String(service).trim(),
      requirements: String(requirements || '').trim(),
      status: 'New',
      createdAt: new Date().toISOString()
    };

    inquiries.unshift(newInquiry);
    writeInquiries(inquiries);

    res.status(201).json({ success: true, inquiry: newInquiry, message: 'Consultation inquiry submitted successfully!' });
  } catch (err) {
    console.error('[B2B Inquiry] Submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit inquiry.' });
  }
};

// GET /api/b2b/inquiries (for Admin Panel)
exports.getInquiries = (req, res) => {
  try {
    res.json(readInquiries());
  } catch (err) {
    res.status(500).json({ message: 'Failed to load B2B inquiries.' });
  }
};

// PUT /api/b2b/inquiries/:id/status
exports.updateInquiryStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const inquiries = readInquiries();
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Inquiry not found' });

    inquiries[idx].status = status || inquiries[idx].status;
    writeInquiries(inquiries);
    res.json({ success: true, inquiry: inquiries[idx] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update inquiry status.' });
  }
};
