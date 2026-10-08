const airportRankBumpChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 365,
  title: "Airport passenger-movement rank, 2019–2025",
  layer: [
    {
      data: { url: `${dataPath}airport_bump_2015_2025.csv` },
      transform: [{ filter: "datum.year >= 2019 && datum.airport_name !== 'SUNSHINE COAST'" }],
      mark: { type: "line", color: "#8d98a5", opacity: 0.8, strokeWidth: 1.8, point: { filled: true, size: 28 } },
      encoding: {
        x: { field: "year", type: "ordinal", title: "Year", axis: { labelAngle: 0 } },
        y: { field: "rank", type: "quantitative", title: "National rank (1 = largest)", scale: { domain: [16, 1] }, axis: { tickCount: 8 } },
        detail: { field: "airport_name" },
        tooltip: [
          { field: "airport_name", type: "nominal", title: "Airport" },
          { field: "year", type: "ordinal", title: "Year" },
          { field: "rank", type: "quantitative", title: "Rank" },
          { field: "total_passengers", type: "quantitative", title: "Passenger movements", format: "," },
        ],
      },
    },
    {
      data: { url: `${dataPath}airport_bump_2015_2025.csv` },
      transform: [{ filter: "datum.year >= 2019 && datum.airport_name === 'SUNSHINE COAST'" }],
      mark: { type: "line", color: "#0d7c86", strokeWidth: 3, point: { filled: true, size: 52 } },
      encoding: {
        x: { field: "year", type: "ordinal" },
        y: { field: "rank", type: "quantitative", scale: { domain: [16, 1] } },
        detail: { field: "airport_name" },
        tooltip: [
          { field: "airport_name", type: "nominal", title: "Airport" },
          { field: "year", type: "ordinal", title: "Year" },
          { field: "rank", type: "quantitative", title: "Rank" },
          { field: "total_passengers", type: "quantitative", title: "Passenger movements", format: "," },
        ],
      },
    },
  ], config,
};

const airportConnectedDotPlot = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 365,
  data: { url: `${dataPath}airport_compare_top15_2019_2025.csv` },
  title: "Large-airport passenger movements: 2019 and 2025",
  layer: [
    { mark: { type: "rule", color: "#9ca7a4", strokeWidth: 2 }, encoding: {
      y: { field: "airport_name", type: "nominal", sort: { field: "passengers_2025", order: "descending" }, title: null },
      x: { field: "passengers_2019", type: "quantitative", title: "Passenger movements", axis: { format: "~s" } },
      x2: { field: "passengers_2025" },
      tooltip: [{ field: "airport_name", title: "Airport" }, { field: "passengers_2019", title: "2019", format: "," }, { field: "passengers_2025", title: "2025", format: "," }, { field: "change_percent", title: "Change (%)", format: ".1f" }],
    }},
    { mark: { type: "point", filled: true, size: 76, stroke: "#ffffff", strokeWidth: 1 }, encoding: {
      y: { field: "airport_name", type: "nominal", sort: { field: "passengers_2025", order: "descending" }, title: null },
      x: { field: "passengers_2019", type: "quantitative" },
      color: { datum: "2019", type: "nominal", title: "Year", scale: { domain: ["2019", "2025"], range: ["#2563a6", "#e4572e"] }, legend: { orient: "top", direction: "horizontal" } },
    }},
    { mark: { type: "point", filled: true, size: 76, stroke: "#ffffff", strokeWidth: 1 }, encoding: {
      y: { field: "airport_name", type: "nominal", sort: { field: "passengers_2025", order: "descending" }, title: null },
      x: { field: "passengers_2025", type: "quantitative" },
      color: { datum: "2025", type: "nominal", title: "Year", scale: { domain: ["2019", "2025"], range: ["#2563a6", "#e4572e"] }, legend: { orient: "top", direction: "horizontal" } },
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
    x: { field: "signed_passengers", type: "quantitative", title: "Passenger movements", axis: { format: "~s" } },
    color: { field: "travel_label", type: "nominal", title: null, scale: { domain: ["Domestic", "International"], range: ["#0d7c86", "#c85a5a"] } },
    tooltip: [{ field: "airport_name", title: "Airport" }, { field: "travel_label", title: "Type" }, { field: "passengers", title: "Passenger movements", format: "," }],
  }, config,
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

vegaEmbed("#airport-rank-bump-chart", airportRankBumpChart, embedOptions);
vegaEmbed("#airport-connected-dot-plot", airportConnectedDotPlot, embedOptions);
vegaEmbed("#airport-butterfly-chart", airportButterflyChart, embedOptions);
vegaEmbed("#airport-hierarchy-treemap", airportHierarchyTreemap, embedOptions);
