import pool from '../db.js';
import { stripe } from '../utils/stripeConfig.js';
import logger from '../utils/logger.js';

// GET /api/pro/billing/invoices - Get invoice history
export const getInvoices = async (req, res) => {
  const entrepriseId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  try {
    // Get invoices from database
    const [rows] = await pool.query(
      `SELECT id, stripe_invoice_id, amount, currency, status, date, pdf_url
       FROM invoices WHERE entreprise_id = ?
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [entrepriseId, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM invoices WHERE entreprise_id = ?',
      [entrepriseId]
    );

    const invoices = rows.map(inv => ({
      id: inv.id,
      stripe_invoice_id: inv.stripe_invoice_id,
      amount: parseFloat(inv.amount),
      currency: inv.currency,
      status: inv.status,
      date: inv.date,
      pdf_url: inv.pdf_url
    }));

    res.json({
      invoices,
      total: countRows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error('Get invoices error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération des factures' });
  }
};

// GET /api/pro/billing/invoices/:invoiceId - Get single invoice details
export const getInvoiceDetails = async (req, res) => {
  const entrepriseId = req.user.id;
  const { invoiceId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM invoices
       WHERE id = ? AND entreprise_id = ?`,
      [invoiceId, entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = rows[0];

    // If we have Stripe invoice ID, fetch from Stripe for latest data
    let stripeInvoice = null;
    if (invoice.stripe_invoice_id) {
      try {
        stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);
      } catch (err) {
        logger.warn('Failed to fetch from Stripe', { error: err.message });
      }
    }

    res.json({
      id: invoice.id,
      stripe_invoice_id: invoice.stripe_invoice_id,
      amount: parseFloat(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      date: invoice.date,
      pdf_url: invoice.pdf_url,
      stripe_data: stripeInvoice ? {
        number: stripeInvoice.number,
        lines: stripeInvoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount / 100,
          currency: line.currency,
          period: {
            start: line.period?.start ? new Date(line.period.start * 1000) : null,
            end: line.period?.end ? new Date(line.period.end * 1000) : null
          }
        }))
      } : null
    });
  } catch (err) {
    logger.error('Get invoice details error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération de la facture' });
  }
};

// GET /api/pro/billing/invoices/:invoiceId/pdf - Download invoice PDF
export const downloadInvoicePdf = async (req, res) => {
  const entrepriseId = req.user.id;
  const { invoiceId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT pdf_url, stripe_invoice_id FROM invoices
       WHERE id = ? AND entreprise_id = ?`,
      [invoiceId, entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = rows[0];
    const pdfUrl = invoice.pdf_url;

    if (!pdfUrl) {
      // Try to fetch from Stripe
      if (invoice.stripe_invoice_id) {
        try {
          const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);
          if (stripeInvoice.invoice_pdf) {
            return res.json({ pdf_url: stripeInvoice.invoice_pdf });
          }
        } catch (err) {
          logger.warn('Failed to get PDF from Stripe', { error: err.message });
        }
      }
      return res.status(404).json({ error: 'PDF non disponible' });
    }

    // Redirect to Stripe-hosted PDF
    res.json({ pdf_url: pdfUrl });
  } catch (err) {
    logger.error('Download invoice error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors du téléchargement de la facture' });
  }
};

// GET /api/pro/billing/summary - Get billing summary (next invoice date, amount, etc.)
export const getBillingSummary = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT stripe_subscription_id, stripe_customer_id, subscription_status,
              subscription_plan, current_period_end, cancel_at_period_end
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const entreprise = rows[0];
    let summary = {
      status: entreprise.subscription_status,
      plan: entreprise.subscription_plan,
      current_period_end: entreprise.current_period_end,
      cancel_at_period_end: entreprise.cancel_at_period_end,
      next_invoice_date: entreprise.current_period_end,
      amount: null,
      currency: null,
      upcoming_invoice: null
    };

    // Get subscription from Stripe for upcoming invoice
    if (entreprise.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(entreprise.stripe_subscription_id);
        const upcomingInvoices = await stripe.invoices.list({
          subscription: entreprise.stripe_subscription_id,
          limit: 1,
          status: 'draft'
        });

        if (upcomingInvoices.data.length > 0) {
          const upcoming = upcomingInvoices.data[0];
          summary.upcoming_invoice = {
            amount: upcoming.amount_due / 100,
            currency: upcoming.currency,
            due_date: new Date(upcoming.due_date * 1000) || new Date(upcoming.created * 1000)
          };
        }

        // Get the subscription item to show current price
        if (subscription.items.data.length > 0) {
          const item = subscription.items.data[0];
          summary.amount = item.price.unit_amount / 100;
          summary.currency = item.price.currency.toUpperCase();
        }
      } catch (err) {
        logger.warn('Failed to fetch Stripe subscription', { error: err.message });
      }
    }

    res.json(summary);
  } catch (err) {
    logger.error('Get billing summary error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération du résumé de facturation' });
  }
};

export default {
  getInvoices,
  getInvoiceDetails,
  downloadInvoicePdf,
  getBillingSummary
};
