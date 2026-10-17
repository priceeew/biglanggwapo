import React, { useRef } from 'react';
import { Download, Printer, FileText, Check, X, Scissors, ShieldCheck } from 'lucide-react';
import { currency, humanDate } from '../../context/StoreContext';

export function normalizeReceiptData(source, settings = {}, demoTransactions = []) {
  if (!source) return null;

  const isTransaction = Boolean(source.receipt && (source.amount !== undefined || source.type));

  let matchedTxn = null;
  if (!isTransaction && Array.isArray(demoTransactions) && demoTransactions.length > 0) {
    matchedTxn = demoTransactions.find(
      (t) =>
        (source.id && t.appointmentId === source.id) ||
        (t.customerName && source.customerName && t.customerName === source.customerName && t.date === source.date)
    );
  }

  const merged = matchedTxn ? { ...source, ...matchedTxn } : source;

  const dateStr = merged.date ? String(merged.date).replaceAll('-', '') : new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const idSuffix = merged.id ? String(merged.id).replace(/\D/g, '').slice(-4) || '101' : '101';
  const receiptNo = merged.receipt || (merged.type === 'Retail' ? `BG-RET-${dateStr}-${idSuffix}` : `BG-${dateStr}-${idSuffix}`);

  const customerName = merged.customerName || 'Valued Customer';
  const barberName = merged.barberName || (merged.type === 'Retail' ? 'Front Desk Staff' : 'Barber Specialist');
  const serviceOrItemName = merged.serviceName || merged.name || 'Barbershop Service';
  const date = merged.date || new Date().toISOString().slice(0, 10);
  const time = merged.time || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const amount = Number(merged.amount !== undefined ? merged.amount : (merged.price !== undefined ? merged.price : 0)) || 0;
  const method = merged.method || merged.paymentMethod || 'Cash';
  const type = merged.type || 'Service';

  let items = [];
  if (Array.isArray(merged.items) && merged.items.length > 0) {
    items = merged.items.map((i) => ({
      name: i.name || serviceOrItemName,
      quantity: Number(i.quantity) || 1,
      price: Number(i.price !== undefined ? i.price : amount)
    }));
  } else {
    items = [
      {
        name: serviceOrItemName,
        quantity: 1,
        price: amount
      }
    ];
  }

  const cashReceived = merged.cashReceived !== undefined ? Number(merged.cashReceived) : (method === 'Cash' ? amount : undefined);
  const change = merged.change !== undefined ? Number(merged.change) : (method === 'Cash' ? Math.max(0, (cashReceived || amount) - amount) : undefined);

  const gcashNumber = merged.gcashNumber || '';
  const gcashReference = merged.gcashReference || merged.gcashRef || '';
  const cardBrand = merged.cardBrand || 'Visa';
  const cardLast4 = merged.cardLast4 || '4242';
  const authCode = merged.authCode || 'AUTH-892114';
  const paymentDetails = merged.paymentDetails || '';

  const shopName = settings?.shopName || 'Biglang Gwapo Barbershop';
  const shopPhone = settings?.phone || '+63 917 555 0100';
  const shopAddress = settings?.address || '180 Cutcot National Highway, Pulilan, Bulacan';
  const shopEmail = settings?.email || 'hello@biglanggwapo.demo';

  return {
    id: merged.id,
    receiptNo,
    customerName,
    barberName,
    serviceOrItemName,
    date,
    time,
    amount,
    method,
    type,
    items,
    cashReceived,
    change,
    gcashNumber,
    gcashReference,
    cardBrand,
    cardLast4,
    authCode,
    paymentDetails,
    shopName,
    shopPhone,
    shopAddress,
    shopEmail,
    status: merged.status || 'Paid'
  };
}

