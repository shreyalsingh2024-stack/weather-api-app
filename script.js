// =============================================
// WeatherNow v2 — Full Featured
// Features: Current weather, 5-day forecast,
// Geolocation, °C/°F toggle, search history,
// loading animation, sunrise/sunset, dynamic icons
// =============================================

const API_KEY = "enter your api key here";
const BASE_URL  = "https://api.openweathermap.org/data/2.5";

// ---- DOM Elements ----
const cityInput       = document.getElementById("cityInput");
const searchBtn       = document.getElementById("searchBtn");
const locationBtn     = document.getElementById("locationBtn");
const weatherCard     = document.getElementById("weatherCard");
const forecastSection = document.getElementById("forecastSection");
const errorMsg        = document.getElementById("errorMsg");
const loader          = document.getElementById("loader");
const historyWrap     = document.getElementById("historyWrap");

// ---- State ----
let currentUnit = "C";       // "C" or "F"
let lastData    = null;      // last fetched weather data
let lastForecast = null;     // last fetched forecast data

// =============================================
// UNIT TOGGLE
// =============================================
function setUnit(unit) {
  currentUnit = unit;
  document.getElementById("btnC").classList.toggle("active", unit === "C");
  document.getElementById("btnF").classList.toggle("active", unit === "F");

  // Re-render with existing data (no new API call needed)
  if (lastData)     displayWeather(lastData);
  if (lastForecast) displayForecast(lastForecast);
}

function toDisplay(tempC) {
  if (currentUnit === "F") return `${Math.round(tempC * 9/5 + 32)}°F`;
  return `${Math.round(tempC)}°C`;
}

// =============================================
// SEARCH HISTORY (localStorage)
// =============================================
function getHistory() {
  return JSON.parse(localStorage.getItem("wn_history") || "[]");
}

function addToHistory(city) {
  let history = getHistory();
  // Remove duplicate, add to front, keep last 5
  history = [city, ...history.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
  localStorage.setItem("wn_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (!history.length) { historyWrap.innerHTML = ""; return; }
  historyWrap.innerHTML = history.map(city => `
    <div class="history-chip" onclick="searchCity('${city}')">
      <i class="fa-solid fa-clock-rotate-left"></i> ${city}
    </div>`).join("");
}

function searchCity(city) {
  cityInput.value = city;
  fetchWeather(city);
}

// =============================================
// LOADING STATE
// =============================================
function showLoader() {
  loader.style.display       = "flex";
  weatherCard.style.display  = "none";
  forecastSection.style.display = "none";
  errorMsg.textContent       = "";
}

function hideLoader() {
  loader.style.display = "none";
}

// =============================================
// GEOLOCATION
// =============================================
locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  locationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  locationBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      await fetchWeatherByCoords(lat, lon);
      locationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
      locationBtn.disabled = false;
    },
    () => {
      showError("Location access denied. Please search manually.");
      locationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
      locationBtn.disabled = false;
    }
  );
});

