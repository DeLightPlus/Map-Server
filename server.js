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

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
