const { z } = require('zod');
const AppError = require('../utils/AppError');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const productBase = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.number().min(0),
  gstRate: z.number().min(0).max(100),
  reorderLevel: z.number().int().min(0),
});

const partyBase = z.object({
  type: z.enum(['customer', 'supplier']),
  name: z.string().trim().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

exports.schemas = {
  login: z.object({ email: z.string().email(), password: z.string().min(1) }),
  register: z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'sales', 'store']).optional(),
  }),
  productCreate: productBase.partial({ gstRate: true, reorderLevel: true }),
  productUpdate: productBase.partial(),
  partyCreate: partyBase,
  partyUpdate: partyBase.partial(),
  order: z.object({
    party: objectId,
    items: z
      .array(
        z.object({
          product: objectId,
          qty: z.number().int().min(1),
          price: z.number().min(0).optional(),
        })
      )
      .min(1),
  }),
  adjust: z.object({
    product: objectId,
    qty: z.number().int().refine((n) => n !== 0, 'qty must not be 0'),
    note: z.string().optional(),
  }),
};

// Unknown keys (for example "stock" or "role" on products) are stripped by zod.
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    return next(new AppError(msg, 400));
  }
  req.body = result.data;
  next();
};