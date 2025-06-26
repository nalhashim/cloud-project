require('dotenv').config({ path: './cloud.env' });  // تأكدي من اسم الملف ومساره
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const params = {
  Bucket: process.env.S3_BUCKET_NAME,
};

s3.headBucket(params, function (err, data) {
  if (err) {
    console.error("❌ الخطأ في الاتصال بالسحابة:", err.message);
  } else {
    console.log("✅ تم الاتصال بسحابة AWS S3 بنجاح!");
  }
});
