import jsPDF from "jspdf";

export default function generateNDA(formData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("Times", "normal");
  doc.setFontSize(12);

  doc.text("NON-DISCLOSURE AGREEMENT (NDA)", 60, 20);

  const text = `
  NON-DISCLOSURE AGREEMENT (NDA)

  This Nondisclosure Agreement ("Agreement") is entered into by and between:

  Disclosing Party: ${formData.disclosingParty || "________"}
  Address: ${formData.disclosingAddress || "________"}

  Receiving Party: ${formData.receivingParty || "________"}
  Address: ${formData.receivingAddress || "________"}

  Effective Date: ${formData.effectiveDate || "________"}

  For the purpose of preventing the unauthorized disclosure of confidential information described as:
  "${formData.purpose || "________"}"

  1. The Receiving Party agrees to hold all such information in confidence and not to disclose or use it for any purpose other than the project described above.

  2. This confidentiality obligation shall remain in effect for a period of ${formData.duration || "___"} years from the date of execution.

  3. Both parties acknowledge that this Agreement constitutes the entire understanding between them and supersedes prior communications.

  GOVERNING LAW: ${formData.governingLaw || "________"}
  JURISDICTION: ${formData.jurisdiction || "________"}

  IN WITNESS WHEREOF, the parties have executed this Agreement.

  Disclosing Party Signature: ___________________________
  Name: ${formData.disclosingSignatory || "________"}
  Title: ${formData.disclosingTitle || "________"}

  Receiving Party Signature: ___________________________
  Name: ${formData.receivingSignatory || "________"}
  Title: ${formData.receivingTitle || "________"}

  Date: ${formData.signDate || "________"}
  `;

  const split = doc.splitTextToSize(text, 180);
  doc.text(split, 15, 30);

  return doc; // no save() here
}
