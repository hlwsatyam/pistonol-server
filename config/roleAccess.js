const rolePermissions = {
  company: [
    "dashboard",
    "manage-employees",
    "wallet",
    "QRCode",
    "marquee",
    "banner",
    "distributor",
    "product",
    "cus",
    "CompanyOrdersDashboard",
    "leads",
    "employee",
    "reports",
    "settings",
  ],
  "company-employee": ["dashboard", "leads", "reports"],
  distributor: ["dashboard", "DealerOrderForm"],
  dealer: ["dashboard"],
  mechanic: ["dashboard"],
  customer: ["dashboard", "wallet"],
};

module.exports = rolePermissions;
