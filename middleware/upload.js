const multer = require('multer');
const path = require('path');
const fs = require('fs');

// इमेजेस के लिए स्टोरेज कॉन्फिगरेशन
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/products/';
    // अगर फोल्डर नहीं है तो बनाएं
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // फाइल नाम: टाइमस्टैम्प-ओरिजिनलनाम
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// सिर्फ इमेज फाइल्स की अनुमति
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;