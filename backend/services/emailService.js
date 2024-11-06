// services/emailService.js
const nodemailer = require('nodemailer');
const { emailConfig } = require('../config/appConfig');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await this.transporter.sendMail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome to Our Auction Platform</h1>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `
    });
  }

  async sendBidNotification(user, product, bidAmount) {
    await this.transporter.sendMail({
      to: user.email,
      subject: 'New Bid Notification',
      html: `
        <h2>New Bid Placed</h2>
        <p>A new bid of ${bidAmount} has been placed on ${product.title}</p>
      `
    });
  }

  async sendAuctionEndNotification(winner, product) {
    await this.transporter.sendMail({
      to: winner.email,
      subject: 'Auction Won!',
      html: `
        <h2>Congratulations!</h2>
        <p>You've won the auction for ${product.title}</p>
        <p>Final price: ${product.current_price}</p>
      `
    });
  }

  async sendPasswordReset(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
      `
    });
  }
}

module.exports = new EmailService();