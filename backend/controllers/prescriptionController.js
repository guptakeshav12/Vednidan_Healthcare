const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const productsFilePath = path.join(__dirname, '../data/products.json');

const getProducts = () => {
  const jsonData = fs.readFileSync(productsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

// Clean OCR artefacts (common misreads, stray chars, extra spaces)
function cleanOcrText(raw) {
  return raw
    .replace(/[|\\{}[\]<>]/g, ' ')      // remove common OCR noise symbols
    .replace(/(\d)\s+([/-])\s+(\d)/g, '$1$2$3') // fix split fractions like 1 - 0 - 1
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Dosage / frequency patterns  e.g. 1-0-1, BD, OD, TDS, QID, hs, af
const DOSE_RE = /\b(\d[\d/-]*\d|\d)\s*(?:tab|cap|tsp|ml|mg|gm|g|drops?)?\s*(?:x\s*)?\d*\s*(?:days?|weeks?|months?)?\b/gi;
const FREQ_RE = /\b(1[-–]0[-–]1|1[-–]1[-–]1|0[-–]0[-–]1|1[-–]0[-–]0|2[-–]0[-–]2|BD|TDS|OD|QID|HS|SOS|PRN|after\s+food|before\s+food|at\s+bed\s*time|twice\s+daily|thrice\s+daily|once\s+daily)\b/gi;

// Medicine-form prefix patterns (Ayurvedic + Allopathic)
const FORM_PREFIXES = [
  'Tab\\.?', 'Cap\\.?', 'Syp\\.?', 'Syrup', 'Drops?', 'Inj\\.?',
  'Churna', 'Churn', 'Powder', 'Vati', 'Guggulu', 'Gugul',
  'Kwath', 'Kashayam', 'Decoction',
  'Arka', 'Asava', 'Arishta', 'Aristha',
  'Taila', 'Oil', 'Ghrita', 'Ghee',
  'Bhasma', 'Pishti', 'Mandura',
  'Leha', 'Lehyam', 'Avaleha',
  'Pak', 'Rasayana', 'Rasa',
  'Gutika', 'Guti',
  'Satva', 'Extract',
];
const FORM_RE = new RegExp(`(?:^|\\s)(${FORM_PREFIXES.join('|')})\\s+`, 'gi');

// Lines that are clearly not medicine items (headers, dates, instructions, etc.)
const IGNORE_LINE_RE = /^(name|date|age|sex|m\/f|rx|r\/x|prescription|advised|patient|diagnosis|complain|chief|history|dr\.|ref\.|sign|address|phone|tel|mob|email|follow|review|repeat|next|visit|cheque|hospital|clinic|ayurved|vednidan|note|advice|do not|avoid|please|take|drink|apply|total|page|report)/i;

// Minimum name length to be considered a medicine
const MIN_NAME_LEN = 4;

// ─────────────────────────────────────────────────────────────────
// Parse lines of OCR text → array of medicine candidates
// ─────────────────────────────────────────────────────────────────
function parseOcrLines(text) {
  const medicines = [];
  const lines = text.split(/\r?\n/);

  for (let rawLine of lines) {
    const line = cleanOcrText(rawLine).trim();
    if (!line || line.length < 3) continue;
    if (IGNORE_LINE_RE.test(line)) continue;

    // Remove leading numbering like "1.", "2)", "(3)"
    const withoutNum = line.replace(/^[(]?\d+[.)]\s*/, '').trim();
    if (!withoutNum || withoutNum.length < MIN_NAME_LEN) continue;

    // Detect form type from prefix
    let form = 'General';
    let medLine = withoutNum;

    const formMatch = medLine.match(new RegExp(`^(${FORM_PREFIXES.join('|')})\\s+`, 'i'));
    if (formMatch) {
      const rawForm = formMatch[1].toLowerCase();
      if (/tab/i.test(rawForm)) form = 'Tablet';
      else if (/cap/i.test(rawForm)) form = 'Capsule';
      else if (/syp|syrup/i.test(rawForm)) form = 'Syrup';
      else if (/churna|churn|powder|satva/i.test(rawForm)) form = 'Powder/Churna';
      else if (/vati|gutika|guti/i.test(rawForm)) form = 'Vati/Tablet';
      else if (/guggulu|gugul/i.test(rawForm)) form = 'Guggulu';
      else if (/kwath|kashayam|decoction/i.test(rawForm)) form = 'Kwath/Decoction';
      else if (/arka|asava|arishta|aristha/i.test(rawForm)) form = 'Liquid/Asava';
      else if (/taila|oil/i.test(rawForm)) form = 'Oil/Taila';
      else if (/bhasma|pishti|mandura/i.test(rawForm)) form = 'Bhasma/Pishti';
      else if (/ghrita|ghee/i.test(rawForm)) form = 'Ghrita/Ghee';
      else if (/leha|lehyam|avaleha|pak|rasayana/i.test(rawForm)) form = 'Lehyam/Rasayana';
      else if (/drop/i.test(rawForm)) form = 'Drops';
      else if (/inj/i.test(rawForm)) form = 'Injection';
      else form = formMatch[1];

      medLine = medLine.slice(formMatch[0].length).trim();
    }

    // Extract dosage / frequency
    const freqMatches = medLine.match(FREQ_RE) || [];
    const doseMatches = medLine.match(DOSE_RE) || [];
    const directions = [...freqMatches, ...doseMatches].join(' ').trim() || null;

    // Strip dosage details from the name portion
    let name = medLine
      .replace(FREQ_RE, '')
      .replace(DOSE_RE, '')
      .replace(/\d+\s*(mg|ml|gm?|mcg|iu|%)\b/gi, '') // strip strengths
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Truncate name at first punctuation that separates dosing info
    name = name.split(/[,;|(]+/)[0].trim();

    if (!name || name.length < MIN_NAME_LEN) continue;

    // Avoid duplicates (same name, case-insensitive)
    if (medicines.some(m => m.name.toLowerCase() === name.toLowerCase())) continue;

    medicines.push({ name, form, directions: directions || 'As directed' });
  }

  return medicines;
}

// ─────────────────────────────────────────────────────────────────
// Fuzzy-match a medicine name against the product catalog
// Score based on token overlap; returns best matching product or null
// ─────────────────────────────────────────────────────────────────
function matchMedicineToProduct(medicineName, products) {
  const queryTokens = medicineName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (queryTokens.length === 0) return { bestMatch: null, suggestions: [] };

  let scoredProducts = [];

  for (const p of products) {
    const productText = [p.name, ...(p.ingredients || []), p.category || '']
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ');

    let score = 0;

    for (const token of queryTokens) {
      if (productText.includes(token)) {
        score += token.length >= 6 ? 3 : 2;
        if (p.name.toLowerCase().startsWith(token)) score += 2;
      }
    }

    if (productText.includes(medicineName.toLowerCase())) score += 10;

    if (score > 0) {
      scoredProducts.push({ product: p, score });
    }
  }

  scoredProducts.sort((a, b) => b.score - a.score);

  const bestScore = scoredProducts.length > 0 ? scoredProducts[0].score : 0;
  
  // Threshold: require at least score 4 to be a confident match
  const bestMatch = bestScore >= 4 ? scoredProducts[0].product : null;
  
  // Get top 3 alternatives (excluding bestMatch if it exists)
  const suggestions = scoredProducts
    .filter(sp => sp.product !== bestMatch)
    .slice(0, 3)
    .map(sp => sp.product);

  return { bestMatch, suggestions };
}

// ─────────────────────────────────────────────────────────────────
// Extract quantity from context around keyword position
// ─────────────────────────────────────────────────────────────────
function extractQty(textLower, keyword) {
  const idx = textLower.indexOf(keyword.toLowerCase());
  if (idx < 0) return 1;
  const ctx = textLower.substring(Math.max(0, idx - 20), Math.min(textLower.length, idx + keyword.length + 20));
  const m = ctx.match(/(?:x|qty[:\s]|quantity[:\s]|[-:\s])[\s]*([1-9])\b/i);
  return m ? parseInt(m[1]) : 1;
}

// ─────────────────────────────────────────────────────────────────
// Main controller
// ─────────────────────────────────────────────────────────────────
exports.readPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No prescription file uploaded' });
    }

    const imagePath = req.file.path;
    console.log(`[Prescription] Starting OCR for: ${imagePath}`);

    // ── OCR ──────────────────────────────────────────────────────
    const result = await Tesseract.recognize(
      imagePath,
      'eng+hin', // try both English and Hindi (Devanagari)
      {
        logger: m => console.log(`[OCR] ${m.status}: ${(m.progress * 100).toFixed(1)}%`),
        tessedit_char_whitelist: '', // allow all chars
      }
    );

    const extractedText = result.data.text;
    console.log('[Prescription] OCR complete. Raw text:\n', extractedText);

    // ── Parse ─────────────────────────────────────────────────────
    const parsedMedicines = parseOcrLines(extractedText);
    console.log('[Prescription] Parsed medicine candidates:', parsedMedicines.map(m => m.name));

    // ── Load product catalog ──────────────────────────────────────
    const products = getProducts();

    const matchedProducts = [];
    const outOfStockMedicines = [];

    const textLower = extractedText.toLowerCase();

    for (const med of parsedMedicines) {
      const matchResult = matchMedicineToProduct(med.name, products);
      const matched = matchResult.bestMatch;
      const suggestions = matchResult.suggestions;

      if (matched) {
        // Avoid duplicate products
        if (!matchedProducts.some(m => m.product.id === matched.id)) {
          const qty = extractQty(textLower, med.name);
          matchedProducts.push({
            product: matched,
            detectedQty: qty,
            prescribedName: med.name,
            form: med.form,
            directions: med.directions,
            confidence: 'Matched',
          });
        }
      } else {
        // Out of stock / not listed, but provide suggestions
        outOfStockMedicines.push({
          name: med.name,
          form: med.form,
          directions: med.directions,
          status: 'Out of Stock / Not Listed',
          suggestions: suggestions // Pass alternatives to frontend
        });
      }
    }

    // Cleanup temp upload
    try { fs.unlinkSync(imagePath); } catch (e) {}

    const totalMeds = matchedProducts.length + outOfStockMedicines.length;

    res.json({
      success: true,
      text: extractedText,
      matchedProducts,
      outOfStockMedicines,
      totalDetected: totalMeds,
      message: totalMeds > 0
        ? `Detected ${totalMeds} medicine(s): ${matchedProducts.length} available, ${outOfStockMedicines.length} not listed.`
        : 'Prescription scanned, but no medicines detected. Try a clearer image.',
    });

  } catch (error) {
    console.error('[Prescription] Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: 'Error processing prescription OCR', error: error.message });
  }
};
