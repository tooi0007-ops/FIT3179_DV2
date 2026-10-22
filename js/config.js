const dataPath = "data/processed/";
const mapData = { url: `${dataPath}australia_states_simplified.geojson?v=20261022`, format: { type: "json", property: "features" } };

const config = {
  background: null,
  view: { stroke: "#d9d3c6", strokeWidth: 1 },
  axis: {
    domainColor: "#8a929b",
    tickColor: "#8a929b",
    gridColor: "#e5e0d6",
    labelColor: "#526071",
    titleColor: "#526071",
    labelFont: "Arial",
    titleFont: "Arial",
    labelFontSize: 13,
    titleFontSize: 14,
  },
  legend: { 
    labelColor: "#526071",
    titleColor: "#526071",
    labelFont: "Arial",
    titleFont: "Arial",
    labelFontSize: 13,
    titleFontSize: 13,
  },
  title: { 
    color: "#17202f",
    font: "Arial",
    fontSize: 16,
    fontWeight: 600,
    anchor: "start" 
  },
};

const embedOptions = { actions: false, renderer: "svg" };
