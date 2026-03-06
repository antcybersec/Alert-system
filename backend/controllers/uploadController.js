const { admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const path = require('path');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const bucket = admin.storage().bucket();
        const mimeType = req.file.mimetype;
        const buffer = req.file.buffer;

        // Determine extension
        let ext = '.bin';
        if (mimeType === 'image/jpeg') ext = '.jpg';
        else if (mimeType === 'image/png') ext = '.png';
        else if (mimeType === 'video/mp4') ext = '.mp4';
        else if (mimeType === 'video/webm') ext = '.webm';
        else if (mimeType === 'audio/mpeg') ext = '.mp3';
        else if (mimeType === 'audio/wav') ext = '.wav';
        else {
            // Fallback to original extension if available
            ext = path.extname(req.file.originalname) || '.bin';
        }

        // "path" comes from req.body when using FormData
        const folderPath = req.body.path || 'general';
        const filename = `${folderPath}/${uuidv4()}${ext}`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
            },
            public: true
        });

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Far future
        });

        res.status(200).json({ url, filename, contentType: mimeType });

    } catch (error) {
        console.error("Server Upload Error:", error);
        res.status(500).json({ error: "Failed to upload file", details: error.message });
    }
};

// Keep alias for backward compatibility if needed, or just export uploadFile
exports.uploadImage = exports.uploadFile;
