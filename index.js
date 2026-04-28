const API_BASE = 'https://api.countrylayer.com/v2';
const API_KEY = 'e1702d6b1241ed968f91928662727870';
const WEATHER_API_KEY = '7c5b2f720cef6fbd5b7025ff803aa3b5'; // OpenWeatherMap API key
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
const TRAVEL_BRIEFING_API = 'https://travelbriefing.org';
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
function showCountryDetail(country) {
  console.log('Showing detail for:', country.name);
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
    <h3>Travel Information</h3>
    <p>Loading tips...</p>
  `;
  
  countryDetail.innerHTML = html;
  
  // Load tips asynchronously
  loadTips(country);
}

// Load tips asynchronously
async function loadTips(country) {
  // Fetch weather data if capital exists
  if (country.capital && WEATHER_API_KEY !== 'YOUR_OPENWEATHERMAP_API_KEY') {
    const weatherCacheKey = `weather_${country.capital}`;
    const weatherCache = localStorage.getItem(weatherCacheKey);
    const weatherTimestamp = localStorage.getItem(`${weatherCacheKey}_timestamp`);
    const WEATHER_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    
    let weatherData = null;
    if (weatherCache && weatherTimestamp && (Date.now() - parseInt(weatherTimestamp)) < WEATHER_CACHE_DURATION) {
      weatherData = JSON.parse(weatherCache);
    } else {
      try {
        const weatherResponse = await fetch(`${WEATHER_API_BASE}/weather?q=${encodeURIComponent(country.capital)}&appid=${WEATHER_API_KEY}&units=metric`);
        if (weatherResponse.ok) {
          weatherData = await weatherResponse.json();
          localStorage.setItem(weatherCacheKey, JSON.stringify(weatherData));
          localStorage.setItem(`${weatherCacheKey}_timestamp`, Date.now().toString());
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    }
    
    if (weatherData) {
      const weatherHtml = `
        <h3>Weather in ${country.capital}</h3>
        <p><strong>Temperature:</strong> ${weatherData.main.temp}°C (feels like ${weatherData.main.feels_like}°C)</p>
        <p><strong>Weather:</strong> ${weatherData.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${weatherData.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${weatherData.wind.speed} m/s</p>
      `;
      // Append to existing html
      const existing = countryDetail.innerHTML;
      countryDetail.innerHTML = existing.replace('<h3>Travel Information</h3>\n    <p>Loading tips...</p>', weatherHtml + '<h3>Travel Information</h3>\n    <p>Loading tips...</p>');
    }
  }
  
  // Fetch travel tips with caching
  const tipsCacheKey = `tips_${country.alpha2Code}`;
  const tipsCache = localStorage.getItem(tipsCacheKey);
  const tipsTimestamp = localStorage.getItem(`${tipsCacheKey}_timestamp`);
  const TIPS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  let tipsData = null;
  if (tipsCache && tipsTimestamp && (Date.now() - parseInt(tipsTimestamp)) < TIPS_CACHE_DURATION) {
    tipsData = JSON.parse(tipsCache);
  } else {
    try {
      const tipsResponse = await fetch(`${TRAVEL_BRIEFING_API}/${country.alpha2Code.toLowerCase()}.json`);
      if (tipsResponse.ok) {
        tipsData = await tipsResponse.json();
        localStorage.setItem(tipsCacheKey, JSON.stringify(tipsData));
        localStorage.setItem(`${tipsCacheKey}_timestamp`, Date.now().toString());
      } else {
        // Fallback to region-based tips
        tipsData = getRegionTips(country.region);
        // Cache the fallback
        localStorage.setItem(tipsCacheKey, JSON.stringify(tipsData));
        localStorage.setItem(`${tipsCacheKey}_timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching travel tips:', error);
      // Fallback to region-based tips
      tipsData = getRegionTips(country.region);
      // Cache the fallback
      localStorage.setItem(tipsCacheKey, JSON.stringify(tipsData));
      localStorage.setItem(`${tipsCacheKey}_timestamp`, Date.now().toString());
    }
  }
  
  let tipsHtml = '';
  if (tipsData) {
    const safety = tipsData.safety || {};
    const health = tipsData.health || {};
    const currency = tipsData.currency || {};
    const language = tipsData.language || [];
    
    tipsHtml = `
      <p><strong>Safety:</strong> ${safety.advisory || 'No specific advisory.'}</p>
      <p><strong>Currency:</strong> ${currency.name || 'N/A'} (${currency.code || ''})</p>
      <p><strong>Languages:</strong> ${language.map(l => l.language).join(', ') || 'N/A'}</p>
      <p><strong>Health:</strong> ${health.advisory || 'Consult a travel health clinic.'}</p>
    `;
  } else {
    tipsHtml = `<p>Travel tips not available for this country.</p>`;
  }
  
  // Replace the loading text
  const existing = countryDetail.innerHTML;
  countryDetail.innerHTML = existing.replace('<h3>Travel Information</h3>\n    <p>Loading tips...</p>', '<h3>Travel Information</h3>' + tipsHtml);
}

