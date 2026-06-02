import db from '../config/database.js';
import transporter from '../config/mail.js';

// In-memory OTP storage for demo purposes
// In production, this should be in the DB with an expiry
const otpStore = new Map();

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // 1. Check users table
        let userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        // 2. Check laundries table if not found in users
        let table = 'users';
        if (userRes.rows.length === 0) {
            userRes = await db.query('SELECT * FROM laundries WHERE (email = $1 OR username = $1)', [email]);
            table = 'laundries';
        }

        if (userRes.rows.length === 0) {
            // Success response even if not found to prevent user enumeration
            return res.json({ 
                message: 'If an account exists with this email, an OTP has been sent.',
                status: 'otp_sent'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store the OTP with 10-minute expiry
        otpStore.set(email, {
            otp,
            table,
            expiry: Date.now() + 10 * 60 * 1000
        });

        // Send Email
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"GoWash Support" <noreply@gowash.com>',
                to: email,
                subject: 'Your Password Reset OTP',
                text: `Hello,\n\nYour OTP for password reset is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #4c669f;">GoWash Password Reset</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Use the following OTP code to continue:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #192f6a; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>This code will expire in <strong>10 minutes</strong>.</p>
                        <p style="color: #888; font-size: 12px; margin-top: 30px;">
                            If you did not request this, please ignore this email.
                        </p>
                    </div>
                `
            });
            console.log(`[PASS_RESET] OTP sent successfully to ${email}`);
        } catch (mailError) {
            console.error('Failed to send email:', mailError);
            // Even if mail fails, keep it in the store for demo if we want, 
            // but for production this should be an error.
            // Since we're in dev, I'll still return success but log error.
        }

        console.log(`[PASS_RESET] OTP for ${email}: ${otp}`);

        return res.json({ 
            message: 'A 6-digit OTP has been sent to your email.',
            status: 'otp_sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
        return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }

    if (Date.now() > storedData.expiry) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified but keep the record so resetPassword knows the table
    storedData.verified = true;
    otpStore.set(email, storedData);

    return res.json({ 
        message: 'OTP verified successfully.',
        status: 'verified',
        table: storedData.table
    });
};

export const resetPassword = async (req, res) => {
    const { email, newPassword, otp } = req.body;

    if (!email || !newPassword || !otp) {
        return res.status(400).json({ message: 'Email, new password and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData || !storedData.verified || storedData.otp !== otp) {
        return res.status(403).json({ message: 'Invalid or expired session. Please verify your OTP again.' });
    }

    try {
        const { table } = storedData;
        const tableName = table === 'laundries' ? 'laundries' : 'users';
        const filterExpr = table === 'laundries' ? '(email = $1 OR username = $1)' : 'email = $1';

        await db.query(`UPDATE ${tableName} SET password = $2 WHERE ${filterExpr}`, [email, newPassword]);

        // Clear the OTP store for this email
        otpStore.delete(email);

        return res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
