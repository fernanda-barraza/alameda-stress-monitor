import { useEffect, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const scoreBands = [
  { label: "80–100", name: "Very high", color: "#a50026" },
  { label: "60–79", name: "High", color: "#f46d43" },
  { label: "40–59", name: "Moderate", color: "#ffd457" },
  { label: "20–39", name: "Lower", color: "#66bd63" },
  { label: "0–19", name: "Low", color: "#006837" },
];

const factorLabels = [
  ["Population Density", "Population density"],
  ["Housing Density", "Housing density"],
  ["Avg Max Temp", "Average maximum temperature"],
  ["Avg PM2.5 Levels", "PM2.5 levels"],
];

function getStressColor(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "#4b4555";
  if (score >= 80) return "#a50026";
  if (score >= 60) return "#f46d43";
  if (score >= 40) return "#ffd457";
  if (score >= 20) return "#66bd63";
  return "#006837";
}

function getScoreLabel(value) {
  const score = Number(value);
  if (score >= 80) return "Elevated stress";
  if (score >= 60) return "High stress";
  if (score >= 40) return "Moderate stress";
  if (score >= 20) return "Lower stress";
  return "Low stress";
}

function scoreValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : "—";
}

function getTractInsight(properties) {
  const factors = factorLabels
    .map(([key, label]) => ({ label, value: Number(properties[key]) }))
    .filter((factor) => Number.isFinite(factor.value));

  if (!factors.length) return "Factor-level data are unavailable for this tract.";

  const highest = [...factors].sort((a, b) => b.value - a.value)[0];
  const score = Number(properties["Stress Score"]);
  const level = score >= 60 ? "A comparatively elevated" : score >= 40 ? "A balanced" : "A comparatively lower";

  return `${level} overall score is most influenced by ${highest.label.toLowerCase()}. Use this view to compare relative conditions across Alameda County.`;
}

