const express = require('express');
const axios = require('axios');  // Ensure axios is imported
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Serve static files (if any)
app.use(express.static('public'));
app.use(cors());

// Route to serve the map HTML dynamically
app.get('/map', (req, res) => {
  const currentLat = parseFloat(req.query.lat) || 37.78825; // Default to a location if not provided
  const currentLon = parseFloat(req.query.lon) || -122.4324; // Default to a location if not provided

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
          var map = L.map('map').setView([${currentLat}, ${currentLon}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.marker([${currentLat}, ${currentLon}]).addTo(map)
            .bindPopup('You are here!')
            .openPopup();
        </script>
      </body>
    </html>
  `;

  res.send(htmlContent);
});

// Endpoint to fetch nearby places
app.get('/api/nearbyplaces', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  console.log('Latitude:', lat, '| Longitude:', lon);

  // Validate lat and lon
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude' });
  }

  // API call to Foursquare to fetch nearby places
  const options = {
    method: 'GET',
    url: 'https://api.foursquare.com/v3/places/search',
    headers: {
      accept: 'application/json',
      Authorization: 'fsq3vzHTwmKG4Lkfvxbt2x+dzzgrgjuFxKDINtaqFuYzawM='  // Your API key with Bearer prefix
    },
    params: {
      ll: `${lat},${lon}`,  // Coordinates of the location
      radius: 1000  // Radius in meters (1 km radius)
    }
  };

  try {
    const response = await axios.request(options);
    
    // If the API responds successfully
    if (response.data) 
    {
      return res.json(response.data);  // Send the places data to the client
    } 
    else 
    {
      return res.status(404).json({ error: 'No places found' });
    }
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return res.status(500).json({ error: 'Error fetching nearby places' });
  }
});

// Endpoint to fetch nearby restaurants only
app.get('/api/restaurants', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  console.log('Latitude:', lat, '| Longitude:', lon);

  // Validate lat and lon
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude' });
  }

  // API call to Foursquare to fetch nearby places, filtered for restaurants
  const options = {
    method: 'GET',
    url: 'https://api.foursquare.com/v3/places/search',
    headers: {
      accept: 'application/json',
      Authorization: 'fsq3vzHTwmKG4Lkfvxbt2x+dzzgrgjuFxKDINtaqFuYzawM='  // Your API key without "Bearer"
    },
    params: {
      ll: `${lat},${lon}`,  // Coordinates of the location
      radius: 1000,  // Radius in meters (1 km radius)
      categories: '13065'  // Foursquare category for restaurants
    }
  };

  try {
    const response = await axios.request(options);
    
    // If the API responds successfully
    if (response.data) {
      return res.json(response.data);  // Send the restaurant data to the client
    } else {
      return res.status(404).json({ error: 'No restaurants found' });
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({ error: 'Error fetching restaurants' });
  }
});

// Endpoint to fetch details of a specific place
app.get('/api/placedetails', async (req, res) => {
  const fsqId = req.query.fsq_id;  // Foursquare ID of the place

  if (!fsqId) {
    return res.status(400).json({ error: 'Foursquare place ID (fsq_id) is required' });
  }

  // API call to Foursquare to fetch place details
  const options = {
    method: 'GET',
    url: `https://api.foursquare.com/v3/places/${fsqId}`,
    headers: {
      accept: 'application/json',
      Authorization: 'fsq3vzHTwmKG4Lkfvxbt2x+dzzgrgjuFxKDINtaqFuYzawM=' 
    }
  };

  try {
    const response = await axios.request(options);

    // If the API responds successfully
    if (response.data) {
      return res.json(response.data);  // Send the place details data to the client
    } else {
      return res.status(404).json({ error: 'Place details not found' });
    }
  } catch (error) {
    console.error('Error fetching place details:', error);
    return res.status(500).json({ error: 'Error fetching place details' });
  }
});

// Endpoint to fetch restaurant photos
app.get('/api/restaurant-photos', async (req, res) => {
  const fsq_id = req.query.fsq_id; // Get fsq_id from query parameters

  // Check if fsq_id is provided
  if (!fsq_id) {
    return res.status(400).json({ error: 'fsq_id is required' });
  }

  // Foursquare API endpoint to fetch place details (with photos)
  const options = {
    method: 'GET',
    url: `https://api.foursquare.com/v3/places/${fsq_id}/photos`,
    headers: {
      accept: 'application/json',
      "Content-Type": "application/json",
      Authorization: 'fsq3vzHTwmKG4Lkfvxbt2x+dzzgrgjuFxKDINtaqFuYzawM=' // Foursquare API Key
    }
  };

  try {
    const response = await axios.request(options);
    const data = response.data; // Photos are under the 'data' field in the response
    console.log(response.data);  // Log response for debugging

    // Check if there are any photos for the place
    if (data && data.length > 0) {
      // Map through the photos and construct the URLs for the images
      const photoUrls = data.map(photo => `${photo.prefix}500x500${photo.suffix}`);

      // Return the photo URLs in the response
      return res.json({ photos: photoUrls });
    } else {
      return res.status(404).json({ error: 'No photos found for this restaurant' });
    }
  } catch (error) {
    console.error('Error fetching restaurant photos:', error);
    return res.status(500).json({ error: 'Error fetching restaurant photos' });
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