export function downloadReceiptPNG(receiptData, onDone) {
  if (!receiptData) return;

  const width = 500;
  const baseHeight = 720;
  const itemsHeight = (receiptData.items?.length || 1) * 32;
  const methodHeight = receiptData.method === 'Cash' ? 60 : 70;
  const height = baseHeight + itemsHeight + methodHeight;

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e2dfd7';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  ctx.fillStyle = '#c5a059';
  ctx.fillRect(8, 8, width - 16, 6);

  let y = 42;

  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 20px "Playfair Display", Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText(receiptData.shopName.toUpperCase(), width / 2, y);

  y += 18;
  ctx.fillStyle = '#c5a059';
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText("PREMIUM CUT & GENTLEMEN'S GROOMING", width / 2, y);

  y += 18;
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillText(receiptData.shopAddress, width / 2, y);

  y += 15;
  ctx.fillText(`Tel: ${receiptData.shopPhone} · Email: ${receiptData.shopEmail}`, width / 2, y);

  const drawDashedLine = (lineY) => {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, lineY);
    ctx.lineTo(width - 24, lineY);
    ctx.stroke();
    ctx.restore();
  };

  y += 16;
  drawDashedLine(y);

  y += 24;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText("OFFICIAL ELECTRONIC RECEIPT", width / 2, y);

  const drawRow = (label, val, rowY, valBold = false, valColor = '#0f172a', mono = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(label, 26, rowY);

    ctx.textAlign = 'right';
    ctx.fillStyle = valColor;
    ctx.font = `${valBold ? 'bold ' : ''}11px ${mono ? '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace' : 'system-ui, -apple-system, sans-serif'}`;
    ctx.fillText(val, width - 26, rowY);
  };

  y += 20;
  drawRow('Receipt No:', receiptData.receiptNo, y, true, '#c5a059', true);

  y += 18;
  drawRow('Date & Time:', `${receiptData.date} · ${receiptData.time}`, y);

  y += 18;
  drawRow('Customer:', receiptData.customerName, y, true);

  y += 18;
  drawRow(receiptData.type === 'Retail' ? 'Attendant / Cashier:' : 'Barber Specialist:', receiptData.barberName, y);

  y += 18;
  drawRow('Order Type:', receiptData.type === 'Retail' ? 'Retail Product Sale' : 'Barber Service Visit', y);

  y += 16;
  drawDashedLine(y);

  y += 18;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.fillText('DESCRIPTION', 26, y);

  ctx.textAlign = 'center';
  ctx.fillText('QTY', width - 110, y);

  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', width - 26, y);

  y += 10;
  drawDashedLine(y);

  receiptData.items.forEach((item) => {
    y += 22;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    const itemName = item.name.length > 30 ? item.name.slice(0, 28) + '...' : item.name;
    ctx.fillText(itemName, 26, y);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`x${item.quantity}`, width - 110, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`PHP ${Number(item.price * item.quantity).toFixed(2)}`, width - 26, y);
  });

  y += 14;
  drawDashedLine(y);

  const subtotal = receiptData.amount;
  const vatRate = 0.12;
  const vatAmount = subtotal * (vatRate / (1 + vatRate));
  const netVat = subtotal - vatAmount;

  y += 18;
  drawRow('Subtotal (Net of VAT):', `PHP ${netVat.toFixed(2)}`, y);

  y += 16;
  drawRow('Value Added Tax (12%):', `PHP ${vatAmount.toFixed(2)}`, y);

  y += 14;
  drawDashedLine(y);

  y += 14;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(24, y, width - 48, 48);
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, y, width - 48, 48);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL AMOUNT DUE', 38, y + 29);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#c5a059';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`PHP ${subtotal.toFixed(2)}`, width - 38, y + 31);

  y += 62;
  drawDashedLine(y);

  y += 20;
  drawRow('Payment Method:', receiptData.method.toUpperCase(), y, true, '#0f172a');

  if (receiptData.method === 'Cash') {
    y += 18;
    drawRow('Cash Tendered:', `PHP ${(receiptData.cashReceived || subtotal).toFixed(2)}`, y);
    y += 18;
    drawRow('Change Due:', `PHP ${(receiptData.change || 0).toFixed(2)}`, y, true, '#16a34a');
  } else if (receiptData.method === 'GCash') {
    y += 18;
    drawRow('GCash Reference:', receiptData.gcashReference || '902144810293', y, true, '#007dfe', true);
    if (receiptData.gcashNumber) {
      y += 18;
      drawRow('Sender Mobile:', receiptData.gcashNumber, y);
    }
  } else if (receiptData.method === 'Card only') {
    y += 18;
    drawRow('Terminal Card:', `${receiptData.cardBrand} •••• ${receiptData.cardLast4}`, y, true);
    y += 18;
    drawRow('Authorization Code:', receiptData.authCode, y, true, '#0f172a', true);
  }

  y += 18;
  drawRow('Transaction Status:', '✓ PAID & SETTLED', y, true, '#16a34a');

  y += 18;
  drawDashedLine(y);

  y += 20;
  ctx.fillStyle = '#1e293b';
  const barPattern = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4];
  let barX = width / 2 - 120;
  barPattern.forEach((w) => {
    ctx.fillRect(barX, y, w, 32);
    barX += w + 2;
  });

  y += 44;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '10px "SFMono-Regular", Consolas, monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(receiptData.receiptNo, width / 2, y);

  y += 22;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillText('“Salamat sa pagtitiwala! Haircut is a lifestyle.”', width / 2, y);

  y += 16;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px system-ui, -apple-system, sans-serif';
  ctx.fillText('This serves as your official digital receipt for tax and warranty purposes.', width / 2, y);

  ctx.fillStyle = '#c5a059';
  ctx.fillRect(8, height - 14, width - 16, 6);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BiglangGwapo_Receipt_${receiptData.receiptNo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onDone) onDone();
  }, 'image/png');
}

