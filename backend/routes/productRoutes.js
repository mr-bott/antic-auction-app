// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, isSellerOrAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProduct);
router.get('/:id/bids', productController.getProductBids);

// Protected routes - Seller only
router.post('/', 
  authenticateToken, 
  isSellerOrAdmin,
  upload.array('images', 5),
  productController.createProduct
);

router.put('/:id', 
  authenticateToken, 
  isSellerOrAdmin,
  upload.array('images', 5),
  productController.updateProduct
);

router.delete('/:id', 
  authenticateToken, 
  isSellerOrAdmin,
  productController.deleteProduct
);

// Search and filter routes
router.get('/search', productController.searchProducts);
router.get('/filter', productController.filterProducts);

// Seller specific routes
router.get('/seller/listings', 
  authenticateToken, 
  isSellerOrAdmin,
  productController.getSellerListings
);

router.get('/seller/sales', 
  authenticateToken, 
  isSellerOrAdmin,
  productController.getSellerSales
);

// Product analytics
router.get('/:id/analytics', 
  authenticateToken, 
  isSellerOrAdmin,
  productController.getProductAnalytics
);

module.exports = router;