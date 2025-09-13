
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL parameter is required');
  }

  try {
    const response = await fetch(decodeURIComponent(url));
    
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ message: `Error fetching the URL: ${error.message}` });
  }
}
