// models/bidModel.js
const db = require('../config/dbConfig');
const { v4: uuidv4 } = require('uuid');

class Bid {
  static async create(bidData) {
    const id = uuidv4();
    const [result] = await db.execute(
      `INSERT INTO bids (id, product_id, bidder_id, bid_amount)
       VALUES (?, ?, ?, ?)`,
      [id, bidData.product_id, bidData.bidder_id, bidData.bid_amount]
    );
    return { id, ...bidData };
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT b.*, u.full_name as bidder_name
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByBidder(bidder_id, status, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT b.*, p.title as product_title, p.current_price
      FROM bids b
      JOIN products p ON b.product_id = p.id
      WHERE b.bidder_id = ?
    `;
    const queryParams = [bidder_id];

    if (status) {
      query += ' AND b.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY b.bid_time DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.execute(query, queryParams);
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM bids WHERE bidder_id = ?',
      [bidder_id]
    );

    return {
      bids: rows,
      total: countResult[0].total
    };
  }

  static async findByProduct(product_id, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT b.*, u.full_name as bidder_name
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.product_id = ?
       ORDER BY b.bid_amount DESC
       LIMIT ? OFFSET ?`,
      [product_id, limit, offset]
    );

    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM bids WHERE product_id = ?',
      [product_id]
    );

    return {
      bids: rows,
      total: countResult[0].total
    };
  }

  static async getHighestBid(product_id) {
    const [rows] = await db.execute(
      `SELECT * FROM bids
       WHERE product_id = ?
       ORDER BY bid_amount DESC
       LIMIT 1`,
      [product_id]
    );
    return rows[0];
  }

  static async cancel(bid_id) {
    const [result] = await db.execute(
      'UPDATE bids SET status = "cancelled" WHERE id = ?',
      [bid_id]
    );
    return result.affectedRows > 0;
  }

  static async getStatistics(timeframe) {
    const timeframeQuery = this.getTimeframeQuery(timeframe);
    const [rows] = await db.execute(
      `SELECT 
        COUNT(*) as total_bids,
        AVG(bid_amount) as avg_bid_amount,
        MAX(bid_amount) as highest_bid,
        COUNT(DISTINCT bidder_id) as unique_bidders
       FROM bids
       WHERE ${timeframeQuery}`
    );
    return rows[0];
  }
}

module.exports = Bid;