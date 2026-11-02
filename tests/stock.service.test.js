jest.mock('../models/Product', () => ({ findOneAndUpdate: jest.fn() }));
jest.mock('../models/StockLedger', () => ({ create: jest.fn() }));

const Product = require('../models/Product');
const StockLedger = require('../models/StockLedger');
const stock = require('../services/stock.service');

describe('stock.service.move', () => {
  beforeEach(() => jest.clearAllMocks());

  test('stock in increments stock and writes a ledger entry', async () => {
    Product.findOneAndUpdate.mockResolvedValue({ stock: 50 });
    await stock.move('S', { product: 'p1', qty: 50, reason: 'purchase', ref: 'o1', user: 'u1' });

    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1' }, { $inc: { stock: 50 } }, { new: true, session: 'S' }
    );
    expect(StockLedger.create).toHaveBeenCalledTimes(1);
  });

  test('stock out applies the insufficient-stock guard', async () => {
    Product.findOneAndUpdate.mockResolvedValue({ stock: 5 });
    await stock.move('S', { product: 'p1', qty: -5, reason: 'sale', ref: 'o2', user: 'u1' });

    expect(Product.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'p1', stock: { $gte: 5 } });
  });

  test('rejects when stock is insufficient and writes no ledger entry', async () => {
    Product.findOneAndUpdate.mockResolvedValue(null);
    await expect(
      stock.move('S', { product: 'p1', qty: -999, reason: 'sale', user: 'u1' })
    ).rejects.toThrow('Insufficient stock');
    expect(StockLedger.create).not.toHaveBeenCalled();
  });
});