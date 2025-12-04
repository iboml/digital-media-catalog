// Email Module - Handles email notifications
// This module provides a sendMail function that can be replaced with a real email system

/**
 * Sends an email notification
 * This function logs the email details to the console for demonstration
 * 
 * Example integration points:
 * - Nodemailer with SMTP server
 * - SendGrid API
 * - AWS Simple Email Service (SES)
 * - Mailgun API
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} body - Email body text (plain text)
 * @returns {boolean} Returns true to indicate the email was processed
 */
function sendMail(to, subject, body) {
    // Validate inputs
    if (!to || !subject || !body) {
        console.log('[EMAIL ERROR] Missing required fields');
        return false;
    }
    
    // Get current timestamp for logging
    const timestamp = new Date().toISOString();
    
    // Log the email notification to console
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    EMAIL NOTIFICATION                       ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ Timestamp: ' + timestamp);
    console.log('║ To: ' + to);
    console.log('║ Subject: ' + subject);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║ Body:');
    
    // Print body with proper formatting
    const bodyLines = body.split('\n');
    for (let i = 0; i < bodyLines.length; i++) {
        console.log('║   ' + bodyLines[i]);
    }
    
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Return true to indicate success
    // The calling code can check this return value
    return true;
}

// Export the sendMail function
module.exports = {
    sendMail
};