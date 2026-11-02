const Counter = require('../models/Counter');

exports.next = async (prefix, session) => {
  const c = await Counter.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  return `${prefix}-${String(c.seq).padStart(4, '0')}`;
};