// const mongoose = require('mongoose');

// const leadSchema = new mongoose.Schema({
//   garageName: { type: String,  },
//   businessCardNumber: { type: String },
//   contactName: { type: String,  },
//   mobile: { type: String,  },
//   address: { type: String,  },
//   state: { type: String,  },
//   city: { type: String,  },
//   pincode: { type: String },
//   servicesOffered: { type: String },
//   status: { 
//     type: String, 
//     enum: ['New', 'Contacted', 'Qualified', 'Lost'], 
//     default: 'New' 
//   },
//   createdBy: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
     
//   },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Lead', leadSchema);


const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  message: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  garageName: String,
  businessCardNumber: String,
  contactName: String,
  mobile: String,
  address: String,
  state: String,
  city: String,
  pincode: String,
  servicesOffered: String,
  status: { type: String, default: 'New' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  feedbacks: [feedbackSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);