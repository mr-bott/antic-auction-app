// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// All routes require admin authentication
router.use(authenticateToken, isAdmin);

// Dashboard and Analytics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getAuctionAnalytics);
router.get('/reports', adminController.generateReports);

// User Management
router.get('/users', adminController.manageUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);

// Product Management
router.get('/products', adminController.getProducts);
router.put('/products/:id/status', adminController.updateProductStatus);
router.delete('/products/:id', adminController.deleteProduct);

// Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Transaction Management
router.get('/transactions', adminController.getTransactions);
router.get('/transactions/:id', adminController.getTransactionDetails);
router.put('/transactions/:id/status', adminController.updateTransactionStatus);

// Dispute Management
router.get('/disputes', adminController.getDisputes);
router.get('/disputes/:id', adminController.getDisputeDetails);
router.put('/disputes/:id/resolve', adminController.resolveDispute);

// System Settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// Auction Settings
router.get('/auction-settings', adminController.getAuctionSettings);
router.put('/auction-settings', adminController.updateAuctionSettings);

// Moderation
router.get('/moderation/queue', adminController.getModerationQueue);
router.put('/moderation/:id/approve', adminController.approveItem);
router.put('/moderation/:id/reject', adminController.rejectItem);

// Notifications
router.post('/notifications/broadcast', adminController.broadcastNotification);
router.get('/notifications/templates', adminController.getNotificationTemplates);
router.put('/notifications/templates/:id', adminController.updateNotificationTemplate);

// Backup and Maintenance
router.post('/backup', adminController.createBackup);
router.get('/maintenance/status', adminController.getMaintenanceStatus);
router.put('/maintenance/mode', adminController.toggleMaintenanceMode);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/:id', adminController.getAuditLogDetails);

module.exports = router;