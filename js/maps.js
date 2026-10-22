const stateLabels = {
  values: [
    { state: "Western Australia", longitude: 121.5, latitude: -26.5, label: "WA" },
    { state: "Northern Territory", longitude: 133.0, latitude: -19.7, label: "NT" },
    { state: "South Australia", longitude: 135.5, latitude: -30.5, label: "SA" },
    { state: "Queensland", longitude: 145.5, latitude: -23.0, label: "QLD" },
    { state: "New South Wales", longitude: 147.2, latitude: -32.5, label: "NSW" },
    { state: "Victoria", longitude: 144.5, latitude: -37.1, label: "VIC" },
    { state: "Tasmania", longitude: 146.8, latitude: -42.0, label: "TAS" },
    { state: "Australian Capital Territory", longitude: 149.1, latitude: -35.35, label: "ACT" },
  ],
};

const stateChoroplethMap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 520,
  projection: { type: "mercator" },
  layer: [
    {
      data: mapData,
      params: [{
        name: "stateHover",
        select: { type: "point", fields: ["state"], on: "pointerover", clear: "pointerout" },
      }],
      transform: [{ calculate: "datum.properties.state", as: "state" }, {
        lookup: "state",
        from: {
          data: { url: `${dataPath}state_international_share_2025.csv` },
          key: "state",
          fields: ["international_share_percent", "international_passengers", "total_passengers"],
        },
      }],
      mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 1.5 },
      encoding: {
        color: {
          field: "international_share_percent",
          type: "quantitative",
          title: "International share (%)",
          scale: { domain: [0, 40], range: ["#e7f2ef", "#076a80"], clamp: true },
          legend: {
            orient: "bottom",
            direction: "horizontal",
            values: [0, 10, 20, 30, 40],
            labelExpr: "datum.value + '%'",
            title: "International share",
          },
        },
        opacity: { condition: { param: "stateHover", empty: true, value: 1 }, value: 0.18 },
        strokeWidth: { condition: { param: "stateHover", empty: false, value: 2.5 }, value: 1.5 },
        tooltip: [
          { field: "state", type: "nominal", title: "State" },
          { field: "total_passengers", type: "quantitative", title: "Total movements", format: "," },
          { field: "international_passengers", type: "quantitative", title: "International movements", format: "," },
          { field: "international_share_percent", type: "quantitative", title: "International share (%)", format: ".1f" },
        ],
      },
    },
    {
      data: { values: stateLabels.values.filter((datum) => datum.label !== "ACT") },
      mark: { type: "text", fontSize: 11, fontWeight: 700, color: "#17202f", opacity: 0.82, interactive: false },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
    {
      data: { values: [{ type: "Feature", geometry: { type: "LineString", coordinates: [[149.1, -35.35], [151.0, -36.2]] } }] },
      mark: { type: "geoshape", filled: false, stroke: "#344454", strokeWidth: 1.25, interactive: false },
    },
    {
      data: { values: [{ longitude: 151.25, latitude: -36.25, label: "ACT" }] },
      mark: { type: "text", align: "left", fontSize: 12, fontWeight: 700, color: "#17202f", interactive: false },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
  ],
  config,
};

const stateZoomBounds = {
  "New South Wales": [141, 154, -38, -28],
  Victoria: [140.5, 150, -39.6, -33.6],
  Queensland: [137.5, 154, -29.5, -9],
  "Western Australia": [112.5, 129.5, -35.5, -13.5],
  "South Australia": [128.5, 141.5, -38.5, -25.5],
  Tasmania: [143.3, 149, -44, -39],
  "Northern Territory": [128.5, 138.5, -26.5, -10.5],
  "Australian Capital Territory": [147.5, 150.5, -36.5, -34.5],
};

function stateProjection(state) {
  if (!state) return { type: "mercator" };
  const [west, east, south, north] = stateZoomBounds[state];
  const mercatorY = (latitude) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
  const ySouth = mercatorY(south);
  const yNorth = mercatorY(north);
  const centerLatitude = (2 * Math.atan(Math.exp((ySouth + yNorth) / 2)) - Math.PI / 2) * 180 / Math.PI;
  const width = Math.max(260, document.getElementById("proportional-symbol-map").clientWidth - 110);
  const scale = Math.min((width - 70) / ((east - west) * Math.PI / 180), 455 / (yNorth - ySouth));
  return { type: "mercator", center: [(west + east) / 2, centerLatitude], scale };
}

