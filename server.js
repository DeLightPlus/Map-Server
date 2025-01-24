const express = require('express');
const axios = require('axios');  // Ensure axios is imported
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Serve static files (if any)
app.use(express.static('public'));
app.use(cors());


// Reusable function to fetch nearby restaurants
async function getNearbyRestaurants(lat, lon) {
  const options = {
    method: 'GET',
    url: 'https://api.foursquare.com/v3/places/search',
    headers: {
      accept: 'application/json',
      Authorization: 'fsq3vzHTwmKG4Lkfvxbt2x+dzzgrgjuFxKDINtaqFuYzawM='  // Your API key without "Bearer"
    },
    params: {
      ll: `${lat},${lon}`,  // Coordinates of the location
      radius: 32 * 1000,     // Radius in meters (32 km)
      categories: '13065'    // Foursquare category for restaurants
    }
  };

  try {
    const response = await axios.request(options);
    
    // If the API responds successfully
    if (response.data) 
    {
      console.log(response.data);      
      return response.data.results || [];  // Return the list of restaurants
    } else {
      return [];  // Return an empty array if no restaurants are found
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw new Error('Error fetching restaurants');
  }
}

// Route to serve the map HTML dynamically // Bloemfontein/@-29.1199822,26.1408227
app.get('/map', async (req, res) => {
  // Get the current location from the query params (fall back to a default if not provided)
  const currentLat = parseFloat(req.query.currentLat) || -29.1199822;  // Default to a location if not provided
  const currentLon = parseFloat(req.query.currentLon) || 26.1408227;  // Default to a location if not provided
  
  // Get the searched location from the query params (may be empty or undefined)
  const searchedLat = parseFloat(req.query.lat);  // Get searchedLat from query param
  const searchedLon = parseFloat(req.query.lon);  // Get searchedLon from query param

  // Use searched location if available, otherwise fallback to current location
  const lat = !isNaN(searchedLat) ? searchedLat : currentLat;
  const lon = !isNaN(searchedLon) ? searchedLon : currentLon;

  const coverageRadius = 32 * 1000; // Radius in meters (32km)

  try {
    // Fetch nearby restaurants from Foursquare API
    const options = {
      method: 'GET',
      url: 'https://api.foursquare.com/v3/places/search',
      headers: {
        accept: 'application/json',
        Authorization: 'fsq3vzHTwmKG4Lkfvxbt2x+dzzgrgjuFxKDINtaqFuYzawM='  // Your API key without "Bearer"
      },
      params: {
        ll: `${lat},${lon}`,  // Coordinates of the location
        radius: 32 * 1000,     // Radius in meters (32 km)
        categories: '13065'    // Foursquare category for restaurants
      }
    };

    const response = await axios.request(options);

    // If the API responds successfully
    const restaurantsData = response.data.results || [];

    restaurantsData.forEach(restaurant => {
        // Accessing categories
        console.log('Categories:', JSON.stringify(restaurant.categories, null, 2));
        
        // Accessing geocodes (main)
        console.log('Geocodes:', JSON.stringify(restaurant.geocodes, null, 2));
      }
    )    

    // Generate HTML content to render the map with restaurant markers
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

            // Custom Icon for Current Location (Red and Smaller)
            var currentLocationIcon = L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              iconSize: [10, 19],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            });

            // Custom Icon for Searched Location (Larger and Blue)
            var searchedLocationIcon = L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [17, 50],
              popupAnchor: [1, -40],
              shadowSize: [41, 41],
            });

            // Add marker for current location
            L.marker([${currentLat}, ${currentLon}], { icon: currentLocationIcon }).addTo(map)
              .bindPopup('Your Current Location')
              .openPopup();

            // Add a circle around the current location marker
            L.circle([${currentLat}, ${currentLon}], {
              color: 'red',
              fillColor: '#f03',
              fillOpacity: 0.2,
              radius: ${coverageRadius},
            }).addTo(map);

            // Add marker for searched location
            L.marker([${lat}, ${lon}], { icon: searchedLocationIcon }).addTo(map)
              .bindPopup('Searched Location')
              .openPopup();

            // Add a circle around the searched location marker
            L.circle([${lat}, ${lon}], {
              color: 'blue',
              fillColor: '#03f',
              fillOpacity: 0.2,
              radius: ${coverageRadius},
            }).addTo(map);

            // Add restaurant markers
            const restaurants = ${JSON.stringify(restaurantsData)};
            restaurants.forEach(function(restaurant) {
              // Access the coordinates from geocodes.main
              const lat = restaurant.geocodes.main.latitude;
              const lon = restaurant.geocodes.main.longitude;

              const restaurantCategory = restaurant.categories[0];
              const restaurantIconUrl = restaurantCategory && restaurantCategory.icon ? 
                restaurantCategory.icon.prefix + '32.png' : 
                'https://th.bing.com/th/id/R.5f8c9ff19804e88396c61171615fb799?rik=Evy%2bK%2fckH%2fMLWQ&pid=ImgRaw&r=0';

              // Use a default icon or the restaurant's own icon
              var restaurantIcon = L.icon({
                iconUrl: restaurantIconUrl,  // Default icon, you can customize this
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              });

              L.marker([lat, lon], { icon: restaurantIcon })
                .addTo(map)
                .bindPopup(restaurant.name);
            });
          </script>
        </body>
      </html>
    `;

    // Send the generated HTML content as the response
    res.send(htmlContent);

  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).send("Error fetching restaurants data");
  }
});

// Endpoint to fetch nearby restaurants only
app.get('/api/restaurants', async (req, res) => {
  const { lat, lon, s_query } = req.query;

  console.log('Latitude:', lat, '| Longitude:', lon, "| s_query: ", s_query);

  try 
  {
    // Validate lat and lon
    if ((isNaN(lat) || isNaN(lon)) && !s_query) 
    {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    if (s_query) 
    {
      // If search query is provided, fetch restaurants based on the query
      restaurantsData = await getRestaurantsByQuery(s_query);  // Replace with your function to search restaurants by name or type
    } 
    else 
    {
      // Otherwise, fetch restaurants based on coordinates
      restaurantsData = await getNearbyRestaurants(lat, lon);  // Use the existing function to get restaurants by lat, lon
    }
   
    console.log("restaurantsData", restaurantsData);    
    return res.json({ results: restaurantsData });
  } 
  catch (error) 
  {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({ error: 'Error fetching restaurants' });
  }
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
