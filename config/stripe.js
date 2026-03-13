const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    '[Stripe] STRIPE_SECRET_KEY is not set. Stripe payments will not work until you configure it in .env'
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

module.exports = stripe;

