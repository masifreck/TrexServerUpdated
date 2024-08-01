const express = require('express');
const { UserDetail } = require('otpless-node-js-auth-sdk');
const router = express.Router();

// Load environment variables
const clientId = process.env.AUTH_CLIENT_ID || 'Y14XDJ6L5ONEYM22XL6F4LY6G0I635FV';
const clientSecret = process.env.AUTH_CLIENT_SECRET || '95znpyv32h17dfp9v4cl9t383d5m9yqq';
console.log('Client ID:', clientId);
console.log('Client Secret:', clientSecret);


/**
 * * Send OTP
 * @request { mobile, email, orderId, hash, otpLength, channel } @body [either mobile or email mandatory, orderId- optional, hash- optional, otpLength- optional, channel- optional]
 * @channel { SMS || WHATSAPP || SMS,WHATSAPP || EMAIL }
 * @param hash optional and only for @SMS
 * @response {success: Boolean, data: { orderId: String }}
 */
router.post('/otp/send/:channel', async (req, res) => {
    const channel = req.params.channel;
    const { mobile, email, orderId, hash, expiry, otpLength } = req.body;
    // Validate the request
    if (!mobile && !email) {
        return res.status(400).send({ success: false, error: 'Either mobile or email is required' });
    }
    if (!channel) {
        return res.status(400).send({ success: false, error: 'Channel is required' });
    }
    try {
        // Send an OTP to the user via the specified channel
        const response = await UserDetail.sendOTP(mobile, email, channel, hash, orderId, expiry ?? 60, otpLength ?? 6, clientId, clientSecret);
        if (response?.errorMessage) {
            return res.status(500).send(response);
        }
        res.status(200).send({ success: true, data: response });
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, error: err });
    }
});

/**
 * * Verify OTP
 * @request { orderId, otp, mobile, email } @body  [orderID-mandatory, otp-mandatory, either mobile or email mandatory]
 * @response {success: Boolean, data: { isOTPVerified: Boolean }}
 */
router.post('/otp/verify', async (req, res) => {
    const { orderId, otp, mobile, email } = req.body;

    // Validate the request
    if (!orderId || !otp) {
        return res.status(400).send({ success: false, error: 'Invalid request - orderId and otp are required' });
    }
    if (!mobile && !email) {
        return res.status(400).send({ success: false, error: 'Invalid request - mobile or email is required' });
    }

    try {
        // Verify the OTP
        const response = await UserDetail.verifyOTP(email, mobile, orderId, otp, clientId, clientSecret);
        if (response?.errorMessage) {
            return res.status(500).send(response);
        }
        res.status(200).send({ success: true, data: response });
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, error: err });
    }
});



module.exports = router;
