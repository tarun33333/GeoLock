const GeoLink = require('../models/GeoLink');
const geolib = require('geolib');

// Helper to generate random slug
const generateSlug = (length = 6) => {
    return Math.random().toString(36).substring(2, 2 + length);
};

// @desc    Create a new geo-locked link
// @route   POST /api/create
// @access  Public (MVP)
exports.createLink = async (req, res) => {
    try {
        const { destinationUrl, location, radius, createdBy } = req.body;

        // Basic Validation
        if (!destinationUrl || !location || !location.lat || !location.lng || !radius) {
            return res.status(400).json({ error: 'Please provide all fields' });
        }

        if (radius < 50) {
            return res.status(400).json({ error: 'Minimum radius is 50 meters' });
        }

        // Auth Check (Optional override by middleware if we protect route later, 
        // but for now we support both mixed)
        // If req.body.userId is provided (from client context) OR we have req.user from middleware
        // Better: We should use middleware to attach user if token present.

        let limit = 3;
        // Logic: If user is simple anonymous, limit 3. If User is Free, limit 3. If Pro, limit 100.
        // For MVP, we stick to "Free Tier Limit" via createdBy.

        // TODO: Enhance this when we have robust plan check.
        if (createdBy) {
            const count = await GeoLink.countDocuments({ createdBy });
            if (count >= limit) {
                return res.status(403).json({ error: `Free tier limit reached (Max ${limit} links).` });
            }
        }

        let slug = generateSlug();
        let existing = await GeoLink.findOne({ slug });
        while (existing) {
            slug = generateSlug();
            existing = await GeoLink.findOne({ slug });
        }

        const newLink = await GeoLink.create({
            slug,
            destinationUrl,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            },
            radius,
            createdBy: createdBy || 'anonymous',
            user: req.body.user || null // From client if authenticated
        });

        res.status(201).json({
            slug,
            systemUrl: `/l/${slug}`,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`/l/${slug}`)}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get link metadata (for client-side check or initial load)
// @route   GET /api/links/:slug
// @access  Public
exports.getLinkMeta = async (req, res) => {
    try {
        const link = await GeoLink.findOne({ slug: req.params.slug });
        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Return checks required
        res.json({
            location: {
                lat: link.location.coordinates[1],
                lng: link.location.coordinates[0]
            },
            radius: link.radius
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Verify location and get real URL
// @route   POST /api/verify/:slug
// @access  Public
exports.verifyLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const link = await GeoLink.findOne({ slug: req.params.slug });

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        const isInside = geolib.isPointWithinRadius(
            { latitude: lat, longitude: lng },
            { latitude: link.location.coordinates[1], longitude: link.location.coordinates[0] },
            link.radius
        );

        if (isInside) {
            // Increment scan count
            link.scanCount += 1;
            await link.save();

            return res.json({ success: true, destinationUrl: link.destinationUrl });
        } else {
            return res.status(403).json({ success: false, error: 'You are outside the allowed area.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get all links for a user
// @route   GET /api/user-links
// @access  Private
exports.getUserLinks = async (req, res) => {
    try {
        const { userId, createdBy } = req.query;
        let query = {};
        if (userId) { query.user = userId; }
        else if (createdBy) { query.createdBy = createdBy; }
        else { return res.status(400).json({ error: 'User identifier required' }); }

        const links = await GeoLink.find(query).sort({ createdAt: -1 });
        res.json(links);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Delete a link
// @route   DELETE /api/links/:id
// @access  Private
exports.deleteLink = async (req, res) => {
    try {
        const link = await GeoLink.findById(req.params.id);
        if (!link) { return res.status(404).json({ error: 'Link not found' }); }

        await link.deleteOne();
        res.json({ success: true, message: 'Link removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Update a link
// @route   PUT /api/links/:id
// @access  Private
exports.updateLink = async (req, res) => {
    try {
        const { destinationUrl, location, radius } = req.body;

        // Find existing link
        let link = await GeoLink.findById(req.params.id);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Optional: Check ownership if not handled by query scope
        // if (link.user && link.user.toString() !== req.body.user) ... 
        // But for MVP we trust the caller for now or assume getUserLinks protects visibility.
        // Ideally we should use req.user.id from middleware.

        // Update fields
        link.destinationUrl = destinationUrl || link.destinationUrl;
        link.radius = radius || link.radius;
        if (location && location.lat && location.lng) {
            link.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        await link.save();

        res.json({ success: true, data: link });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};
