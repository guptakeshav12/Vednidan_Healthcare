const fs = require('fs');
const path = require('path');
const { pool } = require('../config/supabase');

const productsFilePath = path.join(__dirname, '../data/products.json');

const DEFAULT_CATEGORIES = [
  { slug: 'vitality', label: 'Vitality & Energy' },
  { slug: 'digestion', label: 'Gut & Digestion' },
  { slug: 'skincare', label: 'Skin Problems' },
  { slug: 'haircare', label: 'Hair Problems' },
  { slug: 'immunity', label: 'Immunity Boosters' },
  { slug: 'brain', label: 'Brain & Memory' },
  { slug: 'heart', label: 'Heart & Cardiac Care' },
  { slug: 'pain', label: 'Joint & Pain Relief' },
  { slug: 'detox', label: 'Detox & Cleanse' },
  { slug: 'diabetes', label: 'Diabetes & Sugar Care' },
  { slug: 'respiratory', label: 'Respiratory & Lung Care' },
  { slug: 'stress', label: 'Stress & Sleep' },
  { slug: 'womens-health', label: "Women's Health" },
  { slug: 'healthcare', label: 'General Healthcare' }
];

// Always read fresh from products.json so admin additions/edits appear immediately
const getLocalProducts = () => {
  try {
    const jsonData = fs.readFileSync(productsFilePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (e) {
    console.error('[Products] Error reading products.json:', e.message);
    return [];
  }
};

function parseCategoriesList(catStr) {
  return String(catStr || '')
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean);
}

function formatCategoryLabel(slug) {
  const found = DEFAULT_CATEGORIES.find(c => c.slug === slug.toLowerCase());
  if (found) return found.label;
  return slug
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Helper: serve from local JSON file with filtering + pagination
function serveFromLocal(res, { page, limit, category, searchQuery, productType }) {
  let filtered = getLocalProducts();

  if (category !== 'all') {
    const target = category.toLowerCase().trim();
    filtered = filtered.filter(p => parseCategoriesList(p.category).includes(target));
  }
  if (productType !== 'all') {
    filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(productType));
  }
  if (searchQuery) {
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(searchQuery) ||
      (p.shortDescription || '').toLowerCase().includes(searchQuery) ||
      (p.category || '').toLowerCase().includes(searchQuery)
    );
  }

  const totalProducts = filtered.length;
  const totalPages = Math.ceil(totalProducts / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedProducts = filtered.slice((safePage - 1) * limit, safePage * limit);

  return res.json({ products: paginatedProducts, page: safePage, limit, totalProducts, totalPages });
}

exports.getProductCategories = async (req, res) => {
  try {
    const categoryMap = new Map();
    DEFAULT_CATEGORIES.forEach(c => categoryMap.set(c.slug, c.label));

    let productsList = [];
    if (pool) {
      try {
        const result = await pool.query('SELECT DISTINCT category FROM products');
        productsList = result.rows;
      } catch (e) {
        productsList = getLocalProducts();
      }
    } else {
      productsList = getLocalProducts();
    }

    productsList.forEach(p => {
      parseCategoriesList(p.category).forEach(slug => {
        if (!categoryMap.has(slug)) {
          categoryMap.set(slug, formatCategoryLabel(slug));
        }
      });
    });

    const categories = Array.from(categoryMap.entries()).map(([slug, label]) => ({ slug, label }));
    res.json({ categories });
  } catch (error) {
    console.error('[Product Categories] Error:', error);
    res.json({ categories: DEFAULT_CATEGORIES });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 12;
    const category = (req.query.category || 'all').toLowerCase().trim();
    const searchQuery = (req.query.search || '').toLowerCase().trim();
    const productType = (req.query.type || 'all').toLowerCase().trim();

    const params = { page, limit, category, searchQuery, productType };

    // Try PostgreSQL pool first
    if (pool) {
      try {
        let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
        let dataQuery = 'SELECT * FROM products WHERE 1=1';
        const vals = [];
        let idx = 1;

        if (category !== 'all') {
          const catCondition = `EXISTS (SELECT 1 FROM unnest(string_to_array(LOWER(category), ',')) AS c WHERE TRIM(c) = $${idx})`;
          countQuery += ` AND ${catCondition}`;
          dataQuery  += ` AND ${catCondition}`;
          vals.push(category); idx++;
        }
        if (productType !== 'all') {
          countQuery += ` AND LOWER(name) LIKE $${idx}`;
          dataQuery  += ` AND LOWER(name) LIKE $${idx}`;
          vals.push(`%${productType}%`); idx++;
        }
        if (searchQuery) {
          countQuery += ` AND (LOWER(name) LIKE $${idx} OR LOWER(short_description) LIKE $${idx} OR LOWER(category) LIKE $${idx})`;
          dataQuery  += ` AND (LOWER(name) LIKE $${idx} OR LOWER(short_description) LIKE $${idx} OR LOWER(category) LIKE $${idx})`;
          vals.push(`%${searchQuery}%`); idx++;
        }

        const offset = (page - 1) * limit;
        dataQuery += ` ORDER BY id ASC LIMIT $${idx} OFFSET $${idx + 1}`;
        const dataVals = [...vals, limit, offset];

        const [countRes, dataRes] = await Promise.all([
          pool.query(countQuery, vals),
          pool.query(dataQuery, dataVals)
        ]);

        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit) || 1;

        // Map snake_case DB fields to camelCase for frontend
        const products = dataRes.rows.map(p => ({
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
          benefits: p.benefits || [],
          usageDirections: p.usage_directions,
          ingredients: p.ingredients || []
        }));

        // If DB has no products yet, fall back to local JSON
        if (totalProducts === 0) {
          return serveFromLocal(res, params);
        }

        return res.json({ products, page, limit, totalProducts, totalPages });
      } catch (dbErr) {
        console.error('[Products DB Error]', dbErr.message);
        // Fall through to local JSON
      }
    }

    // Fallback: local JSON file
    return serveFromLocal(res, params);

  } catch (error) {
    console.error('[Products] Unexpected error:', error);
    res.status(500).json({ message: 'Error retrieving products data' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Try PostgreSQL pool
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
        if (result.rowCount > 0) {
          const p = result.rows[0];
          return res.json({
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
            benefits: p.benefits || [],
            usageDirections: p.usage_directions,
            ingredients: p.ingredients || []
          });
        }
      } catch (dbErr) {
        console.error('[Product Detail DB Error]', dbErr.message);
      }
    }

    // Fallback: local JSON
    const product = getLocalProducts().find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);

  } catch (error) {
    console.error('[Product Detail] Error:', error);
    res.status(500).json({ message: 'Error retrieving product detail' });
  }
};
