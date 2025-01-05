module.exports = {
  app: {
    name: 'RMIT Ecommerce', // Application name
    apiURL: `${process.env.BASE_API_URL}`, // Base API URL
    clientURL: process.env.CLIENT_URL // Client URL
  },
  port: process.env.PORT || 3000, // Server port
  database: {
    url: process.env.NODE_ENV === 'production' 
      ? process.env.MONGO_URI_PROD // Use production URI in production
      : process.env.MONGO_URI_DEV  // Use development URI otherwise
  },
  jwt: {
    secret: process.env.JWT_SECRET, // JWT secret key
    tokenLife: '7d' // JWT token life
  },
  mailchimp: {
    key: process.env.MAILCHIMP_KEY, // Mailchimp API key
    listKey: process.env.MAILCHIMP_LIST_KEY // Mailchimp list key
  },
  mailgun: {
    key: process.env.MAILGUN_KEY, // Mailgun API key
    domain: process.env.MAILGUN_DOMAIN, // Mailgun domain
    sender: process.env.MAILGUN_EMAIL_SENDER // Mailgun email sender
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // AWS access key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // AWS secret access key
    region: process.env.AWS_REGION, // AWS region
    bucketName: process.env.AWS_BUCKET_NAME // AWS S3 bucket name
  }
};