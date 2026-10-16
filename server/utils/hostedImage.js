export async function ensureHostedImageCloud(img) {
  if (!img || typeof img !== 'string' || !img.startsWith('data:image/')) {
    return img;
  }

  const apiKey = process.env.IMGBB_API_KEY || 'b5f603fbcbfc780cdf47ec7b318b8b38';
  if (!apiKey) return img;

  try {
    const rawBase64 = img.includes('base64,') ? img.split('base64,')[1] : img;
    const form = new URLSearchParams();
    form.append('image', rawBase64);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();
    if (data?.data?.url) {
      return data.data.url;
    }
  } catch (err) {
    console.warn('Hosted image cloud upload failed:', err.message);
  }

  return img;
}
