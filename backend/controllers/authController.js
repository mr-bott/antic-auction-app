// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');
const logger = require('../utils/logger');

const authController = {
  // Register new user
  register: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          errors: [{
            msg: 'User already exists',
            param: 'email'
          }]
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        full_name,
        role
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      delete user.password;

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          errors: [{
            msg: 'Invalid credentials',
            param: 'email'
          }]
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          errors: [{
            msg: 'Invalid credentials',
            param: 'password'
          }]
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      delete user.password;

      res.json({
        message: 'Login successful',
        token,
        user
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  },

  // Get current user
  getCurrentUser: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          errors: [{
            msg: 'User not found'
          }]
        });
      }

      // Remove password from response
      delete user.password;

      res.json({ user });
    } catch (error) {
      logger.error('Get current user error:', error);
      next(error);
    }
  }
};

module.exports = authController;