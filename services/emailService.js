const nodemailer = require('nodemailer');

let transporter;

const BRAND_NAME = process.env.MAIL_FROM_NAME || 'ARTT';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
const APP_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST || process.env.SMTP_SERVICE) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

const createTransporter = () => {
  if (!isMailConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || undefined,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    service: process.env.SMTP_SERVICE || undefined,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const getTransporter = () => {
  if (!transporter) transporter = createTransporter();
  return transporter;
};

const wrapHtml = (title, body) => `
  <div style="background:#f5f0e8;padding:32px;font-family:Georgia,serif;color:#1a1a1a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e8decc;">
      <div style="padding:32px 36px;border-bottom:1px solid #efe6d8;">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#b3893b;">${escapeHtml(BRAND_NAME)}</p>
        <h1 style="margin:0;font-weight:400;font-size:30px;">${escapeHtml(title)}</h1>
      </div>
      <div style="padding:32px 36px;line-height:1.7;font-size:15px;">
        ${body}
      </div>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) return { skipped: true, reason: 'missing-recipient' };

  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.warn(`[mail] SMTP not configured. Skipping email to ${to}: ${subject}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[mail] Email preview', { to, subject, text });
    }
    return { skipped: true, reason: 'smtp-not-configured' };
  }

  return activeTransporter.sendMail({
    from: `"${BRAND_NAME}" <${APP_EMAIL}>`,
    to,
    subject,
    html,
    text,
  });
};

const sendPasswordResetEmail = async ({ user, resetUrl }) => {
  const safeName = escapeHtml(user?.name || 'Customer');
  const safeUrl = escapeHtml(resetUrl);

  return sendEmail({
    to: user.email,
    subject: 'Reset your ARTT password',
    text: `Hello ${user.name || 'Customer'},\n\nUse this link to reset your password: ${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: wrapHtml(
      'Reset Your Password',
      `
        <p>Hello ${safeName},</p>
        <p>We received a request to reset your ARTT account password.</p>
        <p style="margin:28px 0;">
          <a href="${safeUrl}" style="display:inline-block;background:#111111;color:#f5f0e8;text-decoration:none;padding:14px 22px;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Reset Password</a>
        </p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      `
    ),
  });
};

const buildOrderItemsHtml = (order) =>
  (order.orderItems || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #efe6d8;">${escapeHtml(item.title || 'Artwork')}</td>
          <td style="padding:10px 0;border-bottom:1px solid #efe6d8;text-align:center;">${item.quantity || 1}</td>
          <td style="padding:10px 0;border-bottom:1px solid #efe6d8;text-align:right;">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
        </tr>
      `
    )
    .join('');

const buildOrderItemsText = (order) =>
  (order.orderItems || [])
    .map((item) => `- ${item.title || 'Artwork'} x${item.quantity || 1}: ${formatCurrency((item.price || 0) * (item.quantity || 1))}`)
    .join('\n');

const getOrderUrl = (orderId) => `${FRONTEND_URL}/orders/${orderId}`;

const sendOrderPlacedEmail = async ({ user, order }) => {
  const orderUrl = getOrderUrl(order._id);

  return sendEmail({
    to: user.email,
    subject: `Order received: #${String(order._id).slice(-8).toUpperCase()}`,
    text: `Hello ${user.name || 'Customer'},\n\nWe received your order #${String(order._id).slice(-8).toUpperCase()}.\n\nItems:\n${buildOrderItemsText(order)}\n\nTotal: ${formatCurrency(order.totalPrice)}\nStatus: ${order.orderStatus}\n\nView your order: ${orderUrl}`,
    html: wrapHtml(
      'Order Received',
      `
        <p>Hello ${escapeHtml(user.name || 'Customer')},</p>
        <p>Thank you for your purchase. We have received your order <strong>#${escapeHtml(String(order._id).slice(-8).toUpperCase())}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:10px;border-bottom:1px solid #d7c8b0;">Item</th>
              <th style="text-align:center;padding-bottom:10px;border-bottom:1px solid #d7c8b0;">Qty</th>
              <th style="text-align:right;padding-bottom:10px;border-bottom:1px solid #d7c8b0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${buildOrderItemsHtml(order)}
          </tbody>
        </table>
        <p><strong>Total:</strong> ${escapeHtml(formatCurrency(order.totalPrice))}</p>
        <p><strong>Status:</strong> ${escapeHtml(order.orderStatus)}</p>
        <p style="margin-top:28px;">
          <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#111111;color:#f5f0e8;text-decoration:none;padding:14px 22px;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">View Order</a>
        </p>
      `
    ),
  });
};

const sendPaymentConfirmedEmail = async ({ user, order }) => {
  const orderUrl = getOrderUrl(order._id);

  return sendEmail({
    to: user.email,
    subject: `Payment confirmed for order #${String(order._id).slice(-8).toUpperCase()}`,
    text: `Hello ${user.name || 'Customer'},\n\nYour payment for order #${String(order._id).slice(-8).toUpperCase()} has been confirmed.\n\nTotal paid: ${formatCurrency(order.totalPrice)}\nPayment ID: ${order.paymentInfo?.razorpayPaymentId || 'N/A'}\n\nView your order: ${orderUrl}`,
    html: wrapHtml(
      'Payment Confirmed',
      `
        <p>Hello ${escapeHtml(user.name || 'Customer')},</p>
        <p>Your payment for order <strong>#${escapeHtml(String(order._id).slice(-8).toUpperCase())}</strong> has been confirmed.</p>
        <p><strong>Total paid:</strong> ${escapeHtml(formatCurrency(order.totalPrice))}</p>
        <p><strong>Payment ID:</strong> ${escapeHtml(order.paymentInfo?.razorpayPaymentId || 'N/A')}</p>
        <p style="margin-top:28px;">
          <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#111111;color:#f5f0e8;text-decoration:none;padding:14px 22px;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">View Order</a>
        </p>
      `
    ),
  });
};

const sendOrderStatusEmail = async ({ user, order, note = '' }) => {
  const orderUrl = getOrderUrl(order._id);

  return sendEmail({
    to: user.email,
    subject: `Order update: #${String(order._id).slice(-8).toUpperCase()} is now ${order.orderStatus}`,
    text: `Hello ${user.name || 'Customer'},\n\nYour order #${String(order._id).slice(-8).toUpperCase()} is now ${order.orderStatus}.\n${note ? `\nNote: ${note}\n` : ''}\nView your order: ${orderUrl}`,
    html: wrapHtml(
      'Order Status Updated',
      `
        <p>Hello ${escapeHtml(user.name || 'Customer')},</p>
        <p>Your order <strong>#${escapeHtml(String(order._id).slice(-8).toUpperCase())}</strong> is now <strong>${escapeHtml(order.orderStatus)}</strong>.</p>
        ${note ? `<p><strong>Note:</strong> ${escapeHtml(note)}</p>` : ''}
        <p style="margin-top:28px;">
          <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#111111;color:#f5f0e8;text-decoration:none;padding:14px 22px;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">View Order</a>
        </p>
      `
    ),
  });
};

module.exports = {
  isMailConfigured,
  sendEmail,
  sendPasswordResetEmail,
  sendOrderPlacedEmail,
  sendPaymentConfirmedEmail,
  sendOrderStatusEmail,
};
