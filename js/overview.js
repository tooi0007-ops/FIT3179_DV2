const nationalDemandLineChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 390,
  title: ["Australian total passenger movements", "1985–2025"],
  data: { url: `${dataPath}airport_activity.csv` },
  transform: [{ filter: "datum.airport_name === 'TOTAL AUSTRALIA'" }],
  layer: [
    {
      mark: { type: "line", color: "#0d7c86", strokeWidth: 3, point: { filled: true, size: 35 } },
      encoding: {
        x: { field: "year", type: "quantitative", title: "Year", axis: { format: "d", tickCount: 9 } },
        y: { field: "total_passengers", type: "quantitative", title: "Passenger movements", axis: { format: "~s" } },
        tooltip: [
          { field: "year", type: "quantitative", title: "Year" },
          { field: "total_passengers", type: "quantitative", title: "Total passenger movements", format: "," },
          { field: "domestic_passengers", type: "quantitative", title: "Domestic", format: "," },
          { field: "international_passengers", type: "quantitative", title: "International", format: "," },
        ],
      },
    },
    {
      data: { values: [{ year: 1989, total_passengers: 33042473, domestic_passengers: 25111370, international_passengers: 7931103 }] },
      mark: { type: "point", filled: true, color: "#df7f40", size: 110, stroke: "#ffffff", strokeWidth: 1.5 },
      encoding: {
        x: { field: "year", type: "quantitative" },
        y: { field: "total_passengers", type: "quantitative" },
        tooltip: [
          { field: "year", type: "quantitative", title: "Year" },
          { field: "total_passengers", type: "quantitative", title: "Total passenger movements", format: "," },
          { field: "domestic_passengers", type: "quantitative", title: "Domestic", format: "," },
          { field: "international_passengers", type: "quantitative", title: "International", format: "," },
        ],
      },
    },
    {
      data: { values: [{ year: 2020, total_passengers: 47829062, domestic_passengers: 38526858, international_passengers: 9302204 }] },
      mark: { type: "point", filled: true, color: "#b94d57", size: 120, stroke: "#ffffff", strokeWidth: 1.5 },
      encoding: {
        x: { field: "year", type: "quantitative" },
        y: { field: "total_passengers", type: "quantitative" },
        tooltip: [
          { field: "year", type: "quantitative", title: "Year" },
          { field: "total_passengers", type: "quantitative", title: "Total passenger movements", format: "," },
          { field: "domestic_passengers", type: "quantitative", title: "Domestic", format: "," },
          { field: "international_passengers", type: "quantitative", title: "International", format: "," },
        ],
      },
    },
    {
      data: { values: [{ year: 2025, total_passengers: 164622881, domestic_passengers: 119781578, international_passengers: 44841303 }] },
      mark: { type: "point", filled: true, color: "#2563a6", size: 120, stroke: "#ffffff", strokeWidth: 1.5 },
      encoding: {
        x: { field: "year", type: "quantitative" },
        y: { field: "total_passengers", type: "quantitative" },
        tooltip: [
          { field: "year", type: "quantitative", title: "Year" },
          { field: "total_passengers", type: "quantitative", title: "Total passenger movements", format: "," },
          { field: "domestic_passengers", type: "quantitative", title: "Domestic", format: "," },
          { field: "international_passengers", type: "quantitative", title: "International", format: "," },
        ],
      },
    },
    {
      data: {
        values: [
          { year: 1989, total_passengers: 33042473, label: "1989 pilots' dispute" },
        ],
      },
      mark: { type: "text", align: "left", baseline: "bottom", dx: 8, dy: -18, fontSize: 11, fontWeight: 700, color: "#526071" },
      encoding: {
        x: { field: "year", type: "quantitative" },
        y: { field: "total_passengers", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
    {
      data: { values: [{ year: 2020, total_passengers: 47829062, label: "2020 COVID-19 drop" }] },
      mark: { type: "text", align: "left", baseline: "bottom", dx: 8, dy: -14, fontSize: 11, fontWeight: 700, color: "#9e3d48" },
      encoding: {
        x: { field: "year", type: "quantitative" },
        y: { field: "total_passengers", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
    {
      data: { values: [{ year: 2025, total_passengers: 164622881, label: "2025 returned to 2019 level" }] },
      mark: { type: "text", align: "right", baseline: "bottom", dx: -8, dy: -18, fontSize: 11, fontWeight: 700, color: "#526071" },
      encoding: {
        x: { field: "year", type: "quantitative" },
        y: { field: "total_passengers", type: "quantitative" },
        text: { field: "label", type: "nominal" },
      },
    },
  ],
  config,
};

vegaEmbed("#national-demand-line-chart", nationalDemandLineChart, embedOptions);
