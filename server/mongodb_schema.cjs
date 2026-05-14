const mongoose = require('mongoose');

// --- Business Schema (Registry Node) ---
const businessSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    tenant_id: { type: String, required: true, default: 'tn-chennai', index: true },
    legalName: String,
    tradeName: { type: String, index: true },
    type: String,
    category: String,
    address: String,
    proofOfAddress: String,
    branchName: String,
    contactNumber: String,
    email: String,
    gstNumber: { type: String, index: true },
    status: { type: String, index: true },
    registrationDate: { type: Date, default: Date.now },
    riskScore: { type: Number, default: 0 },
    latitude: Number,
    longitude: Number,
    license_valid_till: Date,
    grace_ends_at: Date,
    pay_by_date: Date,
    payment_done: { type: Boolean, default: false },
    license_status: { type: String, default: 'ACTIVE' },
    property_tax_status: { type: String, default: 'Pending' },
    water_tax_status: { type: String, default: 'Pending' },
    professional_tax_status: { type: String, default: 'Pending' },
    assessment_number: String,
    water_connection_no: String,
    municipal_ward: String,
    nic_category: String,
    employee_count: { type: Number, default: 0 },
    application_type: { type: String, default: 'NEW' },
    current_stage: String,
    sla_deadline_at: Date,
    aadhaar_no: String,
    documents_metadata: mongoose.Schema.Types.Mixed,
    website: String,
    blockchain_hash: String
}, { timestamps: true });

// --- Ledger Schema (Blockchain persistence) ---
const ledgerSchema = new mongoose.Schema({
    index: { type: Number, required: true, unique: true },
    tenant_id: { type: String, required: true, default: 'tn-chennai', index: true },
    timestamp: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    previousHash: { type: String, required: true },
    hash: { type: String, required: true },
    nonce: { type: Number, required: true }
});

// --- Scan Schema (Verification Intel) ---
const scanSchema = new mongoose.Schema({
    business_id: { type: String, index: true },
    tenant_id: { type: String, required: true, default: 'tn-chennai', index: true },
    token: String,
    scan_lat: Number,
    scan_lng: Number,
    result: { type: String, index: true },
    distance: Number,
    scanned_at: { type: Date, default: Date.now },
    device_id: String
}, { timestamps: true });

// --- Report Schema (Citizen Intel) ---
const reportSchema = new mongoose.Schema({
    business_name: String,
    tenant_id: { type: String, required: true, default: 'tn-chennai', index: true },
    location: String,
    description: String,
    category: String,
    severity: String,
    status: { type: String, default: 'Submitted' },
    image_path: String,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// --- Registry Approval Schema (Workflow) ---
const approvalSchema = new mongoose.Schema({
    registry_id: { type: String, index: true },
    tenant_id: { type: String, required: true, default: 'tn-chennai', index: true },
    stage: String,
    status: String,
    acted_by_user_id: String,
    acted_by_role: String,
    acted_at: { type: Date, default: Date.now },
    comments: String,
    order_ref_no: String,
    valid_from: Date,
    valid_to: Date,
    attachment_url: String
}, { timestamps: true });

const Business = mongoose.models.Business || mongoose.model('Business', businessSchema);
const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', ledgerSchema);
const Scan = mongoose.models.Scan || mongoose.model('Scan', scanSchema);
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
const Approval = mongoose.models.Approval || mongoose.model('Approval', approvalSchema);

module.exports = {
    Business,
    Ledger,
    Scan,
    Report,
    Approval
};
