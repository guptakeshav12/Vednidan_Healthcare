const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '../data/products.json');

const getProductsData = () => {
  const jsonData = fs.readFileSync(productsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

exports.getAllProducts = (req, res) => {
  try {
    const products = getProductsData();
    
    // Parse query params for pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 12;
    const category = req.query.category || 'all';
    const searchQuery = (req.query.search || '').toLowerCase().trim();
    const productType = (req.query.type || 'all').toLowerCase().trim();

    // 1. Filter products array based on filters
    let filtered = products;

    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (productType !== 'all') {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(productType));
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery) || 
        p.shortDescription.toLowerCase().includes(searchQuery) || 
        p.category.toLowerCase().includes(searchQuery)
      );
    }

    // 2. Perform pagination math
    const totalProducts = filtered.length;
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Safety boundaries
    page = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      page,
      limit,
      totalProducts,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching products with pagination:', error);
    res.status(500).json({ message: 'Error retrieving products data' });
  }
};

exports.getProductById = (req, res) => {
  try {
    const products = getProductsData();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Error retrieving product detail' });
  }
};
