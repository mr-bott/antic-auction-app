// controllers/bidController.js
const Bid = require('../models/bidModel');
const Product = require('../models/productModel');
const { io } = require('../socket');

exports.placeBid = async (req, res) => {
  try {
    const { product_id, bid_amount } = req.body;
    const bidder_id = req.user.id;

    // Get product details
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate bid
    if (new Date() > new Date(product.end_time)) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    if (bid_amount <= product.current_price) {
      return res.status(400).json({ 
        message: 'Bid amount must be higher than current price' 
      });
    }

    // Create bid
    const bid = await Bid.create({
      product_id,
      bidder_id,
      bid_amount
    });

    // Update product current price
    await Product.updateCurrentPrice(product_id, bid_amount);

    // Emit socket event for real-time updates
    io.emit('newBid', {
      product_id,
      current_price: bid_amount,
      bid: {
        id: bid.id,
        bidder_id,
        bid_amount,
        bid_time: bid.bid_time
      }
    });

    res.status(201).json({ bid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserBids = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const bidder_id = req.user.id;

    const { bids, total } = await Bid.findByBidder(
      bidder_id, 
      status, 
      page, 
      limit
    );

    res.json({
      bids,
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

exports.getProductBids = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const { bids, total } = await Bid.findByProduct(
      product_id, 
      page, 
      limit
    );

    res.json({
      bids,
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

exports.cancelBid = async (req, res) => {
  try {
    const { bid_id } = req.params;
    const bid = await Bid.findById(bid_id);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.bidder_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const product = await Product.findById(bid.product_id);
    if (new Date() > new Date(product.end_time)) {
      return res.status(400).json({ message: 'Cannot cancel bid after auction ends' });
    }

    await Bid.cancel(bid_id);
    
    // Get highest remaining bid
    const highestBid = await Bid.getHighestBid(bid.product_id);
    if (highestBid) {
      await Product.updateCurrentPrice(bid.product_id, highestBid.bid_amount);
    } else {
      await Product.updateCurrentPrice(bid.product_id, product.starting_price);
    }

    res.json({ message: 'Bid cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};