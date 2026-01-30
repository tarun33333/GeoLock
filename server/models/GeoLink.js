const mongoose = require('mongoose');

const GeoLinkSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    destinationUrl: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    radius: {
        type: Number, // in meters
        required: true,
        min: 50
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    createdBy: {
        type: String, // Anonymous ID or User ID (fallback)
        required: true
    },
    scanCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '365d' // Default expiry for cleanup, though logic might differ
    }
});

// Create 2dsphere index for geospatial queries (if needed later)
GeoLinkSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('GeoLink', GeoLinkSchema);
