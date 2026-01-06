const mongoose = require('mongoose');


const leadSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true, 
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, 
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },

    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    current_score: {
      type: Number,
      default: 0, 
      min: [0, 'Score cannot be negative'],
      max: [Number(process.env.MAX_SCORE) || 1000, 'Score cannot exceed maximum'],
      index: true,
    },

    status: {
      type: String,
      enum: ['cold', 'warm', 'hot'],
      default: 'cold',
      index: true, 
    },


    metadata: {
      type: mongoose.Schema.Types.Mixed, 
      default: {},
    },

    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
      index: true, 
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    
    timestamps: false, 
    collection: 'leads',
  }
);

leadSchema.index({ is_deleted: 1, current_score: -1 });
leadSchema.index({ status: 1, current_score: -1 });
leadSchema.index({ created_at: -1 });

leadSchema.methods.updateScore = async function (newScore, session = null) {
  const maxScore = Number(process.env.MAX_SCORE) || 1000;
  this.current_score = Math.min(newScore, maxScore);
  
  if (this.current_score >= 151) {
    this.status = 'hot';
  } else if (this.current_score >= 51) {
    this.status = 'warm';
  } else {
    this.status = 'cold';
  }
  
  this.updated_at = new Date();
  return session ? this.save({ session }) : this.save();
};

leadSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.updated_at = new Date();
  return await this.save();
};


leadSchema.statics.getLeaderboard = async function (limit = 10) {
  return await this.find({ is_deleted: false })
    .sort({ current_score: -1 }) 
    .limit(limit)
    .select('name email company current_score status'); 
};


leadSchema.statics.search = async function (searchTerm) {
  const regex = new RegExp(searchTerm, 'i'); 

  return await this.find({
    is_deleted: false,
    $or: [
      { name: regex },
      { email: regex },
      { company: regex },
    ],
  }).limit(50); 
};


leadSchema.statics.getByStatus = async function (status) {
  return await this.find({
    is_deleted: false,
    status: status,
  }).sort({ current_score: -1 });
};

leadSchema.pre('save', function () {
  this.updated_at = new Date();
});




leadSchema.virtual('fullInfo').get(function () {
  return `${this.name} (${this.email}) - Score: ${this.current_score} [${this.status.toUpperCase()}]`;
});


leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });


const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;