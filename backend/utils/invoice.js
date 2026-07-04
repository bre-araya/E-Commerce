const PDFDocument = require('pdfkit');

// Generate a simple invoice PDF buffer from an order object
// order: mongoose Order document (populated with items and user)
exports.generateInvoiceBuffer = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text('Invoice', { align: 'right' });
      doc.moveDown();

      // Order + customer
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
      doc.moveDown();
      doc.text(`Customer: ${order.user?.name || ''}`);
      doc.text(`Email: ${order.user?.email || ''}`);
      doc.moveDown();

      // Shipping address
      doc.text('Shipping Address:');
      const addr = order.shippingAddress || {};
      doc.text(`${addr.fullName || ''}`);
      doc.text(`${addr.address || ''}`);
      doc.text(`${addr.city || ''} ${addr.postalCode || ''}`);
      doc.text(`${addr.country || ''}`);
      doc.moveDown();

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, doc.y, { continued: true });
      doc.text('Qty', 330, doc.y, { continued: true });
      doc.text('Price', 380, doc.y, { continued: true });
      doc.text('Total', 450, doc.y);
      doc.moveDown();
      doc.font('Helvetica');

      for (const item of order.items) {
        const name = item.name || '';
        const qty = item.quantity || 0;
        const price = (item.price || 0).toFixed(2);
        const lineTotal = (item.price * item.quantity || 0).toFixed(2);

        doc.text(name, 50, doc.y, { continued: true });
        doc.text(qty.toString(), 330, doc.y, { continued: true });
        doc.text(`$${price}`, 380, doc.y, { continued: true });
        doc.text(`$${lineTotal}`, 450, doc.y);
        doc.moveDown();
      }

      doc.moveDown();
      doc.text(`Items: $${order.itemsPrice.toFixed(2)}`, { align: 'right' });
      doc.text(`Shipping: $${order.shippingPrice.toFixed(2)}`, { align: 'right' });
      doc.text(`Total: $${order.totalPrice.toFixed(2)}`, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
