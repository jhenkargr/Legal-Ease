import generateLease from "./pdf/generateLease";

const Lease = {
  id: 'lease',
  name: 'Residential Lease Agreement',
  category: "Legal Agreements",
  description: 'A Residential Lease Agreement is a legally binding contract between a landlord (property owner) and a tenant (renter). It outlines the terms and conditions under which the tenant may occupy and use the residential proper',
  purpose:"The purpose of this agreement is to protect the rights and responsibilities of both the landlord and the tenant, ensuring a clear understanding of lease terms.",
  steps: [
    // 1️⃣ Landlord Info
    {
      title: "Owner (Landlord) Details",
      fields: [
        { id: 'landlord', label: 'Landlord Full Name', type: 'text', default: 'Jane Doe Properties' },
        { id: 'landlordAddress', label: 'Landlord Address', type: 'text', default: '45 Maple Avenue, Los Angeles, CA' },
        { id: 'landlordPhone', label: 'Landlord Contact Number', type: 'tel', default: '+1 555-123-4567' },
        { id: 'landlordEmail', label: 'Landlord Email', type: 'email', default: 'owner@example.com' }
      ]
    },

    // 2️⃣ Tenant Info
    {
      title: "Tenant Details",
      fields: [
        { id: 'tenant', label: 'Tenant Full Name', type: 'text', default: 'John Smith' },
        { id: 'tenantAddress', label: 'Tenant Current Address', type: 'text', default: '12 Oak Street, San Jose, CA' },
        { id: 'tenantPhone', label: 'Tenant Contact Number', type: 'tel', default: '+1 555-765-4321' },
        { id: 'tenantEmail', label: 'Tenant Email', type: 'email', default: 'john@example.com' },
      ]
    },

    // 3️⃣ Property Details
    {
      title: "Property Information",
      fields: [
        { id: 'propertyAddress', label: 'Rental Property Address', type: 'text', default: '123 Main St, Anytown, CA' },
        { id: 'propertyType', label: 'Property Type', type: 'select', options: ['Apartment', 'House', 'Studio', 'Condo'], default: 'Apartment' },
        { id: 'furnished', label: 'Furnished', type: 'select', options: ['Yes', 'No', 'Partially'], default: 'No' },
        { id: 'parking', label: 'Parking Available', type: 'select', options: ['Yes', 'No'], default: 'Yes' },
      ]
    },

    // 4️⃣ Lease Term & Financials
    {
      title: "Lease Terms & Payment Details",
      fields: [
        { id: 'leaseStart', label: 'Lease Start Date', type: 'date', default: new Date().toISOString().substring(0, 10) },
        { id: 'leaseEnd', label: 'Lease End Date', type: 'date', default: '' },
        { id: 'rentAmount', label: 'Monthly Rent ($)', type: 'number', default: 1500, min: 100 },
        { id: 'securityDeposit', label: 'Security Deposit ($)', type: 'number', default: 1500, min: 0 },
        { id: 'paymentDueDate', label: 'Rent Due Date (Each Month)', type: 'number', default: 1 },
        { id: 'lateFee', label: 'Late Payment Fee ($)', type: 'number', default: 50, min: 0 },
        { id: 'paymentMethod', label: 'Preferred Payment Method', type: 'select', options: ['Bank Transfer', 'Cheque', 'Cash', 'Online Portal'], default: 'Bank Transfer' },
      ]
    },

    // 5️⃣ Occupancy & Restrictions
    {
      title: "Occupancy & Restrictions",
      fields: [
        { id: 'occupants', label: 'Number of Occupants', type: 'number', default: 2, min: 1 },
        { id: 'petsAllowed', label: 'Are Pets Allowed?', type: 'select', options: ['Yes', 'No', 'With Permission'], default: 'With Permission' },
        { id: 'smokingAllowed', label: 'Smoking Allowed?', type: 'select', options: ['Yes', 'No'], default: 'No' },
        { id: 'maintenanceResponsibility', label: 'Maintenance Responsibility', type: 'select', options: ['Tenant', 'Landlord', 'Shared'], default: 'Tenant' },
      ]
    },

    // 6️⃣ Utility & Services
    {
      title: "Utilities & Services",
      fields: [
        { id: 'utilitiesIncluded', label: 'Utilities Included', type: 'checkbox-group', options: ['Water', 'Electricity', 'Internet', 'Gas', 'Trash'], default: ['Water'] },
        { id: 'otherUtilities', label: 'Other Utilities (if any)', type: 'text', default: '' }
      ]
    },

    // 7️⃣ Legal Clauses
    {
      title: "Legal Clauses & Signatures",
      fields: [
        { id: 'terminationNotice', label: 'Termination Notice Period (days)', type: 'number', default: 30, min: 15 },
        { id: 'governingLaw', label: 'Governing State Law', type: 'text', default: 'California' },
        { id: 'landlordSignature', label: 'Landlord Signature (Name)', type: 'text', default: 'Jane Doe' },
        { id: 'tenantSignature', label: 'Tenant Signature (Name)', type: 'text', default: 'John Smith' },
        { id: 'agreementDate', label: 'Date of Agreement', type: 'date', default: new Date().toISOString().substring(0, 10) },
      ]
    }
  ],

  // PDF generator function imported separately
    generatePDF: generateLease,
  
    // Optional metadata
    version: "1.0",
    lastUpdated: "2025-10-19",
    tags: ["Rental", "Legal", "Confidentiality", "Agreement", "Business"],
};

export default Lease;
