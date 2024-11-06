// models/productModel.js
const db = require('../config/dbConfig');
const { v4: uuidv4 } = require('uuid');

class Product {
  static async create(productData) {
    const id = uuidv4();
    const [result] = await db.execute(
      `INSERT INTO products (
        id, seller_id, title, description, starting_price,
        current_price, images, category, condition, start_time, end_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, productData.seller_id, productData.title,
        productData.description, productData.starting_price,
        productData.starting_price, JSON.stringify(productData.images),
        productData.category, productData.condition,
        productData.start_time, productData.end_time
      ]
    );
    return { id, ...productData };
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT p.*, u.full_name as seller_name, u.email as seller_email
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];

    if (filters.status) {
      query += ' AND status = ?';
      queryParams.push(filters.status);
    }

    if (filters.category) {
      query += ' AND category = ?';
      queryParams.push(filters.category);
    }

    if (filters.min_price) {
      query += ' AND current_price >= ?';
      queryParams.push(filters.min_price);
    }

    if (filters.max_price) {
      query += ' AND current_price <= ?';
      queryParams.push(filters.max_price);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.execute(query, queryParams);
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM products WHERE 1=1',
      queryParams.slice(0, -2)
    );

    return {
      products: rows,
      total: countResult[0].total
    };
  }

  static async updateCurrentPrice(id, newPrice) {
    const [result] = await db.execute(
      'UPDATE products SET current_price = ? WHERE id = ?',
      [newPrice, id]
    );
    return result.affectedRows > 0;
  }

  static async updateStatus(id, status, reason = null) {
    const [result] = await db.execute(
      'UPDATE products SET status = ?, status_reason = ? WHERE id = ?',
      [status, reason, id]
    );
    return result.affectedRows > 0;
  }

  static async count() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM products');
    return rows[0].count;
  }

  static async countActive() {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM products 
       WHERE status = 'active' AND end_time > NOW()`
    );
    return rows[0].count;
  }

  static async getPopularCategories() {
    const [rows] = await db.execute(
      `SELECT category, COUNT(*) as count,
        AVG(current_price) as avg_price
       FROM products
       GROUP BY category
       ORDER BY count DESC
       LIMIT 5`
    );
    return rows;
  }

  static async getPerformanceMetrics(timeframe) {
    const timeframeQuery = this.getTimeframeQuery(timeframe);
    const [rows] = await db.execute(
      `SELECT 
        COUNT(*) as total_listings,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_items,
        AVG(current_price) as avg_sale_price
       FROM products
       WHERE ${timeframeQuery}`
    );
    return rows[0];
  }
}

module.exports = Product;