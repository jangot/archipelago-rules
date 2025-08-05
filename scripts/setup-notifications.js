const axios = require('axios');

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NOTIFICATION_HOST || 'http://localhost:3001'
});

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Helper functions for colored output
const log = {
  info: (message) => console.log(`${colors.green}[INFO]${colors.reset} ${message}`),
  warning: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`)
};

// Function to check if notification definition exists
async function checkNotificationExists(name) {
  try {
    const response = await api.get('/api/notification/notification-definitions');
    const notification = response.data.find(item => item.name === name);
    return notification ? notification.id : null;
  } catch (error) {
    log.error(`Failed to check notification ${name}: ${error.message}`);
    return null;
  }
}

// Function to create notification definition
async function createNotificationDefinition(name, dataItems) {
  try {
    const response = await api.post('/api/notification/notification-definitions', {
      name,
      dataItems
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    log.info(`Created ${name} with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    log.error(`Failed to create notification definition ${name}: ${error.message}`);
    return null;
  }
}

// Function to create notification definition item
async function createNotificationItem(
    notificationId,
    orderIndex,
    notificationType,
    template,
    header,
    body,
    target,
    metadata,
    attributes = {},
) {
  try {
    await api.post('/api/notification/notification-definition-items', {
      notificationDefinitionId: notificationId,
      orderIndex,
      notificationType,
      template,
      header,
      body,
      target,
      metadata,
      attributes,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    log.info(`Successfully created notification item for ${notificationType}`);
    return true;
  } catch (error) {
    log.error(`Failed to create notification item for ${notificationType}: ${error.message}`);
    return false;
  }
}

// Main function
async function setupNotifications() {
  log.info('Starting notification setup...');

  // Check SMS notification
  log.info('Checking if login_verification_sms exists...');
  let smsId = await checkNotificationExists('login_verification_sms');

  if (smsId) {
    log.warning(`login_verification_sms already exists with ID: ${smsId}`);
  } else {
    log.info('Creating login_verification_sms...');
    smsId = await createNotificationDefinition('login_verification_sms', ['user']);

    if (smsId) {
      await createNotificationItem(
          smsId,
          1,
          'sms',
          '',
          'SMS sending of verification code',
          'Your Zirtue verification code is: <%= code %>. Don\'t share this code with anyone; our employees will never ask for this code.\n\n- Zirtue',
          '<%= user.phoneNumber %>',
          '{}'
      );
    }
  }

  // Check Email notification
  log.info('Checking if login_verification_email exists...');
  let emailId = await checkNotificationExists('login_verification_email');

  if (emailId) {
    log.warning(`login_verification_email already exists with ID: ${emailId}`);
  } else {
    log.info('Creating login_verification_email...');
    emailId = await createNotificationDefinition('login_verification_email', ['user']);

    if (emailId) {
      await createNotificationItem(
          emailId,
          1,
          'email',
          '{ "code": "<%= code %>" }',
          'new_user_login_email_verification',
          '',
          '<%= user.email %>',
          '{ "code": "<%= code %>" }',
          {template: true}
      );
    }
  }
}

// Run the script
setupNotifications().catch(error => {
  log.error(`Script failed: ${error.message}`);
  process.exit(1);
});
