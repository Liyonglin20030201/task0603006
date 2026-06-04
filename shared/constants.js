const PERMISSIONS = {
  VIEW: 'view',
  COMMENT: 'comment',
  EDIT: 'edit'
};

const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  TRASHED: 'trashed',
  DELETED: 'deleted'
};

const NOTIFICATION_TYPES = {
  SHARE_INVITE: 'share_invite',
  COMMENT: 'comment',
  MENTION: 'mention',
  VERSION_SAVED: 'version_saved',
  APPROVAL_REQUESTED: 'approval_requested',
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_REJECTED: 'approval_rejected'
};

const TEMPLATE_CATEGORIES = {
  MEETING: 'meeting',
  REPORT: 'report',
  PROPOSAL: 'proposal',
  GENERAL: 'general',
  NOTES: 'notes'
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

module.exports = { PERMISSIONS, DOCUMENT_STATUS, NOTIFICATION_TYPES, TEMPLATE_CATEGORIES, APPROVAL_STATUS };
