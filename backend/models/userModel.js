// models/userModel.js
const db = require('../config/dbConfig');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const id = uuidv4();
    // Convert role to lowercase and default to 'user' if not specified
    const role = (userData.role || 'user').toLowerCase();
    
    try {
      const [result] = await db.execute(
        `INSERT INTO users (id, email, password, full_name, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, userData.email, userData.password, userData.full_name, role]
      );
      return { 
        id, 
        email: userData.email,
        full_name: userData.full_name,
        role,
        created_at: new Date()
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // ... rest of the methods remain the same
}

module.exports = User;