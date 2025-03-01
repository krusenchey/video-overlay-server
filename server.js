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
    return res.status(400).json({ error: 'Invalid input: videoUrl and overlays (array) are required' });
  }

  // ตรวจสอบว่า overlay ทุกตัวมี properties ครบ
  for (const overlay of overlays) {
    const { text, fontSize, color, position } = overlay;
    if (!text || !fontSize || !color || !position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return res.status(400).json({ error: 'Invalid overlay: text, fontSize, color, and position (x, y) are required' });
    }
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
      writer.on('error', (err) => reject(new Error(`Failed to download video: ${err.message}`)));
    });

    let command = ffmpeg(videoPath);

    // ใช้ฟอนต์จาก environment variable หรือ default สำหรับ Render
    const fontPath = process.env.FONT_PATH || '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

    // เพิ่มตัวอักษรจาก overlays
    overlays.forEach((overlay) => {
      const { text, fontSize, color, position } = overlay;
      let adjustedColor = color.toLowerCase();
      // ปรับสีให้เข้ากันได้กับ FFmpeg
      if (adjustedColor === 'white') adjustedColor = '#FFFFFF';
      else if (adjustedColor === 'black') adjustedColor = '#000000';
      else adjustedColor = adjustedColor.startsWith('#') ? color : `#${color}`;
      command = command.videoFilter(
        `drawtext=fontfile='${fontPath}':text='${text}':fontcolor=${adjustedColor}:fontsize=${fontSize}:x=${position.x}:y=${position.y}`
      );
    });

    // บันทึกวิดีโอที่รวมตัวอักษรแล้ว
    await new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('end', resolve)
        .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .run();
    });

    // อัปโหลดวิดีโอใหม่กลับไปยัง Cloudinary
    const formData = new FormData();
    formData.append('file', fs.createReadStream(outputPath));
    formData.append('upload_preset', 'streaming_profile');

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/video/upload`,
      formData,
      { headers: formData.getHeaders() } // ใช้ headers จาก FormData
    );

    // ลบไฟล์ชั่วคราว
    fs.unlinkSync(videoPath);
    fs.unlinkSync(outputPath);

    res.json({ newVideoUrl: uploadResponse.data.secure_url });
  } catch (err) {
    console.error('(NOBRIDGE) ERROR Error merging text with video:', err.message);
    res.status(500).json({ error: `Failed to merge text with video: ${err.message}` });
  }
});

// API สำหรับรวมตัวอักษรกับ Thumbnail
app.post('/merge-text-image', async (req, res) => {
  const { imageUrl, overlays } = req.body;

  if (!imageUrl || !overlays || !Array.isArray(overlays)) {
    return res.status(400).json({ error: 'Invalid input: imageUrl and overlays (array) are required' });
  }

  for (const overlay of overlays) {
    const { text, fontSize, color, position } = overlay;
    if (!text || !fontSize || !color || !position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return res.status(400).json({ error: 'Invalid overlay: text, fontSize, color, and position (x, y) are required' });
    }
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
      writer.on('error', (err) => reject(new Error(`Failed to download image: ${err.message}`)));
    });

    let command = ffmpeg(imagePath);

    const fontPath = process.env.FONT_PATH || '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

    overlays.forEach((overlay) => {
      const { text, fontSize, color, position } = overlay;
      let adjustedColor = color.toLowerCase();
      if (adjustedColor === 'white') adjustedColor = '#FFFFFF';
      else if (adjustedColor === 'black') adjustedColor = '#000000';
      else adjustedColor = adjustedColor.startsWith('#') ? color : `#${color}`;
      command = command.videoFilter(
        `drawtext=fontfile='${fontPath}':text='${text}':fontcolor=${adjustedColor}:fontsize=${fontSize}:x=${position.x}:y=${position.y}`
      );
    });

    await new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('end', resolve)
        .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .run();
    });

    const formData = new FormData();
    formData.append('file', fs.createReadStream(outputPath));
    formData.append('upload_preset', 'streaming_profile');

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    fs.unlinkSync(imagePath);
    fs.unlinkSync(outputPath);

    res.json({ newImageUrl: uploadResponse.data.secure_url });
  } catch (err) {
    console.error('(NOBRIDGE) ERROR Error merging text with image:', err.message);
    res.status(500).json({ error: `Failed to merge text with image: ${err.message}` });
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