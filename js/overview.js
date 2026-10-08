const demandMeasures = {
  total: {
    field: "total_passengers",
    label: "total passenger movements",
    description: "Showing total passenger movements. The annotations identify the 2020 disruption and the return to the 2019 level.",
  },
  domestic: {
    field: "domestic_passengers",
    label: "domestic passenger movements",
    description: "Showing domestic passenger movements. Use the tooltip to compare individual years.",
  },
  international: {
    field: "international_passengers",
    label: "international passenger movements",
    description: "Showing international passenger movements. Use the tooltip to compare individual years.",
  },
};

function nationalDemandLineChartSpec(demandType) {
  const measure = demandMeasures[demandType];
  const layers = [{
    data: { url: `${dataPath}airport_activity.csv` },
    transform: [{ filter: "datum.airport_name === 'TOTAL AUSTRALIA'" }],
    mark: { type: "line", color: "#0d7c86", strokeWidth: 3, point: { filled: true, size: 35 } },
    encoding: {
      x: { field: "year", type: "quantitative", title: "Year", axis: { format: "d", tickCount: 9 } },
      y: { field: measure.field, type: "quantitative", title: "Passenger movements", axis: { format: "~s" } },
      tooltip: [
        { field: "year", type: "quantitative", title: "Year" },
        { field: measure.field, type: "quantitative", title: measure.label, format: "," },
        { field: "total_passengers", type: "quantitative", title: "Total", format: "," },
        { field: "domestic_passengers", type: "quantitative", title: "Domestic", format: "," },
        { field: "international_passengers", type: "quantitative", title: "International", format: "," },
      ],
    },
  }];

  // These annotations use total-movement values, so they appear only for the total series.
  if (demandType === "total") {
    layers.push(
      {
        data: { values: [{ year: 2020, total_passengers: 47829062 }] },
        mark: { type: "point", filled: true, color: "#b94d57", size: 120, stroke: "#ffffff", strokeWidth: 1.5 },
        encoding: { x: { field: "year", type: "quantitative" }, y: { field: "total_passengers", type: "quantitative" } },
      },
      {
        data: { values: [{ year: 2020, total_passengers: 47829062, label: "COVID-19 disruption" }] },
        mark: { type: "text", align: "left", baseline: "top", dx: 9, dy: 10, fontSize: 12, fontWeight: 700, color: "#9e3d48" },
        encoding: { x: { field: "year", type: "quantitative" }, y: { field: "total_passengers", type: "quantitative" }, text: { field: "label" } },
      },
      {
        data: { values: [{ year: 2025, total_passengers: 164622881 }] },
        mark: { type: "point", filled: true, color: "#2563a6", size: 120, stroke: "#ffffff", strokeWidth: 1.5 },
        encoding: { x: { field: "year", type: "quantitative" }, y: { field: "total_passengers", type: "quantitative" } },
      },
      {
        data: { values: [{ year: 2025, total_passengers: 164622881, label: "Slightly above 2019" }] },
        mark: { type: "text", align: "right", baseline: "bottom", dx: -8, dy: -10, fontSize: 12, fontWeight: 700, color: "#1e4f75" },
        encoding: { x: { field: "year", type: "quantitative" }, y: { field: "total_passengers", type: "quantitative" }, text: { field: "label" } },
      },
    );
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 390,
    title: `Australian ${measure.label}, 1985–2025`,
    layer: layers,
    config,
  };
}

function renderNationalLine(demandType) {
  const chart = document.querySelector("#national-demand-line-chart");
  const description = document.querySelector("#demand-description");
  chart.replaceChildren();
  description.textContent = demandMeasures[demandType].description;
  vegaEmbed(chart, nationalDemandLineChartSpec(demandType), embedOptions);
}

const demandTypeControl = document.querySelector("#demand-type");
renderNationalLine(demandTypeControl.value);
demandTypeControl.addEventListener("change", (event) => renderNationalLine(event.target.value));
