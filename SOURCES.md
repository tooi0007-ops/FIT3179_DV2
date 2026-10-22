# Data sources and chart opportunities

The dashboard uses public Australian aviation data. Its measures are counts of passenger movements, passenger trips or aircraft movements, not unique travellers.

| Source | Available variables | Research question / chart | Status |
| --- | --- | --- | --- |
| [BITRE airport traffic data](https://www.bitre.gov.au/resource/aviation/airport-traffic-data) | Annual airport passenger and aircraft movements, domestic and international, 1985–2025 in the local workbook | How did major airports recover, and did passenger growth require more flights? | Used in the national line, airport comparisons and maps. |
| [BITRE domestic aviation activity by cities and regions](https://www.bitre.gov.au/resource/aviation/domestic-aviation-activity-cities-and-regions) | Financial-year passenger trips, flights, seats, distance and load factors by major-city, regional and remote route, 1985–86 to 2025–26 | Did remote routes recover with the same number of flights? | Workbook saved in `../Data Source/`; indexed passenger-trip and flight chart added. |
| [BITRE domestic aviation activity time series](https://www.bitre.gov.au/resource/aviation/australian-domestic-aviation-activity-time-series) | Monthly passengers, seats, load factors, kilometres and top competitive routes | Did changes in seat supply or load factor explain route-level recovery? | Candidate for a route-level bubble chart or small multiples. |
| [BITRE international airline activity time series](https://www.bitre.gov.au/resource/aviation/international-airline-activity-time-series-data) | International city pairs, origin countries, passengers, flights, seats and load factors | Which overseas markets contributed most to international recovery at each Australian gateway? | Candidate for a gateway-to-market flow or share-change chart. |
| [Tourism Research Australia visitor survey trends](https://www.tra.gov.au/en/tourism-statistics/national-visitor-survey-trends) | Domestic trips, nights, purpose and spend by state or region | Did tourism demand and airport traffic recover together? | Candidate for a linked state comparison; survey trips and airport movements require separate labels and should not be equated. |

The cities-and-regions series is for **financial years ending June** and regular public transport route sectors. The airport series is for **calendar years** and counts movements at airports. They are shown in separate charts to avoid treating their totals as interchangeable.

The state choropleth uses a derived 2025 international share: international passenger movements divided by all passenger movements at the 69 verified airports shown on the main map. The treemap uses the same airports. Four offshore airports outside the map extent and Bathurst Island, which lacks a verified terminal match, are excluded from these state comparisons. These are airport activity measures, not measures of residents' travel.
