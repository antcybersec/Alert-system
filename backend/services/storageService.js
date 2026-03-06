const { getStorage } = require('firebase-admin/storage');
const admin = require('firebase-admin');

const bucket = admin.storage().bucket();

exports.uploadBase64Media = async (base64, mimeType, reportId) => {
    const buffer = Buffer.from(base64, 'base64');
    const extension = mimeType.split('/')[1] || 'jpg';

    const fileName = `reports/${reportId}.${extension}`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
        metadata: { contentType: mimeType },
        public: true
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};