// controllers/productController.js
const Product = require('../models/productModel');
const { uploadToS3 } = require('../services/uploadService');

exports.createProduct = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      starting_price, 
      category, 
      condition,
      start_time,
      end_time 
    } = req.body;

    const images = req.files ? await Promise.all(
      req.files.map(file => uploadToS3(file))
    ) : [];

    const product = await Product.create({
      seller_id: req.user.id,
      title,
      description,
      starting_price,
      current_price: starting_price,
      images,
      category,
      condition,
      start_time,
      end_time
    });

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { 
      category, 
      condition, 
      min_price, 
      max_price,
      status = 'active',
      page = 1,
      limit = 10
    } = req.query;

    const filters = {
      status,
      ...(category && { category }),
      ...(condition && { condition }),
      ...(min_price && { min_price: parseFloat(min_price) }),
      ...(max_price && { max_price: parseFloat(max_price) })
    };

    const { products, total } = await Product.findAll(filters, page, limit);
    
    res.json({
      products,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get bid history
    const bids = await Product.getBidHistory(id);
    
    res.json({ product, bids });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedProduct = await Product.update(id, req.body);
    res.json({ product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Product.delete(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};