/* WeatherReports — plain HTML, CSS, JavaScript */

var COUNTRIES = {
  us: {
    label: "United States",
    cities: [
      { id: "nyc", name: "New York", lat: 40.7128, lon: -74.006 },
      { id: "la", name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
      { id: "chi", name: "Chicago", lat: 41.8781, lon: -87.6298 },
      { id: "hou", name: "Houston", lat: 29.7604, lon: -95.3698 },
      { id: "mia", name: "Miami", lat: 25.7617, lon: -80.1918 },
      { id: "sea", name: "Seattle", lat: 47.6062, lon: -122.3321 },
      { id: "den", name: "Denver", lat: 39.7392, lon: -104.9903 },
      { id: "phx", name: "Phoenix", lat: 33.4484, lon: -112.074 },
    ],
  },
  in: {
    label: "India",
    cities: [
      { id: "mum", name: "Mumbai", lat: 19.076, lon: 72.8777 },
      { id: "del", name: "Delhi", lat: 28.6139, lon: 77.209 },
      { id: "blr", name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
      { id: "che", name: "Chennai", lat: 13.0827, lon: 80.2707 },
      { id: "kol", name: "Kolkata", lat: 22.5726, lon: 88.3639 },
      { id: "hyd", name: "Hyderabad", lat: 17.385, lon: 78.4867 },
      { id: "jai", name: "Jaipur", lat: 26.9124, lon: 75.7873 },
      { id: "koc", name: "Kochi", lat: 9.9312, lon: 76.2673 },
    ],
  },
  uk: {
    label: "United Kingdom",
    cities: [
      { id: "lon", name: "London", lat: 51.5074, lon: -0.1278 },
      { id: "man", name: "Manchester", lat: 53.4808, lon: -2.2426 },
      { id: "edi", name: "Edinburgh", lat: 55.9533, lon: -3.1883 },
      { id: "bir", name: "Birmingham", lat: 52.4862, lon: -1.8904 },
      { id: "liv", name: "Liverpool", lat: 53.4084, lon: -2.9916 },
      { id: "gla", name: "Glasgow", lat: 55.8642, lon: -4.2518 },
      { id: "car", name: "Cardiff", lat: 51.4816, lon: -3.1791 },
      { id: "bel", name: "Belfast", lat: 54.5973, lon: -5.9301 },
    ],
  },
  ca: {
    label: "Canada",
    cities: [
      { id: "tor", name: "Toronto", lat: 43.6532, lon: -79.3832 },
      { id: "van", name: "Vancouver", lat: 49.2827, lon: -123.1207 },
      { id: "mtl", name: "Montreal", lat: 45.5017, lon: -73.5673 },
      { id: "cal", name: "Calgary", lat: 51.0447, lon: -114.0719 },
      { id: "ott", name: "Ottawa", lat: 45.4215, lon: -75.6972 },
      { id: "edm", name: "Edmonton", lat: 53.5461, lon: -113.4938 },
      { id: "win", name: "Winnipeg", lat: 49.8954, lon: -97.1385 },
      { id: "hal", name: "Halifax", lat: 44.6488, lon: -63.5752 },
    ],
  },
  au: {
    label: "Australia",
    cities: [
      { id: "syd", name: "Sydney", lat: -33.8688, lon: 151.2093 },
      { id: "mel", name: "Melbourne", lat: -37.8136, lon: 144.9631 },
      { id: "bne", name: "Brisbane", lat: -27.4698, lon: 153.0251 },
      { id: "per", name: "Perth", lat: -31.9505, lon: 115.8605 },
      { id: "adl", name: "Adelaide", lat: -34.9285, lon: 138.6007 },
      { id: "cbr", name: "Canberra", lat: -35.2809, lon: 149.13 },
      { id: "hob", name: "Hobart", lat: -42.8821, lon: 147.3272 },
      { id: "dar", name: "Darwin", lat: -12.4634, lon: 130.8456 },
    ],
  },
};

var WEATHER_THEMES = {
  clear: { label: "Clear", icon: "☀", theme: "clear" },
  cloudy: { label: "Cloudy", icon: "☁", theme: "cloudy" },
  fog: { label: "Foggy", icon: "🌫", theme: "fog" },
  drizzle: { label: "Drizzle", icon: "🌦", theme: "rain" },
  rain: { label: "Rain", icon: "🌧", theme: "rain" },
  snow: { label: "Snow", icon: "❄", theme: "snow" },
  storm: { label: "Thunderstorm", icon: "⛈", theme: "storm" },
};

var API_URL = "https://api.open-meteo.com/v1/forecast";
var SCENE = document.getElementById("weather-scene");
var TRANSITION_MS = 1200;
var THEME_CLASSES = [
  "theme-clear",
  "theme-cloudy",
  "theme-rain",
  "theme-snow",
  "theme-storm",
  "theme-fog",
];

var currentTheme = "clear";
var transitionTimer = null;
var countryKey = "us";
var selectedCityId = null;
var weatherData = {};
var clockInterval = null;

function $(id) {
  return document.getElementById(id);
}

function codeToTheme(code) {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

function themeMeta(themeKey) {
  return WEATHER_THEMES[themeKey] || WEATHER_THEMES.cloudy;
}

function formatTemp(celsius) {
  if (celsius == null) return "—";
  return Math.round(celsius) + "°C";
}

function formatTime(date, timezone, withSeconds) {
  var opts = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  if (withSeconds) opts.second = "2-digit";
  return new Intl.DateTimeFormat("en-US", opts).format(date);
}

function formatDate(date, timezone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function spawnParticles() {
  var rain = SCENE && SCENE.querySelector(".scene-rain");
  var snow = SCENE && SCENE.querySelector(".scene-snow");
  if (!rain || !snow) return;

  rain.innerHTML = "";
  snow.innerHTML = "";

  for (var i = 0; i < 48; i++) {
    var drop = document.createElement("span");
    drop.className = "rain-drop";
    drop.style.cssText =
      "--x:" +
      Math.random() * 100 +
      "%;--d:" +
      (0.4 + Math.random() * 0.9) +
      "s;--delay:" +
      Math.random() * 2 +
      "s;--h:" +
      (8 + Math.random() * 18) +
      "px;";
    rain.appendChild(drop);
  }

  for (var j = 0; j < 36; j++) {
    var flake = document.createElement("span");
    flake.className = "snow-flake";
    flake.style.cssText =
      "--x:" +
      Math.random() * 100 +
      "%;--d:" +
      (3 + Math.random() * 5) +
      "s;--delay:" +
      Math.random() * 4 +
      "s;--size:" +
      (2 + Math.random() * 4) +
      "px;";
    snow.appendChild(flake);
  }
}

function initScene(themeKey, isDay) {
  if (!SCENE) return;
  SCENE.classList.add("theme-" + themeKey);
  SCENE.dataset.day = isDay ? "1" : "0";
  currentTheme = themeKey;
  spawnParticles();
}

function applySceneTheme(themeKey, isDay) {
  if (!SCENE) return;
  var next = themeKey || "cloudy";
  SCENE.dataset.day = isDay ? "1" : "0";
  if (next === currentTheme) return;

  SCENE.classList.add("is-transitioning");
  if (transitionTimer) clearTimeout(transitionTimer);

  transitionTimer = setTimeout(function () {
    SCENE.classList.remove.apply(SCENE.classList, THEME_CLASSES);
    SCENE.classList.add("theme-" + next);
    currentTheme = next;
    requestAnimationFrame(function () {
      SCENE.classList.remove("is-transitioning");
    });
  }, TRANSITION_MS * 0.4);
}

function fetchCityWeather(city) {
  var params =
    "latitude=" +
    city.lat +
    "&longitude=" +
    city.lon +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day" +
    "&timezone=auto&wind_speed_unit=kmh&temperature_unit=celsius";

  return fetch(API_URL + "?" + params)
    .then(function (res) {
      if (!res.ok) throw new Error("Weather API error: " + res.status);
      return res.json();
    })
    .then(function (data) {
      var c = data.current;
      var themeKey = codeToTheme(c.weather_code);
      var meta = themeMeta(themeKey);

      return {
        cityId: city.id,
        name: city.name,
        timezone: data.timezone,
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        wind: c.wind_speed_10m,
        isDay: c.is_day === 1,
        label: meta.label,
        icon: meta.icon,
        theme: meta.theme,
      };
    });
}

function fetchCountryWeather(cities) {
  return Promise.all(
    cities.map(function (city) {
      return fetchCityWeather(city).catch(function (err) {
        return { error: err, city: city.name };
      });
    })
  ).then(function (results) {
    var weather = {};
    var errors = [];

    results.forEach(function (result) {
      if (result.error) {
        errors.push(result);
      } else {
        weather[result.cityId] = result;
      }
    });

    return { weather: weather, errors: errors };
  });
}

function getCountry() {
  return COUNTRIES[countryKey];
}

function getSelectedWeather() {
  if (!selectedCityId) return null;
  return weatherData[selectedCityId] || null;
}

function updateHero() {
  var w = getSelectedWeather();
  var heroLocation = $("hero-location");
  var heroDate = $("hero-date");
  var heroClock = $("hero-clock");
  var heroTimezone = $("hero-timezone");
  var heroIcon = $("hero-icon");
  var heroTemp = $("hero-temp");
  var heroFeels = $("hero-feels");
  var heroCondition = $("hero-condition");
  var heroHumidity = $("hero-humidity");
  var heroWind = $("hero-wind");

  if (!w) {
    heroLocation.textContent = "Select a city";
    heroCondition.textContent = "Loading weather…";
    return;
  }

  var now = new Date();
  heroLocation.textContent = w.name;
  heroDate.textContent = formatDate(now, w.timezone);
  heroClock.textContent = formatTime(now, w.timezone, true);
  heroClock.setAttribute("datetime", now.toISOString());
  heroTimezone.textContent = w.timezone.replace(/_/g, " ");
  heroIcon.textContent = w.icon;
  heroTemp.textContent = formatTemp(w.temperature);
  heroFeels.textContent = "Feels like " + formatTemp(w.feelsLike);
  heroCondition.textContent = w.label;
  heroHumidity.textContent = w.humidity + "%";
  heroWind.textContent = Math.round(w.wind) + " km/h";

  applySceneTheme(w.theme, w.isDay);
}

function renderCityCard(city, w) {
  var card = document.createElement("button");
  card.type = "button";
  card.className = "city-card";
  card.dataset.cityId = city.id;
  card.setAttribute("role", "listitem");

  if (selectedCityId === city.id) card.classList.add("is-selected");

  if (!w) {
    card.classList.add("is-loading");
    card.innerHTML =
      '<span class="city-name">' +
      city.name +
      '</span><span class="city-status">Loading…</span>';
    return card;
  }

  var now = new Date();
  card.innerHTML =
    '<div class="city-card-top">' +
    '<span class="city-name">' +
    city.name +
    '</span><span class="city-icon" aria-hidden="true">' +
    w.icon +
    "</span></div>" +
    '<span class="city-temp">' +
    formatTemp(w.temperature) +
    "</span>" +
    '<span class="city-condition">' +
    w.label +
    "</span>" +
    '<time class="city-time">' +
    formatTime(now, w.timezone, false) +
    "</time>";

  card.addEventListener("click", function () {
    selectCity(city.id);
  });

  return card;
}

function renderGrid() {
  var country = getCountry();
  var grid = $("cities-grid");
  var label = $("country-label");
  if (!country || !grid) return;

  label.textContent = country.label;
  grid.innerHTML = "";

  country.cities.forEach(function (city) {
    grid.appendChild(renderCityCard(city, weatherData[city.id]));
  });
}

function selectCity(cityId) {
  selectedCityId = cityId;
  renderGrid();
  updateHero();
}

function loadWeather() {
  var country = getCountry();
  var grid = $("cities-grid");
  var refreshBtn = $("refresh-btn");
  if (!country) return;

  grid.classList.add("is-refreshing");
  refreshBtn.setAttribute("disabled", "true");

  fetchCountryWeather(country.cities).then(function (result) {
    weatherData = result.weather;

    if (!selectedCityId && country.cities.length) {
      selectedCityId = country.cities[0].id;
    }

    renderGrid();
    updateHero();

    grid.classList.remove("is-refreshing");
    refreshBtn.removeAttribute("disabled");

    if (result.errors.length) {
      console.warn("Some cities failed to load:", result.errors);
    }
  });
}

function startClocks() {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(function () {
    updateHero();
    var cards = document.querySelectorAll(".city-card:not(.is-loading)");
    cards.forEach(function (card) {
      var w = weatherData[card.dataset.cityId];
      if (!w) return;
      var timeEl = card.querySelector(".city-time");
      if (timeEl) {
        timeEl.textContent = formatTime(new Date(), w.timezone, false);
      }
    });
  }, 1000);
}

function onCountryChange() {
  countryKey = $("country-select").value;
  selectedCityId = null;
  weatherData = {};
  renderGrid();
  loadWeather();
}

function init() {
  countryKey = $("country-select").value;
  initScene("clear", true);
  renderGrid();
  loadWeather();
  startClocks();

  $("country-select").addEventListener("change", onCountryChange);
  $("refresh-btn").addEventListener("click", loadWeather);

  setInterval(loadWeather, 10 * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", init);