// =============================================
// FETCH BY CITY NAME
// =============================================
async function fetchWeather(city) {
  if (!city) return;
  showLoader();
  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`)
    ]);

    if (!weatherRes.ok) throw new Error("City not found. Please check the spelling.");

    const weatherData  = await weatherRes.json();
    const forecastData = await forecastRes.json();

    lastData     = weatherData;
    lastForecast = forecastData;

    addToHistory(weatherData.name);
    displayWeather(weatherData);
    displayForecast(forecastData);
    hideLoader();
  } catch (err) {
    hideLoader();
    showError(err.message);
  }
}

// =============================================
// FETCH BY COORDINATES (Geolocation)
// =============================================
async function fetchWeatherByCoords(lat, lon) {
  showLoader();
  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    if (!weatherRes.ok) throw new Error("Could not fetch weather for your location.");

    const weatherData  = await weatherRes.json();
    const forecastData = await forecastRes.json();

    lastData     = weatherData;
    lastForecast = forecastData;

    cityInput.value = weatherData.name;
    addToHistory(weatherData.name);
    displayWeather(weatherData);
    displayForecast(forecastData);
    hideLoader();
  } catch (err) {
    hideLoader();
    showError(err.message);
  }
}

// =============================================
// DISPLAY CURRENT WEATHER
// =============================================
function displayWeather(data) {
  weatherCard.style.display = "block";

  // City + country
  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;

  // Date
  const now = new Date();
  document.getElementById("dateTime").textContent = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  // Dynamic weather icon from OpenWeatherMap
  const iconCode = data.weather[0].icon;
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Temperature (stored as Celsius, converted on display)
  document.getElementById("temperature").textContent = toDisplay(data.main.temp);
  document.getElementById("weatherDesc").textContent = data.weather[0].description;

  // Details
  document.getElementById("humidity").textContent   = `${data.main.humidity}%`;
  document.getElementById("windSpeed").textContent  = `${Math.round(data.wind.speed * 3.6)} km/h`;
  document.getElementById("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  document.getElementById("feelsLike").textContent  = toDisplay(data.main.feels_like);

  // Sunrise & Sunset — convert Unix timestamp to local time
  document.getElementById("sunrise").textContent = formatTime(data.sys.sunrise, data.timezone);
  document.getElementById("sunset").textContent  = formatTime(data.sys.sunset,  data.timezone);

  // Dynamic background based on weather condition
  setBackground(data.weather[0].main, iconCode);
}

// =============================================
// DISPLAY 5-DAY FORECAST
// The API returns data every 3 hours.
// We pick one reading per day (around noon).
// =============================================
function displayForecast(data) {
  forecastSection.style.display = "block";

  // Group by date, pick the entry closest to 12:00
  const daily = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(" ")[0]; // "2024-01-15"
    const hour = parseInt(item.dt_txt.split(" ")[1]);
    if (!daily[date] || Math.abs(hour - 12) < Math.abs(parseInt(daily[date].dt_txt.split(" ")[1]) - 12)) {
      daily[date] = item;
    }
  });

  // Take next 5 days (skip today)
  const days = Object.values(daily).slice(1, 6);

  document.getElementById("forecastGrid").innerHTML = days.map(day => {
    const date     = new Date(day.dt * 1000);
    const dayName  = date.toLocaleDateString("en-US", { weekday: "short" });
    const iconCode = day.weather[0].icon;
    const desc     = day.weather[0].description;
    const tempMax  = toDisplay(day.main.temp_max);
    const tempMin  = toDisplay(day.main.temp_min);

    return `
      <div class="forecast-card">
        <p class="f-day">${dayName}</p>
        <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${desc}"/>
        <p class="f-temp">${tempMax}</p>
        <p class="f-range">${tempMin}</p>
        <p class="f-desc">${desc}</p>
      </div>`;
  }).join("");
}

// =============================================
// HELPER: Format Unix timestamp to HH:MM AM/PM
// =============================================
function formatTime(unixTimestamp, timezoneOffset) {
  // timezoneOffset is in seconds from UTC
  const date = new Date((unixTimestamp + timezoneOffset) * 1000);
  let hours   = date.getUTCHours();
  const mins  = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm  = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
}

// =============================================
// HELPER: Dynamic background based on weather
// =============================================
function setBackground(condition, icon) {
  const isNight = icon.includes("n");
  const gradients = {
    Clear:        isNight ? "135deg, #0a0a1a, #1a1a3e" : "135deg, #1a1a2e, #0f3460",
    Clouds:       "135deg, #2c3e50, #3d4f6b",
    Rain:         "135deg, #1a2a3a, #2d4a5a",
    Drizzle:      "135deg, #1c3a4a, #2d4a5a",
    Thunderstorm: "135deg, #0d0d1a, #1a1a2e",
    Snow:         "135deg, #2a3a4a, #3d5060",
    Mist:         "135deg, #2a3040, #3a4050",
    Haze:         "135deg, #2a3040, #3a4050",
  };
  const grad = gradients[condition] || "135deg, #1a1a2e, #16213e, #0f3460";
  document.body.style.background = `linear-gradient(${grad})`;
}

// =============================================
// ERROR DISPLAY
// =============================================
function showError(msg) {
  errorMsg.textContent = msg;
  weatherCard.style.display     = "none";
  forecastSection.style.display = "none";
  setTimeout(() => errorMsg.textContent = "", 4000);
}

// =============================================
// EVENT LISTENERS
// =============================================
searchBtn.addEventListener("click", () => fetchWeather(cityInput.value.trim()));

cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") fetchWeather(cityInput.value.trim());
});

// =============================================
// INIT
// =============================================
renderHistory();

// Auto-load last searched city if any
const lastCity = getHistory()[0];
if (lastCity) fetchWeather(lastCity);
if (firstcity) fetchweather 
