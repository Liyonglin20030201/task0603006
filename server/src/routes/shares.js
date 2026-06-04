const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const shareService = require('../services/shareService');

const router = Router();
router.use(auth);

const shareSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['view', 'comment', 'edit'])
});

router.get('/:id/shares', (req, res, next) => {
  try {
    const shares = shareService.listShares(req.params.id, req.user.id);
    res.json(shares);
  } catch (err) { next(err); }
});

router.post('/:id/shares', validate(shareSchema), (req, res, next) => {
  try {
    const share = shareService.shareDocument(req.params.id, req.user.id, req.validated);
    res.status(201).json(share);
  } catch (err) { next(err); }
});

router.put('/:id/shares/:shareId', (req, res, next) => {
  try {
    const share = shareService.updatePermission(req.params.shareId, req.user.id, req.body.permission);
    res.json(share);
  } catch (err) { next(err); }
});

router.delete('/:id/shares/:shareId', (req, res, next) => {
  try {
    shareService.revokeShare(req.params.shareId, req.user.id);
    res.json({ message: 'Access revoked' });
  } catch (err) { next(err); }
});

module.exports = router;
