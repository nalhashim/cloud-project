require('dotenv').config({ path: './cloud.env' });
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const FILES_KEY = 'files.json';

const classifier = require('./classifier.json');

function classifyText(text) {
  text = text.toLowerCase();
  let scores = {};

  for (const [category, keywords] of Object.entries(classifier)) {
    scores[category] = 0;
    keywords.forEach(keyword => {
      const word = keyword.toLowerCase();
      if (text.includes(word)) {
        scores[category]++;
        if (word.length > 5) scores[category] += 0.5;
      }
    });
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'عام';
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

function extractTitle(text) {
  const words = text.trim().split(/\s+/);
  return words.slice(0, 6).join(' ');
}

async function downloadFilesJson() {
  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: FILES_KEY }).promise();
    console.log("<i class='bi bi-folder2-open'></i> تم تحميل files.json من S3");
    return JSON.parse(data.Body.toString());
  } catch (err) {
    if (err.code === 'NoSuchKey') {
      console.warn("<i class='bi bi-exclamation-triangle'></i> files.json غير موجود، سيتم إنشاؤه.");
      return [];
    } else {
      console.error("<i class='bi bi-x-circle-fill'></i> خطأ في تحميل files.json:", err);
      throw err;
    }
  }
}

async function uploadFilesJson(files) {
  console.log("<i class='bi bi-upload'></i> رفع الملفات إلى S3: files.json");
  await s3.putObject({
    Bucket: BUCKET_NAME,
    Key: FILES_KEY,
    Body: JSON.stringify(files, null, 2),
    ContentType: 'application/json'
  }).promise();
  console.log("<i class='bi bi-check-circle-fill'></i> تم رفع files.json بنجاح!");
}

app.post('/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '<i class="bi bi-x-circle-fill text-danger"></i> لم يتم إرسال ملفات.' });
  }

  const existing = await downloadFilesJson();
  const existingTitles = new Set(existing.map(f => f.title));

  const fileInfos = [];
  const skippedFiles = [];

  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';

    try {
      if (ext === '.pdf') {
        const data = await pdfParse(file.buffer);
        text = data.text;
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else {
        continue;
      }

      const title = extractTitle(text);
      if (existingTitles.has(title)) {
        skippedFiles.push(file.originalname);
        continue;
      }

      const classification = classifyText(text);
      const size = file.size;
      const filename = Date.now() + '_' + file.originalname;
      const key = 'documents/' + filename;

      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }).promise();

      fileInfos.push({
        title,
        classification,
        filename,
        ext: ext.replace('.', ''),
        size,
        text
      });
    } catch (err) {
      console.error("<i class='bi bi-x-circle-fill text-danger'></i> خطأ في معالجة الملف " + file.originalname + ":", err);
    }
  }

  const allFiles = [...existing, ...fileInfos];
  console.log("<i class='bi bi-folder2-open'></i> الملفات النهائية التي سترفع:", allFiles.map(f => f.title));
  await uploadFilesJson(allFiles);

  res.json({ success: true, uploaded: fileInfos.length, skipped: skippedFiles });
});

app.get('/files.json', async (req, res) => {
  try {
    const data = await downloadFilesJson();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '<i class="bi bi-x-circle-fill text-danger"></i> فشل في تحميل بيانات الملفات.' });
  }
});

app.get('/search', async (req, res) => {
  const keyword = req.query.keyword?.trim()?.toLowerCase();
  if (!keyword) return res.status(400).json({ error: '<i class="bi bi-x-circle-fill text-danger"></i> يرجى إدخال كلمة للبحث.' });

  const files = await downloadFilesJson();
  const results = [];

  for (const file of files) {
    const text = file.text?.toLowerCase() || '';
    const lines = text.split(/\n|[.?!]/);
    const matchedLines = lines.filter(line => line.includes(keyword));
    if (matchedLines.length) {
      results.push({
        title: file.title,
        filename: file.filename,
        count: matchedLines.length,
        snippets: matchedLines
      });
    }
  }

  res.json(results);
});

// ميدلوير لمعالجة أخطاء multer (مثل تجاوز حجم الملف)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '<i class="bi bi-exclamation-triangle"></i> حجم الملف أكبر من الحد المسموح (10MB).' });
    }
  }
  next(err);
});

app.listen(port, () => {
  console.log("<i class='bi bi-check-circle-fill'></i> Server running on http://localhost:" + port);
});
