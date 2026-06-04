const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const approvalService = require('../services/approvalService');

const router = Router();
router.use(auth);

// List pending approvals for current user
router.get('/pending', (req, res, next) => {
  try {
    const approvals = approvalService.listPendingForUser(req.user.id);
    res.json(approvals);
  } catch (err) { next(err); }
});

// Get approval request details
router.get('/:requestId', (req, res, next) => {
  try {
    const request = approvalService.getRequest(req.params.requestId, req.user.id);
    res.json(request);
  } catch (err) { next(err); }
});

// Approve
router.post('/:requestId/approve', validate(z.object({
  comment: z.string().max(1000).optional()
})), (req, res, next) => {
  try {
    const result = approvalService.approve(req.params.requestId, req.user.id, req.validated.comment);
    res.json(result);
  } catch (err) { next(err); }
});

// Reject
router.post('/:requestId/reject', validate(z.object({
  comment: z.string().max(1000).optional()
})), (req, res, next) => {
  try {
    const result = approvalService.reject(req.params.requestId, req.user.id, req.validated.comment);
    res.json(result);
  } catch (err) { next(err); }
});

// Cancel
router.post('/:requestId/cancel', (req, res, next) => {
  try {
    const result = approvalService.cancel(req.params.requestId, req.user.id);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
