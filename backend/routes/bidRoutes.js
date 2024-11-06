// routes/bidRoutes.js
const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Protected routes - require authentication
router.post('/:productId', 
  authenticateToken,
  bidController.placeBid
);

router.get('/user/active', 
  authenticateToken,
  bidController.getUserActiveBids
);

router.get('/user/history', 
  authenticateToken,
  bidController.getUserBidHistory
);

router.get('/product/:productId', 
  authenticateToken,
  bidController.getProductBids
);

// Bid management
router.put('/:bidId/cancel', 
  authenticateToken,
  bidController.cancelBid
);

router.get('/winning', 
  authenticateToken,
  bidController.getWinningBids
);

// Bid notifications
router.post('/notifications/settings', 
  authenticateToken,
  bidController.updateNotificationSettings
);

// Bid analytics
router.get('/analytics', 
  authenticateToken,
  bidController.getBidAnalytics
);

// Auto-bidding settings
router.post('/auto-bid/setup', 
  authenticateToken,
  bidController.setupAutoBid
);

router.put('/auto-bid/update', 
  authenticateToken,
  bidController.updateAutoBid
);

router.delete('/auto-bid/cancel', 
  authenticateToken,
  bidController.cancelAutoBid
);

module.exports = router;