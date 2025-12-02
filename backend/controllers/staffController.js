const TicketDAO = require('../models/TicketDAO');
const LoyaltyDAO = require('../models/LoyaltyDAO');

function searchTicket(req, res) {
  const { ticketIdentifier } = req.params;
  TicketDAO.getTicketByIdentifier(ticketIdentifier, (err, ticket) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  });
}

function getTicketsByReader(req, res) {
  const { readerId } = req.params;
  TicketDAO.getTicketsByReaderId(readerId, (err, tickets) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(tickets);
  });
}

function getLoyaltyPackages(req, res) {
  LoyaltyDAO.getAllPackages((err, packages) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(packages);
  });
}

function applyLoyalty(req, res) {
  const { ticketId } = req.params;
  const { packageCode } = req.body;
  TicketDAO.applyLoyaltyToTicket(ticketId, packageCode, (err, result) => {
    if (err) {
      const message = err.message || 'Error applying loyalty';
      if (message === 'Insufficient points' || message === 'Loyalty package not found') return res.status(400).json({ error: message });
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(result);
  });
}

function confirmLoan(req, res) {
  const { ticketId } = req.params;
  const { items } = req.body;
  TicketDAO.confirmLoan(ticketId, items, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || 'Database error' });
    res.json(result);
  });
}

function cancelTicket(req, res) {
  const { ticketId } = req.params;
  TicketDAO.cancelTicket(ticketId, (err) => {
    if (err) return res.status(500).json({ error: err.message || 'Database error' });
    res.json({ message: 'Ticket cancelled successfully' });
  });
}

module.exports = { searchTicket, getTicketsByReader, getLoyaltyPackages, applyLoyalty, confirmLoan, cancelTicket };
