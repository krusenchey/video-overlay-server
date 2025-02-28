โปรเจคนี้อยู่ภายใต้ [MIT License](LICENSE) # Video Overlay Server

เซิร์ฟเวอร์นี้เป็นส่วนหนึ่งของโปรเจค **Stream Video Sharing App** ซึ่งเป็นแอปพลิเคชันที่พัฒนาด้วย React Native และ Expo เพื่อให้ผู้คนทั่วไปสามารถแชร์วิดีโอประสบการณ์ของตัวเอง และให้ผู้ชมทั่วโลกสามารถรับชมได้

เซิร์ฟเวอร์นี้พัฒนาด้วย Node.js และใช้ FFmpeg เพื่อรวมตัวอักษรลงในวิดีโอและ thumbnail ก่อนอัปโหลดไปยัง Cloudinary เพื่อให้วิดีโอและ thumbnail ที่ผู้ใช้สร้างมีตัวอักษรตามที่กำหนด

## ภาพรวมโปรเจค
Stream Video Sharing App เป็นแอปพลิเคชันที่มุ่งหวังให้ผู้คนทั่วไปสามารถ:
- ถ่ายวิดีโอและเพิ่มตัวอักษร (เช่น ข้อความต้อนรับ, คำอธิบาย) เพื่อแชร์ประสบการณ์ของตัวเอง
- อัปโหลดวิดีโอและ thumbnail ไปยัง Cloudinary
- เก็บข้อมูลใน Supabase เพื่อจัดการวิดีโอและข้อมูลผู้ใช้
- ให้ผู้ชมทั่วโลกสามารถรับชมวิดีโอที่แชร์ผ่านแอป

## คุณสมบัติหลักของเซิร์ฟเวอร์
- **รวมตัวอักษรบนวิดีโอ**: ใช้ FFmpeg เพื่อเพิ่มตัวอักษรลงในวิดีโอตามตำแหน่ง, ขนาด, และสีที่ผู้ใช้กำหนด
- **รวมตัวอักษรบน Thumbnail**: เพิ่มตัวอักษรลงในภาพ thumbnail เพื่อให้สอดคล้องกับวิดีโอ
- **อัปโหลดไป Cloudinary**: อัปโหลดวิดีโอและ thumbnail ที่รวมตัวอักษรแล้วไปยัง Cloudinary

## เทคโนโลยีที่ใช้
- **Node.js**: สำหรับพัฒนาเซิร์ฟเวอร์
- **FFmpeg**: สำหรับการประมวลผลวิดีโอ รวมถึงการเพิ่มตัวอักษร
- **Cloudinary**: สำหรับเก็บวิดีโอและ thumbnail
- **Axios**: สำหรับดาวน์โหลดและอัปโหลดไฟล์ไปยัง Cloudinary

## การติดตั้ง
1. Clone repository นี้:
   ```
   git clone https://github.com/krusenchey/video-overlay-server.git
   ```
2. ติดตั้ง dependencies:
   ```
   npm install
   ```
3. สร้างไฟล์ `.env` และเพิ่มตัวแปร `CLOUD_NAME`:
   ```
   CLOUD_NAME=your-cloud-name
   ```
   - แทน `your-cloud-name` ด้วย Cloud Name จาก Cloudinary Dashboard
4. รันเซิร์ฟเวอร์:
   ```
   npm start
   ```

## การใช้งาน
เซิร์ฟเวอร์นี้มี API สองตัวสำหรับรวมตัวอักษร:

1. **รวมตัวอักษรบนวิดีโอ**:
   - Endpoint: `POST /merge-text-video`
   - ตัวอย่างการเรียก:
     ```
     curl -X POST https://your-server-url/merge-text-video \
     -H "Content-Type: application/json" \
     -d '{"videoUrl": "https://res.cloudinary.com/your-cloud-name/video/upload/...", "overlays": [{"text": "Hello", "fontSize": 24, "color": "white", "position": {"x": 320, "y": 387}}]}'
     ```
   - Response:
     ```
     { "newVideoUrl": "https://res.cloudinary.com/your-cloud-name/video/upload/..." }
     ```

2. **รวมตัวอักษรบน Thumbnail**:
   - Endpoint: `POST /merge-text-image`
   - ตัวอย่างการเรียก:
     ```
     curl -X POST https://your-server-url/merge-text-image \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/...", "overlays": [{"text": "Hello", "fontSize": 24, "color": "white", "position": {"x": 320, "y": 387}}]}'
     ```
   - Response:
     ```
     { "newImageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/..." }
     ```

## การมีส่วนร่วม
หากคุณสนใจร่วมพัฒนาโปรเจคนี้:
1. Fork repository นี้
2. สร้าง branch ใหม่: `git checkout -b feature/your-feature`
3. Commit การเปลี่ยนแปลง: `git commit -m "Add your feature"`
4. Push ไปยัง branch: `git push origin feature/your-feature`
5. สร้าง Pull Request

## License
โปรเจคนี้อยู่ภายใต้ [MIT License](LICENSE)
