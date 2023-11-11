"use strict";
const {Storage} = require("@google-cloud/storage");
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

//destination bucket
const bucketName = {
    dst: '<MY BUCKETNAME>'
 };

const storage = new Storage();
exports.processImageSize = async (data, context) => {
const file = data;
// 1. Check for image file
    if (!file.contentType.includes('image')) {
        console.log('exiting function');
        return false;
    }
const scrBucket = storage.bucket(file.bucket);
const dstBucket = storage.bucket(bucketName.dst);
const workingDir = path.join(os.tmpdir(), 'thumbs');
const tmpFilePath = path.join(workingDir, file.name);
// 2. Wait for temp directory to be ready
    await fs.ensureDir(workingDir);
// 3. Download file to temp location
    await scrBucket.file(file.name).download({
        destination: tmpFilePath
      });

const sizes = [500,250,175,125,100];

const uploadPromises = sizes.map(async size => {
        const thumbName = `thumb@${size}_${file.name}`;
        const thumbPath = path.join(workingDir, thumbName);
// 4. Create thumb image
        await sharp(tmpFilePath)
            .resize(size)
            .toFile(thumbPath);
// 5. Upload thumb image
        return dstBucket.upload(thumbPath, {
            metadata: {
                contentType: 'image/png',
                cacheControl : 'public,max-age=3600',                
            }
        });
});
await Promise.all(uploadPromises);
// 6. Remove temp directory
    await fs.remove(workingDir);
return true;
};