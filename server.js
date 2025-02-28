const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
app.use(express.json());

// API สำหรับรวมตัวอักษรกับวิดีโอ
app.post('/merge-text-video', async (req, res) => {
  const { videoUrl, overlays } = req.body;

  // ตรวจสอบ input
  if (!videoUrl || !overlays || !Array.isArray(overlays)) {
    return res.status(400).json({ error: "Invalid input: videoUrl and overlays are required" });
  }

  const videoPath = path.join(__dirname, 'temp_video.mp4');
  const outputPath = path.join(__dirname, 'output_video.mp4');

  try {
    // ดาวน์โหลดวิดีโอจาก Cloudinary
    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream',
    });
    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    let command = ffmpeg(videoPath);

    // เพิ่มตัวอักษรจาก overlays
    overlays.forEach((overlay) => {
      const { text, fontSize, color, position } = overlay;
      if (!text || !fontSize || !color || !position || !position.x || !position.y) return;
      let adjustedColor = color.toLowerCase();
      if (adjustedColor === 'white') adjustedColor = 'rgb:ffffff';
      else if (adjustedColor === 'black') adjustedColor = 'rgb:000000';
      else adjustedColor = adjustedColor.replace('#', '');
      // ใช้ฟอนต์ที่มีในระบบ (Render ใช้ Ubuntu, ใช้ฟอนต์ DejaVuSans)
      const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
      command = command.videoFilter(
        `drawtext=fontfile='${fontPath}':text='${text}':fontcolor=${adjustedColor}:fontsize=${fontSize}:x=${position.x}:y=${position.y}`
      );
    });

    // บันทึกวิดีโอที่รวมตัวอักษรแล้ว
    await new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // อัปโหลดวิดีโอใหม่กลับไปยัง Cloudinary
    const formData = new FormData();
    formData.append('file', fs.createReadStream(outputPath));
    formData.append('upload_preset', 'streaming_profile');

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/video/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // ลบไฟล์ชั่วคราว
    fs.unlinkSync(videoPath);
    fs.unlinkSync(outputPath);

    res.json({ newVideoUrl: uploadResponse.data.secure_url });
  } catch (err) {
    console.error("(NOBRIDGE) ERROR  Error merging text with video:", err.message);
    res.status(500).json({ error: "Failed to merge text with video" });
  }
});

// API สำหรับรวมตัวอักษรกับ Thumbnail
app.post('/merge-text-image', async (req, res) => {
  const { imageUrl, overlays } = req.body;

  if (!imageUrl || !overlays || !Array.isArray(overlays)) {
    return res.status(400).json({ error: "Invalid input: imageUrl and overlays are required" });
  }

  const imagePath = path.join(__dirname, 'temp_image.jpg');
  const outputPath = path.join(__dirname, 'output_image.jpg');

  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
    });
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    let command = ffmpeg(imagePath);

    overlays.forEach((overlay) => {
      const { text, fontSize, color, position } = overlay;
      if (!text || !fontSize || !color || !position || !position.x || !position.y) return;
      let adjustedColor = color.toLowerCase();
      if (adjustedColor === 'white') adjustedColor = 'rgb:ffffff';
      else if (adjustedColor === 'black') adjustedColor = 'rgb:000000';
      else adjustedColor = adjustedColor.replace('#', '');
      const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
      command = command.videoFilter(
        `drawtext=fontfile='${fontPath}':text='${text}':fontcolor=${adjustedColor}:fontsize=${fontSize}:x=${position.x}:y=${position.y}`
      );
    });

    await new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const formData = new FormData();
    formData.append('file', fs.createReadStream(outputPath));
    formData.append('upload_preset', 'streaming_profile');

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    fs.unlinkSync(imagePath);
    fs.unlinkSync(outputPath);

    res.json({ newImageUrl: uploadResponse.data.secure_url });
  } catch (err) {
    console.error("(NOBRIDGE) ERROR  Error merging text with image:", err.message);
    res.status(500).json({ error: "Failed to merge text with image" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});