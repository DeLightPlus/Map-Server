const express = require('express');

const cors = require('cors')
const app = express();
const port = 3000;

// Serve static files (if any)
app.use(express.static('public'));
app.use(cors())

// Route to serve the map HTML dynamically
app.get('/map', (req, res) => {
  // Extract currentLat and currentLon from query parameters
  const currentLat = req.query.lat || 37.78825; // Default to a location if not provided
  const currentLon = req.query.lon || -122.4324; // Default to a location if not provided

  // HTML content for the map
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenStreetMap</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map with dynamic coordinates from query params
          var map = L.map('map').setView([${currentLat}, ${currentLon}], 13);
          
          // Add OpenStreetMap tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          
          // Add a marker at the current location
          L.marker([${currentLat}, ${currentLon}]).addTo(map)
            .bindPopup('You are here!')
            .openPopup();
        </script>
      </body>
    </html>
  `;
  
  // Send the HTML content as a response
  res.send(htmlContent);
});

// Endpoint to fetch nearby places
app.get('/api/nearbyplaces', async (req, res) => {
  const lat = req.query.lat || 37.78825; // Default to a location if not provided
  const lon = req.query.lon || -122.4324; // Default to a location if not provided
  

  // Check if lat and lon are provided
  if (!lat || !lon) 
  {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try 
  {
    const apiKey = process.env.FSQ_API_KEY; // Get the API Key from environment variables

    // Foursquare API URL to fetch nearby places
    const url = `https://api.foursquare.com/v2/venues/search?ll=${lat},${lon}&radius=1000&client_id=${apiKey}&client_secret=${apiKey}&v=20230101`;

    // Make the request to Foursquare API
    const response = await axios.get(url);

    // Check if response contains venues
    if (response.data.response && response.data.response.venues) {
      const venues = response.data.response.venues;
      return res.json(venues);  // Send the nearby places as response
    } else {
      return res.status(404).json({ error: 'No places found' });
    }
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return res.status(500).json({ error: 'Error fetching nearby places' });
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
