import jsPDF from "jspdf";
import type { Certificate } from "./store";
import { getSettings } from "./store";

export function generateCertificatePDF(cert: Certificate) {
  const settings = getSettings();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(20, 50, 90);
  doc.setLineWidth(3);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(20, 50, 90);
  doc.text(settings.instituteName, w / 2, 40, { align: "center" });

  // Subtitle
  doc.setFontSize(18);
  doc.setTextColor(40, 140, 120);
  doc.text("Certificate of Achievement", w / 2, 55, { align: "center" });

  // Decorative line
  doc.setDrawColor(40, 140, 120);
  doc.setLineWidth(1);
  doc.line(w / 2 - 60, 60, w / 2 + 60, 60);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("This is to certify that", w / 2, 78, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(20, 50, 90);
  doc.text(cert.studentName, w / 2, 92, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("has successfully completed the examination", w / 2, 106, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(40, 140, 120);
  doc.text(`"${cert.testName}"`, w / 2, 118, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(`with a score of ${cert.percentage}%`, w / 2, 130, { align: "center" });

  // Footer
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(`Certificate ID: ${cert.id}`, 30, h - 30);
  doc.text(`Date: ${new Date(cert.issuedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, w - 30, h - 30, { align: "right" });

  // Signature lines
  doc.setDrawColor(160, 160, 160);
  doc.line(40, h - 45, 100, h - 45);
  doc.line(w - 100, h - 45, w - 40, h - 45);
  doc.setFontSize(10);
  doc.text("Examiner", 70, h - 40, { align: "center" });
  doc.text("Director", w - 70, h - 40, { align: "center" });

  doc.save(`Certificate-${cert.id}.pdf`);
}
