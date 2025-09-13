export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL parameter is required');
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText} for URL: ${decodedUrl}`);
    }

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    res.status(500).json({ message: `Error fetching the URL: ${error.message}` });
  }
}