const fs = require('fs');
const path = require('path');

const therapiesFilePath = path.join(__dirname, '../data/therapies.json');

const getTherapiesData = () => {
  const jsonData = fs.readFileSync(therapiesFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

exports.getAllTherapies = (req, res) => {
  try {
    const therapies = getTherapiesData();
    const indication = req.query.indication || 'all';
    const searchQuery = (req.query.search || '').toLowerCase().trim();

    let filtered = therapies;

    if (indication !== 'all') {
      filtered = filtered.filter(t => t.indication === indication);
    }

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery) || 
        t.description.toLowerCase().includes(searchQuery) ||
        t.action.toLowerCase().includes(searchQuery)
      );
    }

    // Limit to 20 therapies for viewing performance (pagination could be added, but limit is simple & solid)
    const limit = parseInt(req.query.limit) || 12;
    res.json(filtered.slice(0, limit));
  } catch (error) {
    console.error('Error fetching therapies:', error);
    res.status(500).json({ message: 'Error retrieving therapies data' });
  }
};
