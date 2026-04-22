# Global Country Explorer

A web-based application for exploring countries around the world, designed for students, travelers, and geography enthusiasts.

## Features

- **Searchable Country List**: Search countries by name
- **Regional Filtering**: Filter countries by region (Africa, Americas, Asia, Europe, Oceania)
- **Country Details**: Click on any country to view detailed information including:
  - Flag (from FlagCDN)
  - Name
  - Capital
  - Region
  - Country codes
  - Top level domain
  - Calling codes
- **Weather Information**: Current weather data for capital cities (requires OpenWeatherMap API key)
- **Travel Tips**: General travel advice and emergency information
- **Favorites**: Save favorite countries using local storage
- **Data Caching**: 24-hour local cache to minimize API requests
- **Refresh Data**: Manual refresh button to update cached data

## API Keys Required

- **CountryLayer API Key**: For country data (already configured)
- **OpenWeatherMap API Key**: For weather information
  - Sign up at https://openweathermap.org/api
  - Get a free API key
  - Replace `YOUR_OPENWEATHERMAP_API_KEY` in `index.js`

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- CountryLayer API (https://countrylayer.com/)
- OpenWeatherMap API (https://openweathermap.org/)

## API Endpoints Used

- `/v2/all` - Fetch all countries (requires API key)

## How to Run

1. Clone the repository
2. Open `index.html` in a web browser, or
3. Start a local server: `python3 -m http.server 8000`
4. Visit `http://localhost:8000`

## Data Storage

- Primary data source: CountryLayer API
- User preferences (favorites): Local Storage
- Country data cache: Local Storage (24-hour expiry to minimize API requests)

## Target Audience

- Geography learners
- Trip planners
- Casual users interested in country information