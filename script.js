document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn');
    const weatherCard = document.getElementById('weatherCard');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('errorMsg');

    // UI Elements to update
    const ui = {
        city: document.getElementById('cityName'),
        date: document.getElementById('currentDate'),
        temp: document.getElementById('temperature'),
        condition: document.getElementById('condition'),
        icon: document.getElementById('weatherIcon'),
        wind: document.getElementById('windSpeed'),
        humidity: document.getElementById('humidity'),
        pressure: document.getElementById('pressure')
    };

    // Helper: Dates
    function formatDate() {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return new Date().toLocaleDateString('en-US', options);
    }

    // Helper: Map WMO Weather Codes to text and icons
    function getWeatherInfo(code) {
        // Simple mapping for WMO codes from Open-Meteo
        // 0: Clear sky
        // 1, 2, 3: Mainly clear, partly cloudy, and overcast
        // 45, 48: Fog
        // 51, 53, 55: Drizzle
        // 61, 63, 65: Rain
        // 71, 73, 75: Snow
        // 95, 96, 99: Thunderstorm

        let icon = 'fa-sun';
        let text = 'Unknown';
        let bgStyle = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'; // Default Sunny

        if (code === 0) {
            text = 'Clear Sky';
            icon = 'fa-sun';
            bgStyle = 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)'; // Clear Blue
        } else if (code >= 1 && code <= 3) {
            text = 'Partly Cloudy';
            icon = 'fa-cloud-sun';
            bgStyle = 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)'; // Cloudy Blue
        } else if (code >= 45 && code <= 48) {
            text = 'Foggy';
            icon = 'fa-smog';
            bgStyle = 'linear-gradient(135deg, #304352 0%, #d7d2cc 100%)'; // Grey Fog
        } else if (code >= 51 && code <= 67) {
            text = 'Rain';
            icon = 'fa-cloud-rain';
            bgStyle = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'; // Dark Rain
        } else if (code >= 71 && code <= 86) {
            text = 'Snow';
            icon = 'fa-snowflake';
            bgStyle = 'linear-gradient(135deg, #83a4d4 0%, #b6fbff 100%)'; // Ice Blue
        } else if (code >= 95) {
            text = 'Thunderstorm';
            icon = 'fa-bolt';
            bgStyle = 'linear-gradient(135deg, #232526 0%, #414345 100%)'; // Dark Storm
        }

        return { text, icon, bgStyle };
    }

    // API Functions
    async function fetchCoordinates(city) {
        try {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                throw new Error('City not found');
            }

            return data.results[0]; // { latitude, longitude, name, country }
        } catch (error) {
            throw error;
        }
    }

    async function fetchWeather(lat, lon) {
        try {
            // Fetch current weather + wind + pressure + humidity
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m`);
            const data = await response.json();
            return data.current;
        } catch (error) {
            throw error;
        }
    }

    // Main App Logic
    async function updateWeather(cityQuery) {
        // Reset UI
        errorMsg.style.display = 'none';
        weatherCard.style.display = 'none';
        loader.style.display = 'block';

        try {
            // 1. Get Coordinates
            const locationData = await fetchCoordinates(cityQuery);
            const { latitude, longitude, name, country } = locationData;

            // 2. Get Weather
            const weather = await fetchWeather(latitude, longitude);

            // 3. Update UI
            ui.city.textContent = `${name}, ${country}`;
            ui.date.textContent = formatDate();
            ui.temp.textContent = Math.round(weather.temperature_2m);
            ui.wind.textContent = `${weather.wind_speed_10m} km/h`;
            ui.humidity.textContent = `${weather.relative_humidity_2m}%`;
            ui.pressure.textContent = `${weather.surface_pressure} hPa`;

            // Weather Icon & Dynamic Background
            const info = getWeatherInfo(weather.weather_code);
            ui.condition.textContent = info.text;
            ui.icon.className = `fas ${info.icon}`;
            document.body.style.background = info.bgStyle;

            // Show Card
            loader.style.display = 'none';
            weatherCard.style.display = 'block';

        } catch (err) {
            loader.style.display = 'none';
            errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
            errorMsg.style.display = 'block';
        }
    }

    // Geolocation Logic
    async function updateWeatherByCoords(lat, lon) {
        // Reverse Geocoding is harder without an API key (OpenStreetMap has one but rate limits).
        // Let's just say "Your Location" or try to find a minimal reverse geocode later if needed.
        // For now, let's fetch weather and just show "Current Location" as name, or allow the user to confirm.

        // Actually, we can just display the coordinates or generic name, 
        // OR we can use the weather API but we won't get a city name from Open-Meteo weather endpoint.
        // Let's stick to just showing weather for now.

        loader.style.display = 'block';
        errorMsg.style.display = 'none';
        weatherCard.style.display = 'none';

        try {
            const weather = await fetchWeather(lat, lon);

            ui.city.textContent = "Your Location";
            ui.date.textContent = formatDate();
            ui.temp.textContent = Math.round(weather.temperature_2m);
            ui.wind.textContent = `${weather.wind_speed_10m} km/h`;
            ui.humidity.textContent = `${weather.relative_humidity_2m}%`;
            ui.pressure.textContent = `${weather.surface_pressure} hPa`;

            const info = getWeatherInfo(weather.weather_code);
            ui.condition.textContent = info.text;
            ui.icon.className = `fas ${info.icon}`;
            document.body.style.background = info.bgStyle;

            loader.style.display = 'none';
            weatherCard.style.display = 'block';

        } catch (err) {
            loader.style.display = 'none';
            errorMsg.textContent = "Could not fetch weather for your location.";
            errorMsg.style.display = 'block';
        }
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const query = cityInput.value.trim();
        if (query) {
            updateWeather(query);
        }
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = cityInput.value.trim();
            if (query) {
                updateWeather(query);
            }
        }
    });

    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            loader.style.display = 'block';
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    loader.style.display = 'none';
                    errorMsg.textContent = "Permission denied or unable to retrieve location.";
                    errorMsg.style.display = 'block';
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    // Initial Load - Optional default
    // updateWeather('New York');
});
