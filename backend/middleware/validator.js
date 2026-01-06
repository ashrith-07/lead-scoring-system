const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const leadValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Company name too long'),
    body('phone')
      .optional()
      .trim(),
    validate,
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid lead ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Company name too long'),
    body('phone')
      .optional()
      .trim(),
    validate,
  ],
};

const eventValidation = {
  create: [
    body('event_id')
      .trim()
      .notEmpty().withMessage('Event ID is required'),
    body('event_type')
      .trim()
      .notEmpty().withMessage('Event type is required')
      .isIn(['email_open', 'page_view', 'form_submission', 'demo_request', 'purchase'])
      .withMessage('Invalid event type'),
    body('lead_id')
      .trim()
      .notEmpty().withMessage('Lead ID is required')
      .isMongoId().withMessage('Invalid lead ID format'),
    body('timestamp')
      .notEmpty().withMessage('Timestamp is required')
      .isISO8601().withMessage('Invalid timestamp format'),
    body('metadata')
      .optional()
      .isObject().withMessage('Metadata must be an object'),
    validate,
  ],
};

const ruleValidation = {
  update: [
    param('id').isMongoId().withMessage('Invalid rule ID'),
    body('points')
      .optional()
      .isInt().withMessage('Points must be an integer'),
    body('active')
      .optional()
      .isBoolean().withMessage('Active must be boolean'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description too long'),
    validate,
  ],
};

const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validate,
  ],

  status: [
    query('status')
      .optional()
      .isIn(['cold', 'warm', 'hot']).withMessage('Invalid status'),
    validate,
  ],
};

module.exports = {
  validate,
  leadValidation,
  eventValidation,
  ruleValidation,
  queryValidation,
};