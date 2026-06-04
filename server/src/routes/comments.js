const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const commentService = require('../services/commentService');

const router = Router();
router.use(auth);

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  anchorFrom: z.number().int().optional(),
  anchorTo: z.number().int().optional(),
  parentId: z.string().optional()
});

router.get('/:id/comments', (req, res, next) => {
  try {
    const comments = commentService.listComments(req.params.id, req.user.id);
    res.json(comments);
  } catch (err) { next(err); }
});

router.post('/:id/comments', validate(createCommentSchema), (req, res, next) => {
  try {
    const comment = commentService.createComment(req.params.id, req.user.id, req.validated);
    res.status(201).json(comment);
  } catch (err) { next(err); }
});

router.put('/comments/:commentId', (req, res, next) => {
  try {
    const comment = commentService.updateComment(req.params.commentId, req.user.id, req.body.content);
    res.json(comment);
  } catch (err) { next(err); }
});

router.delete('/comments/:commentId', (req, res, next) => {
  try {
    commentService.deleteComment(req.params.commentId, req.user.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
});

router.post('/comments/:commentId/resolve', (req, res, next) => {
  try {
    const comment = commentService.resolveComment(req.params.commentId, req.user.id);
    res.json(comment);
  } catch (err) { next(err); }
});

module.exports = router;
