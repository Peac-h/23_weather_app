import { async } from "regenerator-runtime";
import { getJSON } from "./helpers.js";
require("dotenv").config();

// //GENERALS// //

// DOM Selectors
const inputSearchEl = document.getElementById("inputSearch");
const btnSearch = document.getElementById("btnSearch");
const wCurrentEl = document.getElementById("wCurrent");
const wFutureEl = document.getElementById("wFuture");
const sectionScrollEl = document.getElementById("sectionScroll");

// Code Variables
let searchedLocation;

// API Keys
const API_KEY_LOCATION = process.env.API_KEY_LOCATION;
const API_KEY_WEATHER = process.env.API_KEY_WEATHER;

// //FUNCTIONS// //

// loader rendering
const renderLoader = function () {
  const loader = `
  <div class="loader" id="sectionLoader">
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
  </div>
`;
  sectionScrollEl.innerHTML = loader;
  wCurrentEl.innerHTML = loader;
  wFutureEl.innerHTML = loader;
};

// scroll text rendering
const renderScroll = function (city) {
  const scroll = `
  <div>
    Weather in <span>${city}</span> Weather in <span>${city}</span>&nbsp;
  </div>
  <div>
    Weather in <span>${city}</span> Weather in <span>${city}</span>&nbsp;
  </div>
  <div>
    Weather in <span>${city}</span> Weather in <span>${city}</span>&nbsp;
  </div>
`;
  sectionScrollEl.innerHTML = scroll;
};

// error rendering
const renderError = function (error) {
  const errorMsg = `<div class="error">Error Getting Data. ${error}.</div>`;

  // scroll fiel
  sectionScrollEl.innerHTML = errorMsg;
  const errorDiv = document.querySelector("#sectionScroll .error");
  errorDiv.style.animation = "none";

  // weather field
  wCurrentEl.innerHTML = errorMsg;
  wFutureEl.innerHTML = errorMsg;
};

// seacrh input handler
const handleSearch = function () {
  // if the input is empty, do nothing
  if (!inputSearchEl.value) return;
  // search for the coordinates
  getCoords(inputSearchEl.value);
  // clear the input
  inputSearchEl.value = "";
  // remove the focus from the input
  inputSearchEl.blur();
};

// //EVENT LISTENERS// //

// Search Button
btnSearch.addEventListener("click", () => {
  // focus the input
  inputSearchEl.focus();
  handleSearch();
});

// Search Input Enter key
inputSearchEl.addEventListener("keyup", (e) => {
  // if enter key is pressed
  if (e.key === "Enter") {
    handleSearch();
  }
});

// //API Handling// //

// Get Geocode API Data
const getCoords = async function (location = "berlin") {
  try {
    // render loader
    renderLoader();

    // get location data
    const data = await getJSON(
      `https://api.opencagedata.com/geocode/v1/json?q=${location}&key=${API_KEY_LOCATION}`
    );
    const { lat, lng } = data.results[0].geometry;
    const locationData = data.results[0].formatted;
    const city = locationData.split(",")[0];

    // get full location name to render in current weather heading part after
    searchedLocation = locationData;

    // render scroll
    renderScroll(city);

    // get weather with received coordinates
    getWeather(lat, lng);
  } catch (error) {
    // render error for user
    renderError(error.message);
  }
};
getCoords();

// Get Weather API Data
const getWeather = async function (lat, lng) {
  try {
    // get the data
    const data = await getJSON(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly&units=metric&appid=${API_KEY_WEATHER}`
    );

    // render the data
    renderCurrentW(data);

    renderFutureW(data);
  } catch (error) {
    // render error for user
    renderError(error.message);
  }
};

// Render Current Weather
const renderCurrentW = function (data) {
  // clear the field
  wCurrentEl.innerHTML = "";

  // get all pieces of data
  const { timezone } = data;
  const { dt } = data.current;

  const currentDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(dt * 1000);

  const { icon, description } = data.current.weather[0];
  const { temp, feels_like } = data.current;
  const {
    humidity,
    pressure,
    visibility,
    wind_speed,
    dew_point,
    uvi,
    clouds,
    sunrise,
    sunset,
  } = data.current;

  const currentSunrise = new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
    timeZone: timezone,
  }).format(sunrise * 1000);

  const currentSunset = new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
    timeZone: timezone,
  }).format(sunset * 1000);

  // form the html based on the data
  const htmlCurrentW = `
  <div class="w-current__date-location">
    <span class="date">${currentDate}</span>
    <span class="location">${searchedLocation}</span>
  </div>

  <div class="w-current__temp">
    <img src='http://openweathermap.org/img/wn/${icon}.png' alt="weather logo" />
    <div>${Math.round(temp)} °C</div>
  </div>

  <div class="w-current__description">
    <div>Feels like <span> ${Math.round(feels_like)} °C </span>. <span> ${
    description[0].toUpperCase() + description.slice(1)
  } </span>.</div>
  </div>

  <div class="w-current__details">
    <div>
      <div>Dew point: <span> ${Math.round(dew_point)} °C</span></div>
      <div>Humidity: <span> ${humidity}%</span></div>
    </div>
    <div>
      <div>Pressure: <span> ${pressure}hPa</span></div>
      <div>Wind: <span> ${wind_speed}m/s</span></div>
    </div>
    <div>
      <div>Clouds: <span> ${clouds}%</span></div>
      <div>Visibility: <span> ${(visibility / 1000).toFixed(1)}km</span></div>
    </div>
    <div>
      <div class="suntime">Sunrise: ${currentSunrise}</div>
      <div class="suntime">Sunset: ${currentSunset}</div>
    </div>
  </div>
  `;

  // attach the html
  wCurrentEl.innerHTML = htmlCurrentW;
};

// Render Future Weather
const renderFutureW = function (data) {
  // clear the field
  wFutureEl.innerHTML = "";

  // get needed data by looping through the future data array
  // start from index 1 (next day), and taking 4 days information
  // do the same thing for each of the days
  for (let i = 1; i <= 4; i++) {
    // get all pieces of data
    const { dt } = data.daily[i];
    const { timezone } = data;

    const dtFormated = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: timezone,
    }).format(dt * 1000);

    const { morn, day, eve, night, min, max } = data.daily[i].temp;
    const { icon } = data.daily[0].weather[0];
    const { description } = data.daily[0].weather[0];

    // form the html based on the data
    const htmlFutureW = `
    <div class="w-future__day">
      <span class="date">${dtFormated}</span>
      <div class="temp">
        <img src='http://openweathermap.org/img/wn/${icon}.png' alt="weather logo" />
        <div>${Math.round(day)} °C ${
      description[0].toUpperCase() + description.slice(1)
    }</div>
      </div>
  
      <div class="temp-range">
        The high will be ${Math.round(max)} °C, the low will be ${Math.round(
      min
    )} °C.
      </div>
  
      <div class="daytimes">
        <div class="daytime">
          <div>Morning:</div>
          <div>${Math.round(morn)} °C</div>
        </div>
  
        <div class="daytime">
          <div>Afternoon:</div>
          <div> ${Math.round(day)} °C</div>
        </div>
  
        <div class="daytime">
          <div>Evening:</div>
          <div> ${Math.round(eve)} °C</div>
        </div>
  
        <div class="daytime">
          <div>Night:</div>
          <div> ${Math.round(night)} °C</div>
        </div>
      </div>
  
      <span class="number">${i.toString().padStart(2, "0")}</span>
  
    </div>
    `;

    // attach the html
    wFutureEl.innerHTML += htmlFutureW;
  }
};
