const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'pandoo',
    },
    plaid: {
        clientId: process.env.PLAID_CLIENT_ID || '',
        secret: process.env.PLAID_SECRET || '',
        env: process.env.PLAID_ENV || 'sandbox',
    },
};

module.exports = config;