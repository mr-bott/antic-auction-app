// models/transactionModel.js
const db = require('../config/dbConfig');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  static async create(transactionData) {
    const id = uuidv4();
    const [result] = await db.execute(
      `INSERT INTO transactions (
        id, product_id, buyer_id, seller_id, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id, transactionData.product_id,
        transactionData.buyer_id, transactionData.seller_id,
        transactionData.amount, transactionData.status || 'pending'
      ]
    );
    return { id, ...transactionData };
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT t.*, 
        p.title as product_title,
        b.full_name as buyer_name,
        s.full_name as seller_name
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users b ON t.buyer_id = b.id
       JOIN users s ON t.seller_id = s.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getRecent(limit = 5) {
    const [rows] = await db.execute(
      `SELECT t.*, 
        p.title as product_title,
        b.full_name as buyer_name,
        s.full_name as seller_name
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users b ON t.buyer_id = b.id
       JOIN users s ON t.seller_id = s.id
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  static async getTotalRevenue() {
    const [rows] = await db.execute(
      `SELECT SUM(amount) as total_revenue
       FROM transactions
       WHERE status = 'completed'`
    );
    return rows[0].total_revenue || 0;
  }

  static async getRevenueTrends(timeframe) {
    const timeframeQuery = this.getTimeframeQuery(timeframe);
    const [rows] = await db.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as daily_revenue
       FROM transactions
       WHERE ${timeframeQuery}
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );
    return rows;
  }

  static async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE transactions SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async getReport(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT t.*,
        p.title as product_title,
        b.full_name as buyer_name,
        s.full_name as seller_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users b ON t.buyer_id = b.id
      JOIN users s ON t.seller_id = s.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (filters.start_date) {
      query += ' AND t.created_at >= ?';
      queryParams.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND t.created_at <= ?';
      queryParams.push(filters.end_date);
    }

    if (filters.status) {
      query += ' AND t.status = ?';
      queryParams.push(filters.status);
    }

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM (${query}) as subquery`,
      queryParams
    );

    // Get total amount
    const [amountResult] = await db.execute(
      `SELECT SUM(amount) as total_amount FROM (${query}) as subquery`,
      queryParams
    );

    // Add pagination
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.execute(query, queryParams);

    return {
      transactions: rows,
      total: countResult[0].total,
      total_amount: amountResult[0].total_amount || 0
    };
  }

  static async resolveDispute(id, resolution) {
    const [result] = await db.execute(
      `UPDATE transactions 
       SET dispute_status = ?,
           dispute_resolution = ?,
           resolved_by = ?,
           resolved_at = NOW()
       WHERE id = ?`,
      [resolution.status, resolution.resolution, resolution.resolved_by, id]
    );
    return result.affectedRows > 0;
  }

  static async getDisputeStats() {
    const [rows] = await db.execute(
      `SELECT 
        COUNT(*) as total_disputes,
        SUM(CASE WHEN dispute_status = 'resolved' THEN 1 ELSE 0 END) as resolved_disputes,
        SUM(CASE WHEN dispute_status = 'pending' THEN 1 ELSE 0 END) as pending_disputes
       FROM transactions
       WHERE dispute_status IS NOT NULL`
    );
    return rows[0];
  }

  static async getUserTransactions(userId, role = 'buyer', page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const roleField = role === 'buyer' ? 'buyer_id' : 'seller_id';
    
    const [rows] = await db.execute(
      `SELECT t.*, 
        p.title as product_title,
        b.full_name as buyer_name,
        s.full_name as seller_name
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       JOIN users b ON t.buyer_id = b.id
       JOIN users s ON t.seller_id = s.id
       WHERE t.${roleField} = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total 
       FROM transactions 
       WHERE ${roleField} = ?`,
      [userId]
    );

    return {
      transactions: rows,
      total: countResult[0].total
    };
  }

  static getTimeframeQuery(timeframe) {
    switch (timeframe) {
      case 'day':
        return 'DATE(created_at) = CURDATE()';
      case 'week':
        return 'created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      case 'month':
        return 'created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      case 'year':
        return 'YEAR(created_at) = YEAR(CURDATE())';
      default:
        return '1=1';
    }
  }

  static async generateSalesReport(dateRange) {
    const query = `
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as transactions,
        SUM(t.amount) as revenue,
        AVG(t.amount) as average_sale,
        COUNT(DISTINCT t.buyer_id) as unique_buyers
      FROM transactions t
      WHERE t.created_at BETWEEN ? AND ?
        AND t.status = 'completed'
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `;

    const [rows] = await db.execute(query, [dateRange.start_date, dateRange.end_date]);
    return rows;
  }
}

module.exports = Transaction;