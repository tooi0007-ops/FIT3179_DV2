const nationalDemandLineChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container",
  height: 390,
  data: { url: `${dataPath}airport_activity.csv` },
  params: [{
    name: "passengerType",
    value: "Total",
    bind: { input: "select", name: "Passenger type: ", options: ["Total", "Domestic", "International"] },
  }],
  transform: [
    { filter: "datum.airport_name === 'TOTAL AUSTRALIA'" },
    { fold: ["total_passengers", "domestic_passengers", "international_passengers"], as: ["measure", "passengers"] },
    { calculate: "datum.measure === 'total_passengers' ? 'Total' : datum.measure === 'domestic_passengers' ? 'Domestic' : 'International'", as: "type" },
    { filter: "datum.type === passengerType" },
  ],
  encoding: {
    x: { field: "year", type: "quantitative", title: "Year", axis: { format: "d", tickCount: 9 } },
    y: { field: "passengers", type: "quantitative", title: "Passenger movements", scale: { zero: true }, axis: { format: "~s" } },
    tooltip: [
      { field: "year", type: "quantitative", title: "Year", format: "d" },
      { field: "type", type: "nominal", title: "Passenger type" },
      { field: "passengers", type: "quantitative", title: "Movements", format: "," },
    ],
  },
  layer: [
    { mark: { type: "line", color: "#0d7c86", strokeWidth: 3, point: { filled: true, size: 48 } } },
    {
      transform: [{ filter: "indexof([2020, 2025], datum.year) >= 0 || (datum.year === 1989 && passengerType !== 'International')" }],
      mark: { type: "point", filled: true, size: 115, stroke: "#ffffff", strokeWidth: 1.5 },
      encoding: { color: { condition: [{ test: "datum.year === 2020", value: "#b94d57" }, { test: "datum.year === 2025", value: "#0072b2" }], value: "#df7f40", legend: null } },
    },
    {
      transform: [
        { filter: "datum.year === 1989 && passengerType !== 'International'" },
      ],
      mark: { type: "text", align: "left", baseline: "top", dx: 7, dy: 12, fontSize: 11, fontWeight: 700, color: "#526071", interactive: false },
      encoding: { text: { value: "1989 pilots’ dispute" } },
    },
    {
      transform: [{ filter: "datum.year === 2020" }],
      mark: { type: "text", align: "right", baseline: "bottom", dx: -7, dy: -13, fontSize: 11, fontWeight: 700, color: "#9e3d48", interactive: false },
      encoding: { text: { value: "2020 travel restrictions" } },
    },
  ],
  config,
};

vegaEmbed("#national-demand-line-chart", nationalDemandLineChart, embedOptions);
