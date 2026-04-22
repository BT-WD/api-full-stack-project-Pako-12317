const API_BASE = 'https://api.countrylayer.com/v2';
const API_KEY = 'e1702d6b1241ed968f91928662727870';
const WEATHER_API_KEY = '7c5b2f720cef6fbd5b7025ff803aa3b5'; // OpenWeatherMap API key
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
let countries = [];
let filteredCountries = [];

const searchInput = document.getElementById('search');
const regionFilter = document.getElementById('region-filter');
const refreshBtn = document.getElementById('refresh-btn');
const countryList = document.getElementById('country-list');
const countryDetail = document.getElementById('country-detail');

// Fetch all countries
async function fetchCountries() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('error').classList.add('hidden');

  // Check cache first
  const cachedData = localStorage.getItem('countriesData');
  const cacheTimestamp = localStorage.getItem('countriesTimestamp');
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  if (cachedData && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION) {
    // Use cached data
    countries = JSON.parse(cachedData);
    filteredCountries = countries;
    displayCountries(filteredCountries);
    document.getElementById('loading').classList.add('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/all?access_key=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    countries = await response.json();
    
    // Cache the data
    localStorage.setItem('countriesData', JSON.stringify(countries));
    localStorage.setItem('countriesTimestamp', Date.now().toString());
    
    filteredCountries = countries;
    displayCountries(filteredCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    document.getElementById('error').textContent = 'Failed to load countries. Please check your internet connection and try again.';
    document.getElementById('error').classList.remove('hidden');
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

// Display countries
function displayCountries(countries) {
  countryList.innerHTML = '';
  countries.forEach(country => {
    const flagUrl = `https://flagcdn.com/w80/${country.alpha2Code.toLowerCase()}.png`;
    const card = document.createElement('div');
    card.className = 'country-card';
    card.innerHTML = `
      <img src="${flagUrl}" alt="${country.name} flag" onerror="this.style.display='none'">
      <h3>${country.name}</h3>
      <p>Region: ${country.region}</p>
      <p>Capital: ${country.capital || 'N/A'}</p>
    `;
    card.addEventListener('click', () => showCountryDetail(country));
    countryList.appendChild(card);
  });
}

// Show country detail
async function showCountryDetail(country) {
  countryList.classList.add('hidden');
  countryDetail.classList.remove('hidden');
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const isFavorite = favorites.some(fav => fav.alpha3Code === country.alpha3Code);
  const flagUrl = `https://flagcdn.com/w320/${country.alpha2Code.toLowerCase()}.png`;
  
  // Start building HTML
  let html = `
    <button class="back-btn" onclick="goBack()">Back</button>
    <button class="favorite-btn" onclick="toggleFavorite('${country.alpha3Code}')">${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>
    <h2>${country.name}</h2>
    <img src="${flagUrl}" alt="${country.name} flag" style="width: 200px; border-radius: 4px;" onerror="this.style.display='none'">
    <p><strong>Capital:</strong> ${country.capital || 'N/A'}</p>
    <p><strong>Region:</strong> ${country.region}</p>
    <p><strong>Alpha 2 Code:</strong> ${country.alpha2Code}</p>
    <p><strong>Alpha 3 Code:</strong> ${country.alpha3Code}</p>
    <p><strong>Top Level Domain:</strong> ${country.topLevelDomain ? country.topLevelDomain.join(', ') : 'N/A'}</p>
    <p><strong>Calling Codes:</strong> ${country.callingCodes ? country.callingCodes.join(', ') : 'N/A'}</p>
  `;
  
  // Fetch weather data if capital exists
  if (country.capital && WEATHER_API_KEY !== 'YOUR_OPENWEATHERMAP_API_KEY') {
    try {
      const weatherResponse = await fetch(`${WEATHER_API_BASE}/weather?q=${encodeURIComponent(country.capital)}&appid=${WEATHER_API_KEY}&units=metric`);
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        html += `
          <h3>Weather in ${country.capital}</h3>
          <p><strong>Temperature:</strong> ${weatherData.main.temp}°C (feels like ${weatherData.main.feels_like}°C)</p>
          <p><strong>Weather:</strong> ${weatherData.weather[0].description}</p>
          <p><strong>Humidity:</strong> ${weatherData.main.humidity}%</p>
          <p><strong>Wind Speed:</strong> ${weatherData.wind.speed} m/s</p>
        `;
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  }
  
  // Add travel tips
  html += `
    <h3>Travel Information</h3>
    <p><strong>General Tips:</strong> Always check current travel advisories before planning your trip. Visa requirements vary by nationality.</p>
    <p><strong>Emergency Numbers:</strong> Police: 911 (US-style) or local emergency numbers. Check with your embassy for specific contacts.</p>
    <p><strong>Health:</strong> Consult a travel health clinic for vaccinations and health advice specific to this destination.</p>
  `;
  
  countryDetail.innerHTML = html;
}

// Go back to list
function goBack() {
  countryDetail.classList.add('hidden');
  countryList.classList.remove('hidden');
}

// Toggle favorite
function toggleFavorite(code) {
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const index = favorites.findIndex(fav => fav.alpha3Code === code);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    const country = countries.find(c => c.alpha3Code === code);
    if (country) favorites.push(country);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  // Update button text
  const btn = document.querySelector('.favorite-btn');
  const isFavorite = favorites.some(fav => fav.alpha3Code === code);
  btn.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
}

// Search and filter
function filterCountries() {
  const searchTerm = searchInput.value.toLowerCase();
  const region = regionFilter.value;
  filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.common.toLowerCase().includes(searchTerm);
    const matchesRegion = !region || country.region === region;
    return matchesSearch && matchesRegion;
  });
  displayCountries(filteredCountries);
}

// Event listeners
searchInput.addEventListener('input', filterCountries);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    filterCountries();
  }
});
regionFilter.addEventListener('change', filterCountries);
refreshBtn.addEventListener('click', () => {
  localStorage.removeItem('countriesData');
  localStorage.removeItem('countriesTimestamp');
  fetchCountries();
});

// Initialize
fetchCountries();
