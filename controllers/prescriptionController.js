const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const productsFilePath = path.join(__dirname, '../data/products.json');

const getProducts = () => {
  const jsonData = fs.readFileSync(productsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

exports.readPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No prescription file uploaded' });
    }

    const imagePath = req.file.path;
    console.log(`Starting OCR processing for image: ${imagePath}`);

    // Run Tesseract OCR on the uploaded file
    const result = await Tesseract.recognize(
      imagePath,
      'eng',
      { 
        logger: m => console.log(`[OCR Process] ${m.status}: ${(m.progress * 100).toFixed(1)}%`) 
      }
    );

    const extractedText = result.data.text;
    console.log(`OCR extraction complete. Text read:\n`, extractedText);

    // Get the product catalog
    const products = getProducts();
    const matchedProducts = [];

    // Simple parser to match product keywords in the text
    const textLower = extractedText.toLowerCase();

    // Map keywords to product IDs
    const keywordMap = {
      'ashwagandha': { id: 1, name: 'Ashwagandha' },
      'ksm-66': { id: 1, name: 'Ashwagandha' },
      'triphala': { id: 2, name: 'Triphala' },
      'kumkumadi': { id: 3, name: 'Kumkumadi' },
      'saffron': { id: 3, name: 'Kumkumadi' },
      'bhringraj': { id: 4, name: 'Bhringraj' },
      'chyawanprash': { id: 5, name: 'Chyawanprash' },
      'brahmi': { id: 6, name: 'Brahmi' },
      'shatavari': { id: 7, name: 'Shatavari' },
      'neem': { id: 8, name: 'Neem & Turmeric' },
      'turmeric': { id: 8, name: 'Neem & Turmeric' }
    };

    // Find matches and extract quantity
    for (const [key, itemInfo] of Object.entries(keywordMap)) {
      if (textLower.includes(key)) {
        // Prevent duplicate products in the list
        if (!matchedProducts.some(p => p.id === itemInfo.id)) {
          const product = products.find(p => p.id === itemInfo.id);
          
          if (product) {
            // Attempt to search for quantities near the word (e.g., "Ashwagandha x2", "Qty: 3", "Triphala - 1 bottle")
            let quantity = 1;
            
            // Look for a number within 15 characters of the keyword
            const keywordIndex = textLower.indexOf(key);
            const contextText = textLower.substring(
              Math.max(0, keywordIndex - 15), 
              Math.min(textLower.length, keywordIndex + key.length + 15)
            );
            
            // Look for patterns like "x 2", "x2", "qty: 2", "qty 2", "- 2", "2 bottles", "2 tabs"
            const qtyRegex = /(?:x|qty|qty:|quantity|[-:\s])\s*([1-9])\b/i;
            const match = contextText.match(qtyRegex);
            if (match && match[1]) {
              quantity = parseInt(match[1]);
            }

            matchedProducts.push({
              product,
              detectedQty: quantity,
              confidence: 'High'
            });
          }
        }
      }
    }

    // Clean up the uploaded file to save disk space
    try {
      fs.unlinkSync(imagePath);
      console.log(`Cleaned up uploaded file: ${imagePath}`);
    } catch (err) {
      console.error(`Failed to delete temporary upload file: ${imagePath}`, err);
    }

    // If no products matched via OCR, provide a helpful response
    res.json({
      text: extractedText,
      matchedProducts,
      success: true,
      message: matchedProducts.length > 0 ? 
        `Successfully scanned! Detected ${matchedProducts.length} Ayurvedic products.` : 
        "Prescription scanned, but no matching products from our database were detected. Please try uploading a clearer image or choose from our list."
    });

  } catch (error) {
    console.error('Error in prescription controller:', error);
    // Cleanup on error
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ message: 'Error processing prescription upload OCR', error: error.message });
  }
};
