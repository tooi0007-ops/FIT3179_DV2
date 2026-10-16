const airportRankBumpChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 455,
  data: { url: `${dataPath}airport_bump_2015_2025.csv` },
  title: "Passenger-movement rank among Australia's largest airports, 2015–2025",
  layer: [
    {
      mark: { type: "line", opacity: 0.82, strokeWidth: 2, point: { filled: true, size: 34 } },
      encoding: {
        x: { field: "year", type: "quantitative", title: "Year", scale: { domain: [2015, 2026.8] }, axis: { values: [2015, 2017, 2019, 2021, 2023, 2025], format: "d" } },
        y: { field: "rank", type: "quantitative", title: "National rank (1 = largest)", scale: { domain: [16.5, 0.5] }, axis: { values: [1, 3, 5, 7, 9, 11, 13, 15] } },
        detail: { field: "airport_name", type: "nominal" },
        color: { condition: { test: "datum.airport_name === 'SUNSHINE COAST'", value: "#0d7c86" }, value: "#8d98a5", legend: null },
        tooltip: [
          { field: "airport_name", type: "nominal", title: "Airport" },
          { field: "year", type: "quantitative", title: "Year", format: "d" },
          { field: "rank", type: "quantitative", title: "Rank" },
          { field: "total_passengers", type: "quantitative", title: "Passenger movements", format: "," },
        ],
      },
    },
    {
      transform: [{ filter: "datum.year === 2025" }],
      mark: { type: "text", align: "left", baseline: "middle", dx: 8, fontSize: 10.5, fontWeight: 700 },
      encoding: {
        x: { field: "year", type: "quantitative", scale: { domain: [2015, 2026.8] } },
        y: { field: "rank", type: "quantitative", scale: { domain: [16.5, 0.5] } },
        text: { field: "airport_name", type: "nominal" },
        color: { condition: { test: "datum.airport_name === 'SUNSHINE COAST'", value: "#0d7c86" }, value: "#4e5968", legend: null },
      },
    },
    {
      data: {
        values: [{ year: 2020, rank: 16, label: "2020: rank fell to 16" }],
      },
      mark: { type: "text", align: "left", baseline: "bottom", dx: 10, dy: -10, fontSize: 11, fontWeight: 700, color: "#0d7c86" },
      encoding: {
        x: { field: "year", type: "quantitative", scale: { domain: [2015, 2026.8] } },
        y: { field: "rank", type: "quantitative", scale: { domain: [16.5, 0.5] } },
        text: { field: "label", type: "nominal" },
      },
    },
  ], config,
};

const airportConnectedDotPlot = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 365,
  data: { url: `${dataPath}airport_compare_top15_2019_2025.csv` },
  transform: [{ calculate: "0", as: "baseline_percent" }],
  title: ["Passenger change at major airports", "2019–2025 (%)"],
  encoding: {
    y: { field: "airport_name", type: "nominal", sort: { field: "change_percent", order: "descending" }, title: null },
  },
  layer: [
    { mark: { type: "rule", color: "#9ca7a4", strokeWidth: 2 }, encoding: {
      x: { field: "baseline_percent", type: "quantitative", title: "Change from 2019 (%)", scale: { domain: [-20, 40] } },
      x2: { field: "change_percent" },
      tooltip: [{ field: "airport_name", title: "Airport" }, { field: "passengers_2019", title: "2019", format: "," }, { field: "passengers_2025", title: "2025", format: "," }, { field: "change_percent", title: "Change (%)", format: ".1f" }],
    }},
    { mark: { type: "point", filled: true, size: 58, color: "#8d98a5", stroke: "#ffffff", strokeWidth: 1 }, encoding: {
      x: { field: "baseline_percent", type: "quantitative", scale: { domain: [-20, 40] } },
    }},
    { mark: { type: "point", filled: true, size: 76, stroke: "#ffffff", strokeWidth: 1 }, encoding: {
      x: { field: "change_percent", type: "quantitative", scale: { domain: [-20, 40] } },
      color: { condition: { test: "datum.change_percent >= 0", value: "#276f9e" }, value: "#c33f50", legend: null },
      tooltip: [{ field: "airport_name", title: "Airport" }, { field: "passengers_2019", title: "2019 movements", format: "," }, { field: "passengers_2025", title: "2025 movements", format: "," }, { field: "change_percent", title: "Change (%)", format: ".1f" }],
    }},
  ], config,
};

const airportButterflyChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 440,
  data: { url: `${dataPath}airport_2025_top10.csv` },
  transform: [
    { fold: ["domestic_passengers", "international_passengers"], as: ["travel_type", "passengers"] },
    { calculate: "datum.travel_type === 'domestic_passengers' ? -datum.passengers : datum.passengers", as: "signed_passengers" },
    { calculate: "datum.travel_type === 'domestic_passengers' ? 'Domestic' : 'International'", as: "travel_label" },
  ],
  title: "Domestic and international passenger movements, 2025",
  mark: { type: "bar" },
  encoding: {
    y: { field: "airport_name", type: "nominal", sort: { field: "rank", order: "ascending" }, title: null },
    x: {
      field: "signed_passengers",
      type: "quantitative",
      title: "Passenger movements (domestic ← | → international)",
      axis: { labelExpr: "format(abs(datum.value), '~s')" },
    },
    color: { field: "travel_label", type: "nominal", title: null, scale: { domain: ["Domestic", "International"], range: ["#0d7c86", "#E08B32"] } },
    tooltip: [{ field: "airport_name", title: "Airport" }, { field: "travel_label", title: "Type" }, { field: "passengers", title: "Passenger movements", format: "," }],
  }, config,
};

// The fold transform reshapes two share columns for a slope chart.
const stateAirportShareSlopeChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 390,
  data: { url: `${dataPath}state_airport_shares_2025.csv` },
  transform: [
    { fold: ["population_share", "passenger_share"], as: ["share_type", "share"] },
    { calculate: "datum.share_type === 'population_share' ? 'Population share' : 'Passenger share'", as: "share_label" },
  ],
  title: "State population share compared with passenger share, 2025",
  mark: { type: "line", point: { filled: true, size: 85 }, strokeWidth: 2.5 },
  encoding: {
    x: { field: "share_label", type: "ordinal", title: null, sort: ["Population share", "Passenger share"], axis: { labelAngle: 0 } },
    y: { field: "share", type: "quantitative", title: "National share (%)", scale: { domain: [0, 34] } },
    color: {
      field: "state_short",
      type: "nominal",
      title: "State or territory",
      scale: { scheme: "tableau10" },
    },
    detail: { field: "state", type: "nominal" },
    tooltip: [
      { field: "state", type: "nominal", title: "State or territory" },
      { field: "share_label", type: "nominal", title: "Measure" },
      { field: "share", type: "quantitative", title: "National share (%)", format: ".1f" },
      { field: "passenger_movements_per_resident", type: "quantitative", title: "Movements per resident", format: ".2f" },
    ],
  },
  config,
};

const airportHierarchyTreemap = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  width: 1180, height: 460, padding: 2, background: null,
  data: [{ name: "tree", url: `${dataPath}airport_treemap_2025.json?v=20260923`, transform: [
    { type: "stratify", key: "id", parentKey: "parent" },
    { type: "treemap", field: "value", sort: { field: "value", order: "descending" }, size: [{ signal: "width" }, { signal: "height" }], round: true, method: "squarify", paddingInner: 2, paddingOuter: 2, paddingTop: 24, as: ["x0", "y0", "x1", "y1", "depth", "children"] },
  ]}, {
    name: "stateLabels", source: "tree", transform: [{ type: "filter", expr: "datum.depth === 1" }],
  }, {
    name: "airportLabels", source: "tree", transform: [{ type: "filter", expr: "datum.depth === 2 && datum.x1 - datum.x0 > 85 && datum.y1 - datum.y0 > 22" }],
  }],
  scales: [{
    name: "stateColour", type: "ordinal", domain: ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"],
    range: ["#9f8e72", "#3f7891", "#6b7c4c", "#0d7c86", "#b56a3b", "#8d6f98", "#b94d57", "#486d9b"],
  }],
  marks: [
    { type: "rect", from: { data: "tree" }, encode: { enter: { x: { field: "x0" }, y: { field: "y0" }, x2: { field: "x1" }, y2: { field: "y1" }, stroke: { value: "#f6f3ec" }, strokeWidth: { value: 1 } }, update: { fill: { signal: "datum.depth === 1 ? '#e8e5dc' : datum.depth === 2 ? scale('stateColour', datum.state) : 'transparent'" } } } },
    { type: "text", from: { data: "stateLabels" }, encode: { enter: { x: { signal: "datum.x0 + 7" }, y: { signal: "datum.y0 + 5" }, text: { signal: "datum.label === 'Australian Capital Territory' ? 'ACT' : datum.label" }, fill: { value: "#17202f" }, fontSize: { value: 12 }, fontWeight: { value: 700 }, baseline: { value: "top" } } } },
    { type: "text", from: { data: "airportLabels" }, encode: { enter: { x: { signal: "datum.x0 + 6" }, y: { signal: "datum.y0 + 19" }, text: { field: "label" }, fill: { value: "white" }, fontSize: { value: 11 }, fontWeight: { value: 600 }, baseline: { value: "top" } } } },
  ],
  config: { text: { font: "Arial" } },
};

vegaEmbed("#airport-connected-dot-plot", airportConnectedDotPlot, embedOptions);
vegaEmbed("#airport-rank-bump-chart", airportRankBumpChart, embedOptions);
vegaEmbed("#airport-butterfly-chart", airportButterflyChart, embedOptions);
vegaEmbed("#state-airport-share-slope-chart", stateAirportShareSlopeChart, embedOptions);
vegaEmbed("#airport-hierarchy-treemap", airportHierarchyTreemap, embedOptions);