export function downloadReceiptTXT(receiptData, onDone) {
  if (!receiptData) return;

  const doubleLine = '='.repeat(48);
  const singleLine = '-'.repeat(48);

  const textLines = [
    doubleLine,
    '           BIGLANG GWAPO BARBERSHOP            ',
    '       Premium Cut & Grooming Lounge           ',
    '    180 Cutcot National Hwy, Pulilan, Bulacan  ',
    `             Tel: ${receiptData.shopPhone}    `,
    doubleLine,
    `OFFICIAL RECEIPT: ${receiptData.receiptNo}`,
    `Date & Time:      ${receiptData.date} ${receiptData.time}`,
    `Customer:         ${receiptData.customerName}`,
    `Barber / Staff:   ${receiptData.barberName}`,
    `Order Type:       ${receiptData.type}`,
    singleLine,
    'ITEM                            QTY       AMOUNT',
    singleLine,
    ...receiptData.items.map((i) => {
      const name = (i.name || '').padEnd(30).slice(0, 30);
      const qty = String(i.quantity || 1).padStart(3);
      const amt = `PHP ${Number((i.price || 0) * (i.quantity || 1)).toFixed(2)}`.padStart(13);
      return `${name} ${qty} ${amt}`;
    }),
    singleLine,
    `TOTAL AMOUNT DUE: PHP ${receiptData.amount.toFixed(2)}`.padStart(48),
    singleLine,
    `Payment Method:   ${receiptData.method}`,
    receiptData.cashReceived ? `Cash Tendered:    PHP ${receiptData.cashReceived.toFixed(2)}` : null,
    receiptData.change !== undefined ? `Change Due:       PHP ${receiptData.change.toFixed(2)}` : null,
    receiptData.gcashReference ? `GCash Reference:  ${receiptData.gcashReference}` : null,
    receiptData.gcashNumber ? `GCash Sender:     ${receiptData.gcashNumber}` : null,
    receiptData.cardLast4 ? `Card Terminal:    ${receiptData.cardBrand} **** ${receiptData.cardLast4}` : null,
    receiptData.authCode ? `Auth Code:        ${receiptData.authCode}` : null,
    `Status:           ${(receiptData.status || 'PAID').toUpperCase()}`,
    doubleLine,
    '     Salamat sa pagtitiwala sa Biglang Gwapo!   ',
    '            Haircut is a lifestyle.             ',
    doubleLine
  ].filter(Boolean);

  const blob = new Blob([textLines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BiglangGwapo_Receipt_${receiptData.receiptNo}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  if (onDone) onDone();
}

export function printReceipt() {
  window.print();
}

export function ReceiptModal({
  item,
  onClose,
  settings,
  transactions = [],
  isPreview = false,
  notify = () => {}
}) {
  const printableRef = useRef(null);

  if (!item) return null;

  const data = normalizeReceiptData(item, settings, transactions);
  if (!data) return null;

  const handleDownloadPNG = () => {
    downloadReceiptPNG(data, () => {
      notify(`Receipt ${data.receiptNo} downloaded as high-res PNG image!`, 'success');
    });
  };

  const handleDownloadTXT = () => {
    downloadReceiptTXT(data, () => {
      notify(`Receipt ${data.receiptNo} downloaded as text file!`, 'success');
    });
  };

  const handlePrint = () => {
    printReceipt();
  };

  const subtotal = data.amount;
  const vatAmount = subtotal * (0.12 / 1.12);
  const netVat = subtotal - vatAmount;

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card receipt-modal-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: 0,
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible'
        }}
      >
        <div
          ref={printableRef}
          className="receipt-printable-area"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid #e2dfd7',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ height: '6px', background: 'var(--gold, #c5a059)', width: '100%' }} />

          <button
            type="button"
            className="receipt-no-print"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              right: '12px',
              top: '14px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ padding: '24px 26px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(197, 160, 89, 0.15)',
                  color: 'var(--gold, #c5a059)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 8px',
                  border: '1px solid rgba(197, 160, 89, 0.4)'
                }}
              >
                <Scissors size={20} />
              </div>
              <h2
                style={{
                  margin: '0 0 2px',
                  fontSize: '18px',
                  letterSpacing: '-0.02em',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: '#0f172a'
                }}
              >
                {data.shopName.toUpperCase()}
              </h2>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--gold, #c5a059)',
                  textTransform: 'uppercase',
                  marginBottom: '6px'
                }}
              >
                Gentlemen's Cut & Grooming Lounge
              </div>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', lineHeight: 1.4 }}>
                {data.shopAddress}
                <br />
                Tel: {data.shopPhone} · {data.shopEmail}
              </p>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: isPreview ? '#d97706' : '#16a34a',
                  background: isPreview ? '#fef3c7' : '#dcfce7',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
              >
                {isPreview ? '● RECEIPT PREVIEW' : '✓ OFFICIAL RECEIPT'}
              </span>
              <strong style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--gold, #c5a059)' }}>
                {data.receiptNo}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '14px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Date & Time</span>
                <strong style={{ color: '#0f172a' }}>{data.date} · {data.time}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Customer</span>
                <strong style={{ color: '#0f172a' }}>{data.customerName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>
                  {data.type === 'Retail' ? 'Cashier / Staff' : 'Barber Specialist'}
                </span>
                <strong style={{ color: '#0f172a' }}>{data.barberName}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Category</span>
                <strong style={{ color: '#0f172a' }}>{data.type === 'Retail' ? 'Retail Products' : 'Service Appointment'}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}
              >
                <span>Description</span>
                <span style={{ width: '45px', textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {data.items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    padding: '4px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0f172a', flex: 1, paddingRight: '8px' }}>
                    {it.name}
                  </span>
                  <span style={{ width: '45px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                    x{it.quantity}
                  </span>
                  <strong style={{ color: '#0f172a', textAlign: 'right' }}>
                    {currency(it.price * it.quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal (Net of VAT)</span>
                <span>{currency(netVat)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Value Added Tax (12% Inclusive)</span>
                <span>{currency(vatAmount)}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '8px',
                margin: '12px 0'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', display: 'block' }}>
                  Total Amount Paid
                </span>
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>via {data.method}</span>
              </div>
              <strong style={{ fontSize: '20px', color: 'var(--gold, #c5a059)' }}>
                {currency(subtotal)}
              </strong>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment Method:</span>
                <strong>{data.method}</strong>
              </div>
              {data.method === 'Cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cash Tendered:</span>
                    <span>{currency(data.cashReceived || subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                    <span>Change Due:</span>
                    <span>{currency(data.change || 0)}</span>
                  </div>
                </>
              )}
              {data.method === 'GCash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GCash Reference:</span>
                    <strong style={{ fontFamily: 'var(--mono)', color: '#007dfe' }}>{data.gcashReference || '902144810293'}</strong>
                  </div>
                  {data.gcashNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Sender Number:</span>
                      <span>{data.gcashNumber}</span>
                    </div>
                  )}
                </>
              )}
              {data.method === 'Card only' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Card Terminal:</span>
                    <strong>{data.cardBrand} •••• {data.cardLast4}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Authorization:</span>
                    <strong style={{ fontFamily: 'var(--mono)' }}>{data.authCode}</strong>
                  </div>
                </>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  height: '28px',
                  padding: '2px 0'
                }}
              >
                {[3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                  <span
                    key={i}
                    style={{
                      width: `${w}px`,
                      height: '100%',
                      background: '#1e293b',
                      display: 'inline-block'
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.14em',
                  color: '#64748b',
                  marginTop: '2px'
                }}
              >
                {data.receiptNo}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '11px', fontStyle: 'italic', color: '#475569' }}>
                “Salamat sa pagtitiwala! Haircut is a lifestyle.”
              </p>
              <small style={{ fontSize: '9px', color: '#94a3b8' }}>
                Official electronic proof of payment · Biglang Gwapo
              </small>
            </div>
          </div>

          <div
            className="receipt-no-print"
            style={{
              padding: '14px 20px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="button button-dark"
                onClick={handleDownloadPNG}
                style={{
                  height: '40px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Download thermal receipt as PNG image"
              >
                <Download size={15} /> Download PNG
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={handlePrint}
                style={{
                  height: '40px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Print or Save as PDF"
              >
                <Printer size={15} /> Print / PDF
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="button button-ghost"
                onClick={handleDownloadTXT}
                style={{
                  height: '34px',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Download ASCII slip as text file"
              >
                <FileText size={14} /> Text Slip (.txt)
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={onClose}
                style={{
                  height: '34px',
                  fontSize: '11px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
