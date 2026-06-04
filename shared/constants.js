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
  VERSION_SAVED: 'version_saved'
};

module.exports = { PERMISSIONS, DOCUMENT_STATUS, NOTIFICATION_TYPES };
