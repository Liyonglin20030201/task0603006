const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const approvalService = require('../services/approvalService');

const router = Router();
router.use(auth);

// Submit for approval
router.post('/:id/approvals', validate(z.object({
  title: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  reviewerIds: z.array(z.string()).min(1)
})), (req, res, next) => {
  try {
    const result = approvalService.submitForApproval(req.params.id, req.user.id, req.validated);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// List approvals for document
router.get('/:id/approvals', (req, res, next) => {
  try {
    const approvals = approvalService.listByDocument(req.params.id, req.user.id);
    res.json(approvals);
  } catch (err) { next(err); }
});

module.exports = router;
