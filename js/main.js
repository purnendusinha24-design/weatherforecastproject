// main.js - fetches 7Timer data and renders a 7-day forecast
(async function(){
  const citySelect = document.getElementById('citySelect');
  const lookupBtn = document.getElementById('lookupBtn');
  const statusEl = document.getElementById('status');
  const forecastEl = document.getElementById('forecast');

  // Load city list (CSV)
  async function loadCities(){
    const res = await fetch('city_coordinates.csv');
    const text = await res.text();
    const lines = text.trim().split('\n');
    const header = lines.shift().split(',');
    const cities = lines.map(line => {
      const parts = line.split(',');
      return {
        lat: parts[0],
        lon: parts[1],
        city: parts[2],
        country: parts[3]
      };
    });
    return cities;
  }

  function populateCities(cities){
    cities.sort((a,b)=> a.city.localeCompare(b.city, undefined, {sensitivity: 'base'}));
    cities.forEach(c=>{
      const opt = document.createElement('option');
      opt.value = `${c.lat},${c.lon}`;
      opt.textContent = `${c.city}, ${c.country}`;
      citySelect.appendChild(opt);
    });
  }

  function showStatus(msg, err=false){
    statusEl.textContent = msg;
    statusEl.style.color = err ? '#900' : '#222';
  }

  function mapWeatherToImage(code){
    const map = {
      'clear': 'clear.png',
      'pcloudy': 'pcloudy.png',
      'mcloudy': 'mcloudy.png',
      'cloudy': 'cloudy.png',
      'humid': 'humid.png',
      'lightrain': 'lightrain.png',
      'oshower': 'oshower.png',
      'ishower': 'ishower.png',
      'lightsnow': 'lightsnow.png',
      'snow': 'snow.png',
      'rainsnow': 'rainsnow.png',
      'tsrain': 'tsrain.png',
      'tstorm': 'tstorm.png',
      'windy': 'windy.png',
      'fog': 'fog.png',
      'rain': 'rain.png'
    };
    return map[code] || 'clear.png';
  }

  function renderForecast(cityLabel, data){
    forecastEl.innerHTML = '';
    const header = document.createElement('h2');
    header.textContent = `7-day forecast — ${cityLabel}`;
    forecastEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'cards';

    const days = data.dataseries.slice(0, 7);

    days.forEach(day => {
      const card = document.createElement('article');
      card.className = 'card';

      const d = document.createElement('div');
      d.className = 'date';
      const ds = day.date.toString();
      const y = ds.slice(0,4), m = ds.slice(4,6), dday = ds.slice(6,8);
      d.textContent = `${y}-${m}-${dday}`;

      const img = document.createElement('img');
      img.alt = day.weather;
      img.src = 'images/' + mapWeatherToImage(day.weather);
      img.width = 64;
      img.height = 64;

      const we = document.createElement('div');
      we.className = 'weather';
      we.innerHTML = `<strong>${day.weather}</strong>`;

      const temp = document.createElement('div');
      temp.className = 'temp';
      let tempText = '';
      if (day.temp2m) {
        tempText = `${day.temp2m.min}°C — ${day.temp2m.max}°C`;
      } else {
        tempText = 'N/A';
      }
      temp.textContent = tempText;

      const precip = document.createElement('div');
      precip.className = 'precip';
      precip.textContent = `Precip: ${day.prec_type || 'N/A'}`;

      card.appendChild(d);
      card.appendChild(img);
      card.appendChild(we);
      card.appendChild(temp);
      card.appendChild(precip);

      grid.appendChild(card);
    });

    forecastEl.appendChild(grid);
  }

  async function fetchForecast(lat, lon){
    // Correct 7Timer endpoint (valid JSON + daily forecast)
    const url = `https://www.7timer.info/bin/civillight.php?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(lat)}&ac=0&unit=metric&output=json`;

    showStatus('Loading forecast...');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data;
    } catch(err){
      throw err;
    }
  }

  // Load city list
  try {
    const cities = await loadCities();
    populateCities(cities);
    showStatus('Select a city and click Get Forecast');
  } catch(err){
    showStatus('Failed to load city list', true);
    console.error(err);
  }

  lookupBtn.addEventListener('click', async ()=>{
    const val = citySelect.value;
    if (!val) return;
    const [lat, lon] = val.split(',');
    const label = citySelect.options[citySelect.selectedIndex].text;

    try {
      showStatus('Fetching forecast for ' + label + ' ...');
      const data = await fetchForecast(lat, lon);
      if (data && data.dataseries && data.dataseries.length>0){
        renderForecast(label, data);
        showStatus('Forecast loaded');
      } else {
        showStatus('No forecast data returned', true);
      }
    } catch(err){
      console.error(err);
      showStatus('Failed to fetch forecast: ' + err.message, true);
    }
  });

})();

