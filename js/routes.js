const routeRecoveryHeatmap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", 
  height: 365,
  data: { url: `${dataPath}route_monthly_recovery_top10.csv` },
  layer: [
    { params: [{ name: "heatmapRouteHover", select: { type: "point", fields: ["route"], on: "pointerover", clear: "pointerout" } }],
      mark: { type: "rect", stroke: "#f6f3ec", strokeWidth: 1 }, encoding: {
      color: { field: "recovery_percent", type: "quantitative", title: "2023–25 vs 2015–19 (%)", scale: { domain: [-20, 0, 20], range: ["#c33f50", "#f2efe8", "#276f9e"], clamp: true }, legend: { orient: "bottom", direction: "horizontal", values: [-20, 0, 20], labelExpr: "datum.value > 0 ? '+' + datum.value + '%' : datum.value + '%'" } },
      tooltip: [{ field: "route", title: "Route" }, { field: "month", title: "Month" }, { field: "pre_covid_average", title: "2015–19 same-month average", format: "," }, { field: "recovery_average", title: "2023–25 same-month average", format: "," }, { field: "recovery_percent", title: "Relative change (%)", format: ".1f" }],
    } },
    { data: { values: [{ route: "Gold Coast - Melbourne", month: 11, note: "No complete published comparison" }] },
      mark: { type: "rect", color: "#d8dcd9", stroke: "#f6f3ec", strokeWidth: 1 },
      encoding: { tooltip: [{ field: "route", title: "Route" }, { field: "note", title: "November" }] },
    },
    { data: { values: [{ route: "Gold Coast - Melbourne", month: 11, label: "N/A" }] },
      mark: { type: "text", color: "#4d5963", fontSize: 10, fontWeight: 700, interactive: false },
      encoding: { text: { field: "label" } },
    },
  ],
  encoding: {
    x: { 
      field: "month", type: "ordinal", title: "Month", sort: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
      axis: { labelExpr: "['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][datum.value - 1]", labelAngle: 0 } 
    },
    y: { field: "route", type: "nominal", title: null, sort: { field: "passengers_2025", order: "descending" } },
    opacity: { condition: { param: "heatmapRouteHover", empty: true, value: 1 }, value: 0.22 },
  }, config,
};

const routeRemotenessChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 390,
  data: { url: `${dataPath}route_remoteness_index_1986_2026.csv` },
  params: [{ name: "routeMeasure", value: "Passenger trips", bind: { input: "select", name: "Compare: ", options: ["Passenger trips", "Flights"] } }],
  encoding: {
    x: { field: "year_end", type: "quantitative", title: "Financial year ending June", scale: { domain: [2010, 2027] }, axis: { format: "d", tickCount: 9 } },
    y: { field: "index_2019", type: "quantitative", title: "2018–19 = 100", scale: { domain: [0, 140] } },
    color: { field: "category", type: "nominal", title: "Route type", scale: { domain: ["Major cities", "Regional", "Remote"], range: ["#0d7c86", "#df7f40", "#7f66a5"] } },
  },
  layer: [
    { data: { values: [{ year_end: 2010, year_end_2: 2026.8, index_2019: 100 }] }, mark: { type: "rule", strokeDash: [5, 5], color: "#909b9b", interactive: false }, encoding: { x2: { field: "year_end_2" }, color: { value: "#909b9b" } } },
    { data: { values: [{ year_end: 2021, index_2019: 18, index_2019_2: 130 }] },
      mark: { type: "rule", strokeDash: [3, 4], stroke: "#aeb7b4", interactive: false },
      encoding: { y2: { field: "index_2019_2" }, color: { value: "#aeb7b4" } },
    },
    { data: { values: [{ year_end: 2021, index_2019: 131, label: "2020–21 slump" }] },
      mark: { type: "text", align: "center", baseline: "bottom", dy: -4, fontSize: 11, color: "#526071", interactive: false },
      encoding: { text: { field: "label" }, color: { value: "#526071" } },
    },
    {
      transform: [{ filter: "datum.year_end >= 2010 && datum.measure === routeMeasure" }],
      params: [{ name: "remotenessHover", select: { type: "point", fields: ["category"], on: "pointerover", clear: "pointerout" } }],
      mark: { type: "line", point: { filled: true, size: 42 }, strokeWidth: 3 },
      encoding: {
        detail: { field: "category", type: "nominal" },
        opacity: { condition: { param: "remotenessHover", empty: true, value: 0.95 }, value: 0.15 },
        tooltip: [
          { field: "financial_year", type: "nominal", title: "Financial year" },
          { field: "category", type: "nominal", title: "Route type" },
          { field: "measure", type: "nominal", title: "Measure" },
          { field: "value", type: "quantitative", title: "Value", format: "," },
          { field: "index_2019", type: "quantitative", title: "2018–19 = 100", format: ".1f" },
        ],
      },
    },
    {
      transform: [{ filter: "datum.year_end === 2026 && datum.measure === routeMeasure" }],
      mark: { type: "text", align: "left", dx: 7, baseline: "middle", fontSize: 11, fontWeight: 700, interactive: false },
      encoding: { text: { field: "category", type: "nominal" }, opacity: { condition: { param: "remotenessHover", empty: true, value: 1 }, value: 0.2 } },
    },
  ],
  config,
};

const airportLollipopChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", 
  height: 365,
  data: { url: `${dataPath}airport_2025_top20.csv` },
  transform: [{ calculate: "0", as: "baseline" }],
  encoding: {
    y: { field: "airport_name", type: "nominal", sort: { field: "passengers_per_aircraft_movement", order: "descending" }, title: null },
  },
  layer: [
    { mark: { type: "rule", color: "#a9b2ad", strokeWidth: 2 }, encoding: {
      x: { field: "baseline", type: "quantitative", title: "Passenger movements per aircraft movement" },
      x2: { field: "passengers_per_aircraft_movement" },
    }},
    { mark: { type: "point", filled: true, color: "#0d7c86", size: 80 }, encoding: {
      x: { field: "passengers_per_aircraft_movement", type: "quantitative" },
      tooltip: [{ field: "airport_name", title: "Airport" }, { field: "total_passengers", title: "Passenger movements", format: "," }, { field: "total_aircraft_movements", title: "Aircraft movements", format: "," }, { field: "passengers_per_aircraft_movement", title: "Ratio", format: ".1f" }],
    }},
  ], config,
};

vegaEmbed("#route-recovery-heatmap", routeRecoveryHeatmap, embedOptions);
vegaEmbed("#route-remoteness-chart", routeRemotenessChart, embedOptions);
vegaEmbed("#airport-lollipop-chart", airportLollipopChart, embedOptions);
