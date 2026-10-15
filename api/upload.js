export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const apiKey = process.env.IMGBB_API_KEY || 'b5f603fbcbfc780cdf47ec7b318b8b38';
    if (apiKey) {
      try {
        const rawBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
        const form = new URLSearchParams();
        form.append('image', rawBase64);
        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(8000)
        });
        const imgbbData = await imgbbRes.json();
        if (imgbbData?.data?.url) {
          return res.status(200).json({ success: true, url: imgbbData.data.url, provider: 'imgbb' });
        }
      } catch (err) {
        console.warn('ImgBB cloud upload error:', err.message);
      }
    }

    // Fallback: return dataURL
    return res.status(200).json({ success: true, url: image, provider: 'base64' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
