import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Case, Doctor, LabSettings } from './types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function generateInvoicePDF(
  cases: Case[],
  labSettings: LabSettings,
  doctors: Doctor[]
) {
  // Group cases by doctor
  const casesByDoctor: Record<string, Case[]> = {};
  cases.forEach((c) => {
    const key = c.doctor_id || 'unknown';
    if (!casesByDoctor[key]) casesByDoctor[key] = [];
    casesByDoctor[key].push(c);
  });

  const doctorMap = new Map(doctors.map((d) => [d.id, d]));
  const doctorIds = Object.keys(casesByDoctor).sort((a, b) => {
    const nameA = doctorMap.get(a)?.name || '';
    const nameB = doctorMap.get(b)?.name || '';
    return nameA.localeCompare(nameB);
  });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const year = new Date().getFullYear();

  doctorIds.forEach((doctorId, index) => {
    const doctorCases = casesByDoctor[doctorId];
    const doctor = doctorMap.get(doctorId);
    const invoiceNum = `INV-${year}-${String(index + 1).padStart(3, '0')}`;

    if (index > 0) doc.addPage();

    let y = 20;

    // ── Lab Header (left side) ──
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // brand-600
    doc.text(labSettings.lab_name || 'Dental Lab', 20, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    y += 7;
    if (labSettings.address) {
      doc.text(labSettings.address, 20, y);
      y += 4;
    }
    const cityStateZip = [labSettings.city, labSettings.state].filter(Boolean).join(', ') +
      (labSettings.zip ? ' ' + labSettings.zip : '');
    if (cityStateZip.trim()) {
      doc.text(cityStateZip, 20, y);
      y += 4;
    }
    if (labSettings.phone) {
      doc.text(labSettings.phone, 20, y);
      y += 4;
    }
    if (labSettings.email) {
      doc.text(labSettings.email, 20, y);
    }

    // ── Invoice Info (right side) ──
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${today}`, pageWidth - 20, 28, { align: 'right' });
    doc.text(`Invoice #: ${invoiceNum}`, pageWidth - 20, 33, { align: 'right' });

    // ── Divider ──
    y = 50;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    // ── Bill To ──
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('BILL TO', 20, y);

    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(doctor?.name || 'Unknown Doctor', 20, y);

    if (doctor?.practice) {
      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(doctor.practice, 20, y);
    }

    // ── Cases Table ──
    y += 10;

    const tableData = doctorCases.map((c) => [
      c.rush ? `${c.case_number} (Rush)` : c.case_number,
      c.patient,
      c.type + (c.shade && c.shade !== '-' ? ` / ${c.shade}` : ''),
      formatDate(c.due),
      formatCurrency(Number(c.price)),
    ]);

    const total = doctorCases.reduce((sum, c) => sum + Number(c.price), 0);

    autoTable(doc, {
      startY: y,
      head: [['Case #', 'Patient', 'Restoration', 'Due Date', 'Price']],
      body: tableData,
      margin: { left: 20, right: 20 },
      headStyles: {
        fillColor: [248, 250, 252], // slate-50
        textColor: [71, 85, 105], // slate-600
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: [51, 65, 85], // slate-700
        fontSize: 9,
        cellPadding: 3.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [37, 99, 235] }, // brand-600 for case #
        4: { halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      theme: 'plain',
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.25,
    });

    // ── Total ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || y + 40;

    // Total row background
    doc.setFillColor(248, 250, 252);
    doc.rect(20, finalY + 2, pageWidth - 40, 12, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('TOTAL', 24, finalY + 10);
    doc.setFontSize(12);
    doc.text(formatCurrency(total), pageWidth - 24, finalY + 10, { align: 'right' });

    // ── Footer ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Generated by ${labSettings.lab_name || 'LabFlow'} on ${today}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );
  });

  // Download
  const filename = `invoices-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
