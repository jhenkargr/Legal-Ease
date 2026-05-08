import jsPDF from "jspdf";

export default function generateLease(formData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("Times", "normal");
  doc.setFontSize(12);

  doc.text("RENTAL AGREEMENT", 60, 20);

  const text = `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into by and between:

Landlord: ${formData.landlord || "________"}
Address: ${formData.landlordAddress || "________"}

Tenant: ${formData.tenant || "________"}
Address: ${formData.tenantAddress || "________"}

Effective Date: ${formData.agreementDate || "________"}

For the purpose of leasing the property described as:
"${formData.propertyAddress || "________"}" - a ${formData.propertyType || "________"}, ${formData.furnished === 'Yes' ? 'fully furnished' : formData.furnished === 'Partially' ? 'partially furnished' : 'unfurnished'}

Lease Term:
Lease begins on ${formData.leaseStart || "________"} and ends on ${formData.leaseEnd || ""}.

Rent & Payments:

Monthly Rent: $${formData.rentAmount || "________"}

Payment Due Date: ${formData.paymentDueDate || "________"}

Payment Method: ${formData.paymentMethod || "________"}

Security Deposit: $${formData.securityDeposit || "________"}

Late Payment Fee: $${formData.lateFee || "________"}

Property Usage:

Maximum Occupants: ${formData.occupants || "________"}

Pets Allowed: ${formData.petsAllowed || "________"}

Smoking Allowed: ${formData.smokingAllowed || "________"}

Utilities:

Included Utilities: ${(formData.utilitiesIncluded || []).join(', ') || "________"}

Termination & Legal:

Termination Notice Period: ${formData.terminationNotice || "________"} days

Governing Law: ${formData.governingLaw || "________"}

IN WITNESS WHEREOF, the parties have executed this Agreement.

Landlord Signature: ___________________________
Name: ${formData.landlordSignature || "________"}

Tenant Signature: ___________________________
Name: ${formData.tenantSignature || "________"}

Date: ${formData.signDate || "________"}`

  const split = doc.splitTextToSize(text, 180);
  doc.text(split, 15, 30);

  return doc; // no save() here
}
