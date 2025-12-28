// controllers/contactController.js
const { sendEmail } = require('../utils/email');

// @desc    Send contact email to support
// @route   POST /api/contact
// @access  Public
 const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. التحقق من الحقول الأساسية
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, subject, message)',
      });
    }

    // 2. تصميم شكل البريد الإلكتروني الذي سيصل للإدارة
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
        <h2 style="color: #2e7d32; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">New Contact Inquiry</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Sent from GradJob Contact Form</p>
      </div>
    `;

    // 3. إرسال الإيميل للدعم الفني
    await sendEmail({
      to: 'gradjob.noreply@gmail.com', // البريد الذي سيستقبل الشكاوى
      subject: `${subject}: from ${name}`,
      html: htmlBody,
    });

    // 4. (اختياري) إرسال بريد تأكيد للمستخدم أنه تم استلام رسالته
    // يمكنك إضافة منطق مشابه هنا لإرسال رسالة شكر للمستخدم

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully!',
    });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: error.message,
    });
  }
};

module.exports = { sendContactEmail };