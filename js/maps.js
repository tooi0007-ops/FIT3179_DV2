const stateChoroplethMap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 460,
  projection: { type: "equalEarth" },
  data: mapData,
  transform: [{
    lookup: "properties.state",
    from: {
      data: { url: `${dataPath}state_recovery_2019_2025.csv` },
      key: "state",
      fields: ["recovery_percent", "passengers_2019", "passengers_2025"],
    },
  }],
  mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 1.5 },
  encoding: {
    color: {
      field: "recovery_percent",
      type: "quantitative",
      title: "Change from 2019 (%)",
      scale: {domain: [-20, 0, 20], range: ["#c85a5a", "#d6e0df", "#167988"], clamp: true},
      legend: { orient: "bottom", direction: "horizontal", format: ".0f" },
    },
    tooltip: [
      { field: "properties.state", type: "nominal", title: "State" },
      { field: "passengers_2019", type: "quantitative", title: "2019 movements", format: "," },
      { field: "passengers_2025", type: "quantitative", title: "2025 movements", format: "," },
      { field: "recovery_percent", type: "quantitative", title: "Change (%)", format: ".1f" },
    ],
  },
  config,
};

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

stateChoroplethMap.layer = [
  {
    data: mapData,
    transform: stateChoroplethMap.transform,
    mark: stateChoroplethMap.mark,
    encoding: stateChoroplethMap.encoding,
  },
  {
    data: stateLabels,
    mark: { type: "text", fontSize: 11, fontWeight: 700, color: "#17202f", opacity: 0.82 },
    encoding: {
      longitude: { field: "longitude", type: "quantitative" },
      latitude: { field: "latitude", type: "quantitative" },
      text: { field: "label", type: "nominal" },
    },
  },
];
delete stateChoroplethMap.data;
delete stateChoroplethMap.transform;
delete stateChoroplethMap.mark;
delete stateChoroplethMap.encoding;

const proportionalSymbolMap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 480,
  projection: { type: "equalEarth" },
  layer: [
    {
      data: mapData,
      mark: { type: "geoshape", fill: "#e8e5dc", stroke: "#c6c0b5", strokeWidth: 0.8 },
    },
    {
      data: { url: `${dataPath}airport_2025.csv` },
      transform: [{ filter: "datum.match_status !== 'unmatched' && datum.longitude >= 110 && datum.longitude <= 155 && datum.latitude >= -45 && datum.latitude <= -10" }],
      mark: { type: "circle", opacity: 0.72, stroke: "#07545b", strokeWidth: 0.5 },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        size: { field: "total_passengers", type: "quantitative", title: "Passenger movements", scale: { range: [12, 2600] }, legend: { format: "~s" } },
        color: { value: "#0d7c86" },
        tooltip: [
          { field: "airport_name", type: "nominal", title: "Airport" },
          { field: "state", type: "nominal", title: "State" },
          { field: "total_passengers", type: "quantitative", title: "Passenger movements", format: "," },
          { field: "total_aircraft_movements", type: "quantitative", title: "Aircraft movements", format: "," },
        ],
      },
    },
  ],
  config,
};

const domesticRouteFlowMap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 460,
  projection: { type: "equalEarth" },
  layer: [
    {
      data: mapData,
      mark: { type: "geoshape", fill: "#e8e5dc", stroke: "#c6c0b5", strokeWidth: 0.8 },
    },
    {
      data: { url: `${dataPath}route_flow_points_top10_2025.csv` },
      mark: { type: "line", interpolate: "basis", color: "#df7f40", opacity: 0.55 },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        detail: { field: "route", type: "nominal" },
        order: { field: "point_order", type: "ordinal" },
        size: { field: "passengers_2025", type: "quantitative", legend: null, scale: { range: [1.5, 10] } },
        tooltip: [
          { field: "route", type: "nominal", title: "City-pair route" },
          { field: "passengers_2025", type: "quantitative", title: "2025 passenger movements", format: "," },
        ],
      },
    },
    {
      data: { url: `${dataPath}route_flow_points_top10_2025.csv` },
      transform: [{ filter: "datum.route === 'Melbourne - Sydney'" }],
      mark: { type: "line", interpolate: "basis", color: "#a94f21", opacity: 1 },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        detail: { field: "route", type: "nominal" },
        order: { field: "point_order", type: "ordinal" },
        size: { field: "passengers_2025", type: "quantitative", legend: null, scale: { range: [1.5, 10] } },
      },
    },
    {
      data: { url: `${dataPath}route_flow_points_top10_2025.csv` },
      transform: [{ filter: "datum.point_order != 1" }],
      mark: { type: "circle", filled: true, color: "#f8f5ed", size: 95, stroke: "#07545b", strokeWidth: 1.8 },
      encoding: {
        longitude: { field: "longitude", type: "quantitative" },
        latitude: { field: "latitude", type: "quantitative" },
        tooltip: [
          { field: "route", type: "nominal", title: "Route serving this airport" },
          { field: "passengers_2025", type: "quantitative", title: "2025 passenger movements", format: "," },
        ],
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
      mark: { type: "text", fontSize: 10.5, fontWeight: 700, color: "#344454" },
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
vegaEmbed("#proportional-symbol-map", proportionalSymbolMap, embedOptions);
vegaEmbed("#domestic-route-flow-map", domesticRouteFlowMap, embedOptions);
