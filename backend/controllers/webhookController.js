import { verifyWebhookSignature, handleWebhookEvent } from '../utils/webhookHandler.js';
import { STRIPE_WEBHOOK_SECRET } from '../utils/stripeConfig.js';
import logger from '../utils/logger.js';

export const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || !Buffer.isBuffer(req.rawBody)) {
    return res.status(400).send('Requête webhook invalide');
  }

  const event = verifyWebhookSignature(req.rawBody, signature, STRIPE_WEBHOOK_SECRET);
  if (!event) return res.status(400).send('Signature invalide');

  try {
    const result = await handleWebhookEvent(event);
    logger.info('Webhook Stripe', { type: event.type, id: event.id, result });
    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook Stripe en échec (sera rejoué)', { type: event.type, id: event.id, error: err.message });
    res.status(500).json({ error: 'Traitement échoué' });
  }
};

export default { stripeWebhook };