// Get region-based tips as fallback
function getRegionTips(region) {
  const tips = {
    Africa: {
      safety: { advisory: 'Check current travel advisories. Some areas may have security concerns.' },
      health: { advisory: 'Vaccinations for yellow fever, hepatitis A, typhoid recommended in many areas. Malaria risk in some regions.' },
      currency: { name: 'Varies by country', code: '' },
      language: [{ language: 'Varies (English, French, Arabic, etc.)' }]
    },
    Americas: {
      safety: { advisory: 'Standard safety precautions. Check local advisories for specific areas.' },
      health: { advisory: 'Routine vaccinations recommended. Some areas have Zika or dengue risk.' },
      currency: { name: 'Varies (USD, CAD, etc.)', code: '' },
      language: [{ language: 'Varies (English, Spanish, Portuguese, etc.)' }]
    },
    Asia: {
      safety: { advisory: 'Varies widely. Check advisories for specific countries.' },
      health: { advisory: 'Vaccinations for hepatitis A, typhoid, Japanese encephalitis in some areas. Malaria in rural regions.' },
      currency: { name: 'Varies by country', code: '' },
      language: [{ language: 'Varies (Mandarin, Hindi, Arabic, etc.)' }]
    },
    Europe: {
      safety: { advisory: 'Generally safe. Standard precautions apply.' },
      health: { advisory: 'Routine vaccinations recommended. Tick-borne diseases in some areas.' },
      currency: { name: 'Euro (most countries)', code: 'EUR' },
      language: [{ language: 'Varies (English, French, German, etc.)' }]
    },
    Oceania: {
      safety: { advisory: 'Generally safe. Check for natural disaster risks.' },
      health: { advisory: 'Routine vaccinations. Some areas have mosquito-borne diseases.' },
      currency: { name: 'Varies (AUD, NZD, etc.)', code: '' },
      language: [{ language: 'English, indigenous languages' }]
    }
  };
  return tips[region] || {
    safety: { advisory: 'Check local travel advisories.' },
    health: { advisory: 'Consult a travel health clinic.' },
    currency: { name: 'Local currency', code: '' },
    language: [{ language: 'Local languages' }]
  };
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

// Go back to country list
function goBack() {
  countryDetail.classList.add('hidden');
  countryList.classList.remove('hidden');
}

// Search and filter
function filterCountries() {
  const searchTerm = searchInput.value.toLowerCase();
  const region = regionFilter.value;
  filteredCountries = countries.filter(country => {
    const matchesName = country.name.toLowerCase().includes(searchTerm);
    const matchesCapital = country.capital ? country.capital.toLowerCase().includes(searchTerm) : false;
    const matchesCode = country.alpha2Code.toLowerCase().includes(searchTerm) || country.alpha3Code.toLowerCase().includes(searchTerm);
    const matchesSearch = matchesName || matchesCapital || matchesCode;
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
