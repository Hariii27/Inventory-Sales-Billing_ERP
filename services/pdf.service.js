const PDFDocument = require('pdfkit');

exports.invoice = (order, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${order.number || 'draft'}.pdf"`);
  doc.pipe(res);

  const isSale = order.type === 'sale';
  doc.fontSize(20).text(isSale ? 'TAX INVOICE' : 'PURCHASE ORDER', { align: 'center' }).moveDown();

  doc.fontSize(10)
    .text(`Number: ${order.number || 'DRAFT'}`)
    .text(`Date: ${order.createdAt.toDateString()}`)
    .text(`Status: ${order.status.toUpperCase()}`)
    .moveDown(0.5)
    .text(`${isSale ? 'Customer' : 'Supplier'}: ${order.party.name}`);
  if (order.party.gstin) doc.text(`GSTIN: ${order.party.gstin}`);
  if (order.party.address) doc.text(`Address: ${order.party.address}`);
  doc.moveDown();

  const col = { n: 40, item: 65, qty: 300, price: 350, gst: 420, amt: 480 };
  const header = doc.y;
  doc.font('Helvetica-Bold')
    .text('#', col.n, header)
    .text('Item', col.item, header)
    .text('Qty', col.qty, header)
    .text('Price', col.price, header)
    .text('GST %', col.gst, header)
    .text('Amount', col.amt, header);
  doc.moveTo(40, header + 14).lineTo(555, header + 14).stroke();
  doc.font('Helvetica');

  let y = header + 22;
  order.items.forEach((i, idx) => {
    doc.text(String(idx + 1), col.n, y)
      .text(i.name, col.item, y, { width: 225 })
      .text(String(i.qty), col.qty, y)
      .text(i.price.toFixed(2), col.price, y)
      .text(String(i.gstRate), col.gst, y)
      .text((i.qty * i.price).toFixed(2), col.amt, y);
    y += 20;
  });

  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 10;
  doc.text(`Subtotal: Rs. ${order.subtotal.toFixed(2)}`, 340, y, { align: 'right', width: 215 });
  doc.text(`GST: Rs. ${order.tax.toFixed(2)}`, 340, y + 15, { align: 'right', width: 215 });
  doc.font('Helvetica-Bold').fontSize(12)
    .text(`Total: Rs. ${order.total.toFixed(2)}`, 340, y + 32, { align: 'right', width: 215 });

  doc.end();
};