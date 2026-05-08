import generateNDA from "./pdf/generateNDA";

const NDA = {
  id: "nda",
  name: "Non-Disclosure Agreement (NDA)",
  category: "Legal Agreements",
  
  description:
    "A Non-Disclosure Agreement (NDA) is a legal contract between parties that outlines confidential information shared between them and restricts its disclosure to others.",
  purpose:
    "To protect confidential information disclosed during discussions, negotiations, or collaborations between parties.",
  jurisdiction: "India", // or configurable

  steps: [
    {
      title: "Parties Involved",
      description: "Basic information about both parties entering into this agreement.",
      fields: [
        {
          id: "disclosingParty",
          label: "Disclosing Party Name",
          type: "text",
          default: "Tech Innovations Inc.",
        },
        {
          id: "disclosingAddress",
          label: "Disclosing Party Address",
          type: "textarea",
          placeholder: "Enter full address of disclosing party",
        },
        {
          id: "receivingParty",
          label: "Receiving Party Name",
          type: "text",
          default: "Creative Solutions LLC",
        },
        {
          id: "receivingAddress",
          label: "Receiving Party Address",
          type: "textarea",
          placeholder: "Enter full address of receiving party",
        },
        {
          id: "effectiveDate",
          label: "Effective Date",
          type: "date",
          default: new Date().toISOString().substring(0, 10),
        },
        {
          id: "terminationDate",
          label: "Termination Date (if applicable)",
          type: "date",
        },
        {
          id: "duration",
          label: "Confidentiality Duration (Years)",
          type: "number",
          default: 5,
          min: 1,
          max: 10,
        },
        {
          id: "purpose",
          label: "Purpose of Disclosure",
          type: "textarea",
          placeholder: "E.g., Evaluation of potential business collaboration",
        },
      ],
    },

    /*{
      title: "Agreement Details",
      description: "Define dates, duration, and scope of confidentiality.",
      fields: [
        
      ],
    },*/

    {
      title: "Confidential Information",
      description: "Describe what constitutes confidential information.",
      fields: [
        {
          id: "confidentialDefinition",
          label: "Definition of Confidential Information",
          type: "textarea",
          placeholder:
            "Include business plans, technical data, financial records, trade secrets, etc.",
        },
        {
          id: "exclusions",
          label: "Exclusions from Confidential Information",
          type: "textarea",
          placeholder:
            "E.g., Information already in public domain, received legally from a third party, or independently developed.",
        },
      ],
    },

    {
      title: "Obligations of Receiving Party",
      description: "Specify what the receiving party must or must not do.",
      fields: [
        {
          id: "obligations",
          label: "Confidentiality Obligations",
          type: "textarea",
          placeholder:
            "Receiving Party agrees not to disclose, reproduce, or use Confidential Information for any purpose other than stated in this Agreement.",
        },
        {
          id: "returnOfInformation",
          label: "Return or Destruction of Information",
          type: "textarea",
          placeholder:
            "Upon termination or request, all Confidential Information must be returned or destroyed.",
        },
      ],
    },

    {
      title: "Legal Clauses",
      description: "Add key clauses and governing law details.",
      fields: [
        {
          id: "governingLaw",
          label: "Governing Law",
          type: "text",
          default: "Laws of India",
        },
        {
          id: "jurisdiction",
          label: "Jurisdiction / Venue",
          type: "text",
          placeholder: "E.g., Courts of Chennai, Tamil Nadu",
        },
        {
          id: "disputeResolution",
          label: "Dispute Resolution Method",
          type: "textarea",
          placeholder: "E.g., Arbitration under the Arbitration and Conciliation Act, 1996",
        },
        {
          id: "severability",
          label: "Severability Clause",
          type: "textarea",
          placeholder:
            "If any provision is found invalid, the remainder of the Agreement shall continue in full force and effect.",
        },
      ],
    },

    {
      title: "Signatures",
      description: "Include authorized signatories from both parties.",
      fields: [
        {
          id: "disclosingSignatory",
          label: "Disclosing Party Representative Name",
          type: "text",
        },
        {
          id: "disclosingTitle",
          label: "Title / Designation (Disclosing Party)",
          type: "text",
        },
        {
          id: "receivingSignatory",
          label: "Receiving Party Representative Name",
          type: "text",
        },
        {
          id: "receivingTitle",
          label: "Title / Designation (Receiving Party)",
          type: "text",
        },
        {
          id: "signDate",
          label: "Date of Signature",
          type: "date",
          default: new Date().toISOString().substring(0, 10),
        },
      ],
    },
  ],

  // PDF generator function imported separately
  generatePDF: generateNDA,

  // Optional metadata
  version: "1.0",
  lastUpdated: "2025-10-19",
  tags: ["NDA", "Legal", "Confidentiality", "Agreement", "Business"],
};

export default NDA;
