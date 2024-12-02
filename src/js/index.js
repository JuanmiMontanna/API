const provincesSelect = document.getElementById("provinces");
const provinces_URL = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/Provincias/";

const municipalitiesSelect = document.getElementById("municipalities");
const municipalities_URL = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/MunicipiosPorProvincia/";

const gasStationsElement = document.getElementById("gasStations");
const gasStationsMunicipality_URL = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipio/";

const fuelType = document.getElementById("fuelType");

const openCheckboxElement = document.getElementById("openCheckbox");

let selectedMunicipality = null;
let selectedFuelType = null;

async function request(urlProvinces) {
  let response = await fetch(urlProvinces);
  if (!response.ok) {
    throw new Error(`Error de red: ${response.statusText}`);
  }
  let provinces = await response.json();

  provincesSelect.innerHTML = "<option disabled selected>Choose a province</option>";

  provinces.forEach(province => {
    let option = document.createElement("option");
    option.value = province.IDPovincia;
    option.textContent = province.Provincia.charAt(0).toUpperCase() + province.Provincia.slice(1).toLowerCase();
    provincesSelect.appendChild(option);
  });
}

async function fillOutMunicipalities(urlMunicipalities) {
  let response = await fetch(urlMunicipalities);
  if (!response.ok) {
    throw new Error(`Error de red: ${response.statusText}`);
  }
  let municipalities = await response.json();

  municipalitiesSelect.innerHTML = "<option disabled selected>Choose a municipality</option>";

  municipalities.forEach(municipality => {
    let option = document.createElement("option");
    option.value = municipality.IDMunicipio;
    option.textContent = municipality.Municipio;
    municipalitiesSelect.appendChild(option);
  });
}

async function showStations(urlStations) {
  let response = await fetch(urlStations);
  if (!response.ok) {
    throw new Error(`Error de red: ${response.statusText}`);
  }
  let stations = await response.json();

  gasStationsElement.innerHTML = "";

  if (openCheckbox.checked) {
    stations.ListaEESSPrecio = getGasStations(stations.ListaEESSPrecio);
  }

  stations.ListaEESSPrecio.forEach(station => {
    const fuelPriceKey = `Precio ${selectedFuelType}`;
    const fuelPrice = station[fuelPriceKey];

    if (parseFloat(fuelPrice) > 0) {
      let div = document.createElement("div");
      div.classList.add("gasStation");

      let p = document.createElement("p");
      p.textContent = `Dirección: ${station.Dirección}`;

      let p2 = document.createElement("p");
      p2.textContent = `Municipio: ${station.Municipio}, Provincia: ${station.Provincia.charAt(0).toUpperCase() + station.Provincia.slice(1).toLowerCase()}`;

      let p3 = document.createElement("p");
      p3.textContent = `Horario: ${station.Horario} €`;

      let p4 = document.createElement("p");
      p4.textContent = `Precio: ${selectedFuelType}: ${fuelPrice} €`;

      div.append(p, p2, p3);
      gasStationsElement.appendChild(div);
    }
  });
}

function getGasStations(stations) {
  return stations.filter(station => openStation(station.Horario));
}

function openStation(schedule) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (schedule.includes("L-D: 24H")) return true;

  const daysMap = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };
  const hours = schedule.split(";");

  for (const hour of hours) {
    const [days, timeRange] = hour.split(": ");
    const [startDay, endDay] = days.split("-").map((d) => daysMap[d.trim()]);
    const [start, end] = timeRange
      .split("-")
      .map((t) => t.split(":").reduce((h, m) => h * 60 + Number(m)));

    if (
      ((currentDay >= startDay && currentDay <= endDay) ||
        (endDay < startDay &&
          (currentDay >= startDay || currentDay <= endDay))) &&
      ((currentTime >= start && currentTime <= end) ||
        (end < start && (currentTime >= start || currentTime <= end)))
    ) {
      return true;
    }
  }
  return false;
}

function updateStations() {
  if (selectedMunicipality && selectedFuelType) {
    const url = `${gasStationsMunicipality_URL}${selectedMunicipality}`;
    showStations(url);
  }
}

provincesSelect.addEventListener("change", () => {
  const selectedID = provincesSelect.value;
  fillOutMunicipalities(municipalities_URL + selectedID);
});

municipalitiesSelect.addEventListener("change", () => {
  selectedMunicipality = municipalitiesSelect.value;
  updateStations();
});

fuelType.addEventListener("change", () => {
  selectedFuelType = fuelType.options[fuelType.selectedIndex].text;
  updateStations();
});

openCheckboxElement.addEventListener('change', updateStations);

request(provinces_URL);
