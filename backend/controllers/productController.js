const fs = require('fs');
const path = require('path');
const { supabase, isConfigured } = require('../config/supabase');

const productsFilePath = path.join(__dirname, '../data/products.json');

const getLocalProducts = () => {
  const jsonData = fs.readFileSync(productsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

exports.getAllProducts = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 12;
    const category = req.query.category || 'all';
    const searchQuery = (req.query.search || '').toLowerCase().trim();
    const productType = (req.query.type || 'all').toLowerCase().trim();

    if (!isConfigured) {
      // Fallback to JSON file
      const products = getLocalProducts();
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

      const totalProducts = filtered.length;
      const totalPages = Math.ceil(totalProducts / limit);
      page = Math.max(1, Math.min(page, totalPages || 1));
      const paginatedProducts = filtered.slice((page - 1) * limit, page * limit);
      
      return res.json({
        products: paginatedProducts,
        page,
        limit,
        totalProducts,
        totalPages
      });
    }

    // Connect to Supabase
    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (productType !== 'all') {
      query = query.ilike('name', `%${productType}%`);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Sort by id ascending to keep grid ordering stable
    query = query.range(from, to).order('id', { ascending: true });

    const { data: dbProducts, count, error } = await query;
    if (error) throw error;

    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    // Map DB fields back to frontend fields (e.g. camelCase mapping if needed, though they match)
    const formattedProducts = dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      image: p.image,
      rating: parseFloat(p.rating),
      reviewsCount: p.reviews_count,
      shortDescription: p.short_description,
      longDescription: p.long_description,
      isBestSeller: p.is_bestseller,
      benefits: p.benefits,
      usageDirections: p.usage_directions,
      ingredients: p.ingredients
    }));

    res.json({
      products: formattedProducts,
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

exports.getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (!isConfigured) {
      // Fallback to JSON file
      const product = getLocalProducts().find(p => p.id === id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(product);
    }

    const { data: p, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!p) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const formattedProduct = {
      id: p.id,
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      image: p.image,
      rating: parseFloat(p.rating),
      reviewsCount: p.reviews_count,
      shortDescription: p.short_description,
      longDescription: p.long_description,
      isBestSeller: p.is_bestseller,
      benefits: p.benefits,
      usageDirections: p.usage_directions,
      ingredients: p.ingredients
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Error retrieving product detail' });
  }
};
