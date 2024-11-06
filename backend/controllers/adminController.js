// controllers/adminController.js
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Transaction = require('../models/transactionModel');
const Bid = require('../models/bidModel');

// ... (previous code remains the same until manageDisputes) ...

exports.manageDisputes = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, status } = req.body;

    const dispute = await Transaction.resolveDispute(id, {
      resolution,
      status,
      resolved_by: req.user.id,
      resolved_at: new Date()
    });

    // Notify users involved in the dispute
    await notifyDisputeResolution(dispute);

    res.json({ 
      message: 'Dispute resolved successfully',
      dispute 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// New methods added below

exports.getAuctionAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    const analytics = {
      bid_statistics: await Bid.getStatistics(timeframe),
      product_performance: await Product.getPerformanceMetrics(timeframe),
      user_engagement: await User.getEngagementMetrics(timeframe),
      revenue_trends: await Transaction.getRevenueTrends(timeframe)
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.manageCategories = async (req, res) => {
  try {
    const { action } = req.query;
    const { category_id, name, description } = req.body;

    switch (action) {
      case 'create':
        const newCategory = await Product.createCategory({ name, description });
        return res.status(201).json(newCategory);
      
      case 'update':
        const updatedCategory = await Product.updateCategory(category_id, { name, description });
        return res.json(updatedCategory);
      
      case 'delete':
        await Product.deleteCategory(category_id);
        return res.json({ message: 'Category deleted successfully' });
      
      default:
        const categories = await Product.getAllCategories();
        return res.json(categories);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.systemSettings = async (req, res) => {
  try {
    const { setting_type, settings } = req.body;

    switch (setting_type) {
      case 'auction':
        await updateAuctionSettings(settings);
        break;
      case 'payment':
        await updatePaymentSettings(settings);
        break;
      case 'notification':
        await updateNotificationSettings(settings);
        break;
      default:
        return res.status(400).json({ message: 'Invalid setting type' });
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.moderateListings = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { action, reason } = req.body;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    switch (action) {
      case 'approve':
        await Product.updateStatus(product_id, 'active');
        break;
      case 'reject':
        await Product.updateStatus(product_id, 'rejected', reason);
        // Notify seller
        await notifySeller(product.seller_id, 'listing_rejected', { product_id, reason });
        break;
      case 'suspend':
        await Product.updateStatus(product_id, 'suspended', reason);
        // Notify seller and active bidders
        await notifyListingSuspension(product_id, reason);
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({ message: `Product ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateReports = async (req, res) => {
  try {
    const { report_type, start_date, end_date, format = 'json' } = req.query;

    const reportData = await generateReport(report_type, {
      start_date: new Date(start_date),
      end_date: new Date(end_date)
    });

    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${report_type}_report_${start_date}_${end_date}.csv`);
      return res.send(csvData);
    }

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
async function notifyDisputeResolution(dispute) {
  // Implementation for notifying users about dispute resolution
  const { buyer_id, seller_id, resolution } = dispute;
  await Promise.all([
    notifyUser(buyer_id, 'dispute_resolved', { dispute, resolution }),
    notifyUser(seller_id, 'dispute_resolved', { dispute, resolution })
  ]);
}

async function updateAuctionSettings(settings) {
  // Implementation for updating auction settings
  await Settings.update('auction', settings);
}

async function updatePaymentSettings(settings) {
  // Implementation for updating payment settings
  await Settings.update('payment', settings);
}

async function updateNotificationSettings(settings) {
  // Implementation for updating notification settings
  await Settings.update('notification', settings);
}

async function generateReport(type, dateRange) {
  // Implementation for generating various types of reports
  switch (type) {
    case 'sales':
      return await Transaction.generateSalesReport(dateRange);
    case 'user_activity':
      return await User.generateActivityReport(dateRange);
    case 'auction_performance':
      return await Product.generatePerformanceReport(dateRange);
    default:
      throw new Error('Invalid report type');
  }
}

function convertToCSV(data) {
  // Implementation for converting JSON data to CSV format
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ];
  return csvRows.join('\n');
}

module.exports = exports;