function makeProportionalSymbolMap(selectedState = null) {
  return {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 530,
  projection: stateProjection(selectedState),
  layer: [
    {
      data: mapData,
      mark: { type: "geoshape", fill: "#e8e5dc", stroke: "#c6c0b5", strokeWidth: 0.8 },
    },
    {
      data: { url: `${dataPath}airport_2025.csv` },
      transform: [
        { filter: "datum.match_status !== 'unmatched' && datum.longitude >= 110 && datum.longitude <= 155 && datum.latitude >= -45 && datum.latitude <= -10" },
        ...(selectedState ? [{ filter: { field: "state", equal: selectedState } }] : []),
      ],
      mark: { type: "circle", stroke: "#07545b", strokeWidth: 0.7 },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        size: { field: "total_passengers", type: "quantitative", title: "Passenger movements", scale: { range: [12, 2600] }, legend: { format: "~s" } },
        color: { value: "#0d7c86" },
        opacity: { value: 0.78 },
        tooltip: [
          { field: "airport_name", type: "nominal", title: "Airport" },
          { field: "state", type: "nominal", title: "State" },
          { field: "total_passengers", type: "quantitative", title: "Passenger movements", format: "," },
          { field: "total_aircraft_movements", type: "quantitative", title: "Aircraft movements", format: "," },
        ],
      },
    },
    {
      data: selectedState ? { values: stateLabels.values.filter((datum) => datum.state === selectedState) } : stateLabels,
      mark: {
        type: "text",
        fontSize: 11,
        fontWeight: 700,
        color: "#17202f",
        opacity: 0.82,
        interactive: false,
      },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
  ],
  config,
  };
}

const domesticRouteFlowMap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 610,
  projection: { type: "mercator" },
  layer: [
    {
      data: mapData,
      mark: { type: "geoshape", fill: "#e8e5dc", stroke: "#c6c0b5", strokeWidth: 0.8 },
    },
    {
      data: { url: `${dataPath}route_flow_lines_top10_2025.geojson`, format: { type: "json", property: "features" } },
      mark: { type: "geoshape", filled: false, stroke: "#d86f34", interactive: false },
      encoding: {
        strokeWidth: { field: "properties.passengers_2025", type: "quantitative", legend: null, scale: { range: [2.5, 10] } },
        opacity: { condition: { param: "routeHover", empty: true, value: 0.95 }, value: 0.16 },
      },
    },
    {
      data: { url: `${dataPath}route_flow_lines_top10_2025.geojson`, format: { type: "json", property: "features" } },
      params: [{
        name: "routeHover",
        select: { type: "point", fields: ["properties.route"], on: "pointerover", clear: "pointerout" },
      }],
      // Keep hover close to the visible route while covering its full path.
      mark: { type: "geoshape", filled: false, stroke: "#d86f34", strokeWidth: 12, opacity: 0.005 },
      encoding: {
        tooltip: [
          { field: "properties.route", type: "nominal", title: "Route" },
          { field: "properties.passengers_2025", type: "quantitative", title: "2025 passenger movements", format: "," },
        ],
      },
    },
    {
      data: { url: `${dataPath}route_flow_points_top10_2025.csv` },
      transform: [{ filter: "datum.point_order != 1" }],
      mark: { type: "circle", filled: true, color: "#f8f5ed", size: 95, stroke: "#07545b", strokeWidth: 1.8, interactive: false },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
      },
    },
    {
      data: {
        values: [
          { label: "Perth", longitude: 115.97, latitude: -30.55 },
          { label: "Adelaide", longitude: 138.54, latitude: -33.95 },
          { label: "Melbourne", longitude: 144.85, latitude: -36.85 },
          { label: "Hobart", longitude: 147.51, latitude: -44.05 },
          { label: "Sydney", longitude: 151.17, latitude: -32.95 },
          { label: "Brisbane", longitude: 153.12, latitude: -26.60 },
          { label: "Gold Coast", longitude: 153.51, latitude: -29.00 },
        ],
      },
      mark: { type: "text", fontSize: 10.5, fontWeight: 700, color: "#344454", interactive: false },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
  ],
  config,
};

vegaEmbed("#state-choropleth-map", stateChoroplethMap, embedOptions);
let proportionalMapRender = Promise.resolve();
let selectedProportionalState = null;
function showProportionalSymbolMap(state = null) {
  selectedProportionalState = state;
  document.querySelectorAll(".state-zoom button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.state === (state || "")));
  });
  proportionalMapRender = proportionalMapRender.catch(() => {}).then(() =>
    vegaEmbed("#proportional-symbol-map", makeProportionalSymbolMap(state), embedOptions)
  );
}
document.querySelectorAll(".state-zoom button").forEach((button) => {
  button.addEventListener("click", () => showProportionalSymbolMap(button.dataset.state || null));
});
let mapResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(mapResizeTimer);
  mapResizeTimer = setTimeout(() => showProportionalSymbolMap(selectedProportionalState), 180);
});
showProportionalSymbolMap();
vegaEmbed("#domestic-route-flow-map", domesticRouteFlowMap, embedOptions);
