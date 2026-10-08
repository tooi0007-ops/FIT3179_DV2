const routeRecoveryHeatmap = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 365,
  data: { url: `${dataPath}route_monthly_recovery_top10.csv` },
  title: "Monthly change on major domestic routes: 2023–25 vs 2015–19",
  mark: { type: "rect", stroke: "#f6f3ec", strokeWidth: 1 },
  encoding: {
    x: { field: "month", type: "ordinal", title: "Month", sort: "ascending", axis: { labelExpr: "['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][datum.value - 1]", labelAngle: 0 } },
    y: { field: "route", type: "nominal", title: null, sort: { field: "passengers_2025", order: "descending" } },
    color: { field: "recovery_percent", type: "quantitative", title: "Change vs 2015–19 (%)", scale: { domain: [-20, 0, 20], range: ["#c85a5a", "#d6e0df", "#167988"], clamp: true }, legend: { orient: "bottom", direction: "horizontal", format: ".0f" } },
    tooltip: [{ field: "route", title: "Route" }, { field: "month", title: "Month" }, { field: "pre_covid_average", title: "2015–19 average", format: "," }, { field: "recovery_average", title: "2023–25 average", format: "," }, { field: "recovery_percent", title: "Change (%)", format: ".1f" }],
  }, config,
};

const airportLollipopChart = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: "container", height: 365,
  data: { url: `${dataPath}airport_2025_top20.csv?v=20260922`, format: { type: "csv" } },
  transform: [
    { calculate: "0", as: "baseline" },
  ],
  title: "Average passenger movements per aircraft movement, 2025",
  layer: [
    { mark: { type: "rule", color: "#a9b2ad", strokeWidth: 2 }, encoding: {
      y: { field: "airport_name", type: "nominal", sort: { field: "passengers_per_aircraft_movement", order: "descending" }, title: null },
      x: { field: "baseline", type: "quantitative", title: "Passenger movements per aircraft movement" },
      x2: { field: "passengers_per_aircraft_movement" },
    }},
    { mark: { type: "point", filled: true, color: "#0d7c86", size: 80 }, encoding: {
      y: { field: "airport_name", type: "nominal", sort: { field: "passengers_per_aircraft_movement", order: "descending" }, title: null },
      x: { field: "passengers_per_aircraft_movement", type: "quantitative" },
      tooltip: [{ field: "airport_name", title: "Airport" }, { field: "total_passengers", title: "Passenger movements", format: "," }, { field: "total_aircraft_movements", title: "Aircraft movements", format: "," }, { field: "passengers_per_aircraft_movement", title: "Ratio", format: ".1f" }],
    }},
  ], config,
};

vegaEmbed("#route-recovery-heatmap", routeRecoveryHeatmap, embedOptions);
vegaEmbed("#airport-lollipop-chart", airportLollipopChart, embedOptions);