function App() {
  const [tracts, setTracts] = useState([]);
  const [minScore, setMinScore] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selectedLayerRef = useRef(null);
  const hoveredLayerRef = useRef(null);

  const fetchTracts = (score = "") => {
    setIsLoading(true);
    const url = score
      ? `${API_URL}/api/tracts?minScore=${encodeURIComponent(score)}`
      : `${API_URL}/api/tracts`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load tracts");
        return response.json();
      })
      .then((data) => {
        selectedLayerRef.current = null;
        hoveredLayerRef.current = null;
        setTracts(data);
      })
      .catch((error) => console.error("Error fetching tracts:", error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTracts();
  }, []);

  const geojson = {
    type: "FeatureCollection",
    features: tracts.map((tract) => ({
      type: "Feature",
      geometry: tract.geometry,
      properties: {
        GEOID: tract.GEOID,
        Tract: tract.Tract,
        "Stress Score": tract["Stress Score"],
        "Population Density": tract["Population Density"],
        "Housing Density": tract["Housing Density"],
        "Avg Max Temp": tract["Avg Max Temp"],
        "Avg PM2.5 Levels": tract["Avg PM2.5 Levels"],
      },
    })),
  };

  const onEachFeature = (feature, layer) => {
    const { properties } = feature;
    const score = Number(properties["Stress Score"]);
    const factors = factorLabels
      .map(([key, label]) => `
        <div class="popup-factor">
          <div><span>${label}</span><strong>${scoreValue(properties[key])}</strong></div>
          <span class="popup-meter"><i style="width: ${Math.min(100, Math.max(0, Number(properties[key]) || 0))}%; background: ${getStressColor(properties[key])}"></i></span>
        </div>`)
      .join("");

    layer.bindPopup(`
      <article class="tract-popup">
        <p class="popup-eyebrow">Census tract ${properties.Tract || "—"}</p>
        <div class="popup-score-row">
          <strong>${scoreValue(score)}</strong>
          <span style="background:${getStressColor(score)}">${getScoreLabel(score)}</span>
        </div>
        <p class="popup-score-label">Infrastructure stress score</p>
        <div class="popup-factors">${factors}</div>
        <div class="popup-insight"><b>Tract readout</b><p>${getTractInsight(properties)}</p></div>
      </article>
    `, { maxWidth: 330, minWidth: 290 });

    const baseStyle = { fillOpacity: 0.68, weight: 0.75, color: "#0e0b15" };
    const activeStyle = { fillOpacity: 1, weight: 1.8, color: "#f1eaff" };

    layer.on({
      mouseover: (event) => {
        // Leaflet can occasionally skip a mouseout when the pointer crosses
        // adjacent polygons quickly, so always clear the prior hover first.
        const previousHover = hoveredLayerRef.current;
        if (previousHover && previousHover !== event.target && previousHover !== selectedLayerRef.current) {
          previousHover.setStyle(baseStyle);
        }
        hoveredLayerRef.current = event.target;
        event.target.setStyle(activeStyle);
        event.target.bringToFront();
      },
      mouseout: (event) => {
        if (hoveredLayerRef.current === event.target) hoveredLayerRef.current = null;
        if (selectedLayerRef.current !== event.target) event.target.setStyle(baseStyle);
      },
      click: (event) => {
        if (selectedLayerRef.current && selectedLayerRef.current !== event.target) {
          selectedLayerRef.current.setStyle(baseStyle);
        }
        selectedLayerRef.current = event.target;
        hoveredLayerRef.current = event.target;
        event.target.setStyle(activeStyle);
        event.target.bringToFront();
      },
      popupclose: (event) => {
        if (selectedLayerRef.current === event.target) {
          event.target.setStyle(baseStyle);
          selectedLayerRef.current = null;
          if (hoveredLayerRef.current === event.target) hoveredLayerRef.current = null;
        }
      },
    });
  };

  const applyFilter = (event) => {
    event.preventDefault();
    fetchTracts(minScore);
  };

  const resetFilter = () => {
    setMinScore("");
    fetchTracts();
  };

  return (
    <main className="app-shell">
      <header className="site-header">
        <h1>Alameda Infrastructure <em>Stress Monitor</em></h1>
        <p className="intro">This map visualizes a relative infrastructure stress score for every census tract in Alameda County. Each score combines four conditions that can compound pressure on communities and public infrastructure: population density, housing density, average maximum temperature, and PM2.5 air pollution. The factors are normalized to a shared 0–100 scale and combined into one index, making it easier to compare patterns across the county. Green tracts have lower combined relative stress, while yellow, orange, and red tracts indicate progressively higher stress.</p>
      </header>

      <section className="toolbar" aria-label="Map filters">
        <form onSubmit={applyFilter} className="filter-form">
          <label htmlFor="minScore">Show tracts at or above</label>
          <input id="minScore" type="number" min="0" max="100" value={minScore} onChange={(event) => setMinScore(event.target.value)} placeholder="Any score" />
          <button type="submit">Apply filter</button>
          <button type="button" className="quiet-button" onClick={resetFilter}>Reset</button>
        </form>
        <p className="tract-count"><strong>{isLoading ? "…" : tracts.length}</strong> tracts in view</p>
      </section>

      <section className="map-layout">
        <div className="map-frame">
          {tracts.length > 0 && (
            <MapContainer center={[37.6, -122.1]} zoom={10} scrollWheelZoom className="map">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON key={tracts.map((tract) => tract.GEOID).join("-")} data={geojson} style={(feature) => ({ color: "#0e0b15", weight: 0.75, fillColor: getStressColor(feature.properties["Stress Score"]), fillOpacity: 0.68 })} onEachFeature={onEachFeature} />
            </MapContainer>
          )}
          {!isLoading && tracts.length === 0 && <p className="empty-state">No tracts match that score. Try a lower value.</p>}
        </div>

        <aside className="legend" aria-label="Stress score legend">
          <div className="legend-heading">
            <div><p className="eyebrow">Map key</p><h2>Stress score</h2></div>
            <span className="info-tip" tabIndex="0" aria-label="About the stress score" data-tooltip="The score combines population density, housing density, average maximum temperature, and PM2.5. It is relative: a higher number indicates greater combined stress among the tracts shown.">i</span>
          </div>
          <p className="legend-description">A relative 0–100 index. Color moves from green (lower combined stress) to red (higher combined stress).</p>
          <div className="legend-scale">
            {scoreBands.map((band) => <div className="legend-row" key={band.label}><i style={{ backgroundColor: band.color }}></i><span>{band.label}</span><small>{band.name}</small></div>)}
          </div>
          <div className="legend-footer">Select a tract to keep it highlighted and see its factor-level readout.</div>
        </aside>
      </section>

    </main>
  );
}

export default App;
