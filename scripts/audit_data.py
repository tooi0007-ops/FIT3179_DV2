"""Reconcile dashboard data and published callouts with the source workbooks.

Run after process_data.py. This reads source and processed files without edits.
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT.parent / "Data Source"
DATA = ROOT / "data" / "processed"


def csv_rows(name: str) -> list[dict[str, str]]:
    with (DATA / name).open(newline="", encoding="utf-8") as source:
        return list(csv.DictReader(source))


def numeric(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def same(actual: object, expected: object, label: str, tolerance: float = 0.00001) -> None:
    if expected is None:
        assert actual in (None, ""), f"{label}: expected missing, got {actual}"
    else:
        assert abs(float(actual) - float(expected)) <= tolerance, f"{label}: {actual} != {expected}"


def workbook_rows(filename: str, sheet: str, first_row: int):
    book = openpyxl.load_workbook(RAW / filename, read_only=True, data_only=True)
    try:
        yield from book[sheet].iter_rows(min_row=first_row, values_only=True)
    finally:
        book.close()


def audit_airports() -> dict[tuple[str, int], dict[str, str]]:
    activity = {(r["airport_name"], int(r["year"])): r for r in csv_rows("airport_activity.csv")}
    checked = 0
    fields = {6: "domestic_passengers", 9: "international_passengers", 12: "total_passengers"}
    for row in workbook_rows("WebAirport_CY_1985-2025.xlsx", "Airport Passengers", 8):
        if not row[1] or not numeric(row[2]):
            continue
        key = (str(row[1]).strip(), int(row[2]))
        assert key in activity, f"Missing airport-year: {key}"
        for column, field in fields.items():
            same(activity[key][field], row[column] if numeric(row[column]) else None, f"{key} {field}")
        checked += 1
    assert checked == len(activity), f"Airport record count: {checked} != {len(activity)}"

    movements = 0
    for row in workbook_rows("WebAirport_CY_1985-2025.xlsx", "Aircraft Movements", 8):
        if not row[1] or not numeric(row[2]):
            continue
        key = (str(row[1]).strip(), int(row[2]))
        if key not in activity:
            continue
        for column, field in ((6, "domestic_aircraft_movements"), (9, "international_aircraft_movements"), (12, "total_aircraft_movements")):
            same(activity[key][field], row[column] if numeric(row[column]) else None, f"{key} {field}")
        movements += 1

    total_2019 = int(activity["TOTAL AUSTRALIA", 2019]["total_passengers"])
    total_2020 = int(activity["TOTAL AUSTRALIA", 2020]["total_passengers"])
    total_2025 = int(activity["TOTAL AUSTRALIA", 2025]["total_passengers"])
    same(round((total_2025 / total_2019 - 1) * 100, 1), 0.2, "National recovery")
    same(round((1 - total_2020 / total_2019) * 100), 71, "2020 national drop")
    same(round(total_2025 / 1_000_000, 1), 164.6, "2025 headline total")
    for field, expected in (("domestic_passengers", -1.7), ("international_passengers", 5.5)):
        before = int(activity["TOTAL AUSTRALIA", 2019][field])
        after = int(activity["TOTAL AUSTRALIA", 2025][field])
        same(round((after / before - 1) * 100, 1), expected, field)

    top = sorted((r for (name, year), r in activity.items() if year == 2025 and name != "TOTAL AUSTRALIA"),
                 key=lambda r: int(r["total_passengers"] or 0), reverse=True)
    assert [r["airport_name"] for r in top[:20]] == [r["airport_name"] for r in sorted(csv_rows("airport_2025_top20.csv"), key=lambda r: int(r["rank"]))]
    assert [r["airport_name"] for r in top[:10]] == [r["airport_name"] for r in sorted(csv_rows("airport_2025_top10.csv"), key=lambda r: int(r["rank"]))]
    same(round(sum(int(r["total_passengers"]) for r in top[:3]) / 1_000_000, 1), 103.8, "Top three airports")
    same(round(int(activity["SYDNEY", 2025]["total_passengers"]) / 1_000_000, 1), 42.6, "Sydney headline")
    same(activity["HOBART", 2025]["international_passengers"], 19_580, "Hobart international")

    for row in csv_rows("airport_compare_top15_2019_2025.csv"):
        name = row["airport_name"]
        before, after = activity[name, 2019], activity[name, 2025]
        same(row["passengers_2019"], before["total_passengers"], f"{name} 2019")
        same(row["passengers_2025"], after["total_passengers"], f"{name} 2025")
        same(row["change_percent"], round((int(after["total_passengers"]) / int(before["total_passengers"]) - 1) * 100, 2), f"{name} change")
        if name in ("SUNSHINE COAST", "CANBERRA"):
            same(round(float(row["change_percent"]), 1), 34.7 if name == "SUNSHINE COAST" else -13.7, f"{name} callout")
    for row in csv_rows("airport_flights_vs_passengers_2019_2025.csv"):
        name = row["airport_name"]
        before, after = activity[name, 2019], activity[name, 2025]
        same(row["passenger_change_percent"], round((int(after["total_passengers"]) / int(before["total_passengers"]) - 1) * 100, 2), f"{name} passenger change")
        same(row["flight_change_percent"], round((int(after["total_aircraft_movements"]) / int(before["total_aircraft_movements"]) - 1) * 100, 2), f"{name} aircraft change")
        if name == "KARRATHA":
            same(round(float(row["passenger_change_percent"]), 1), 48.9, "Karratha passenger callout")
            same(round(float(row["flight_change_percent"]), 1), 8.4, "Karratha aircraft callout")
    for row in csv_rows("airport_2025_top20.csv"):
        airport = activity[row["airport_name"], 2025]
        same(row["passengers_per_aircraft_movement"], round(int(airport["total_passengers"]) / int(airport["total_aircraft_movements"]), 2), f"{row['airport_name']} ratio")
    top_20 = {r["airport_name"]: r for r in csv_rows("airport_2025_top20.csv")}
    chart_source = (ROOT / "js" / "routes.js").read_text(encoding="utf-8")
    order_definition = re.search(r"const lollipopAirportOrder = \[([^\]]+)\]", chart_source, re.S)
    assert order_definition, "Lollipop ordering is missing"
    chart_order = re.findall(r'"([A-Z ]+)"', order_definition.group(1))
    expected_order = sorted(top_20, key=lambda name: float(top_20[name]["passengers_per_aircraft_movement"]), reverse=True)
    assert chart_order == expected_order, "Lollipop ordering no longer matches the source ratios"
    same(round(float(top_20["GOLD COAST"]["passengers_per_aircraft_movement"])), 159, "Gold Coast lollipop callout")
    same(round(float(top_20["ROCKHAMPTON"]["passengers_per_aircraft_movement"])), 70, "Rockhampton lollipop callout")
    same(round(float(top_20["GOLD COAST"]["passengers_per_aircraft_movement"]) / float(top_20["ROCKHAMPTON"]["passengers_per_aircraft_movement"]), 1), 2.3, "Lollipop gap")

    bump = csv_rows("airport_bump_2015_2025.csv")
    assert len({r["airport_name"] for r in bump}) == 12
    for row in bump:
        source = activity[row["airport_name"], int(row["year"])]
        same(row["rank"], source["rank"], f"{row['airport_name']} rank {row['year']}")
    bump_ranks = {(r["airport_name"], int(r["year"])): int(r["rank"]) for r in bump}
    same(bump_ranks["SUNSHINE COAST", 2020], 16, "Sunshine Coast 2020 rank")
    same(bump_ranks["SUNSHINE COAST", 2025], 11, "Sunshine Coast 2025 rank")
    for name in ("SYDNEY", "MELBOURNE", "BRISBANE", "PERTH", "ADELAIDE"):
        same(bump_ranks[name, 2015], bump_ranks[name, 2025], f"{name} stable rank")
    print(f"Airports: {checked} passenger records, {movements} movement records; comparisons, rankings and ratios pass")
    return activity


def audit_states(activity: dict[tuple[str, int], dict[str, str]]) -> None:
    crosswalk = {r["airport_name"]: r for r in csv_rows("airport_crosswalk.csv")}
    with (RAW / "ga_airport_terminals.geojson").open(encoding="utf-8") as source:
        features = json.load(source)["features"]
    terminals = defaultdict(list)
    for feature in features:
        code = feature["properties"].get("airportcode")
        if code:
            terminals[code].append(feature)
    for name, match in crosswalk.items():
        code = match["airport_code"]
        if not code:
            continue
        assert code in terminals, f"Unknown GA airport code: {name} {code}"
        longitude = sum(f["geometry"]["coordinates"][0] for f in terminals[code]) / len(terminals[code])
        latitude = sum(f["geometry"]["coordinates"][1] for f in terminals[code]) / len(terminals[code])
        same(match["longitude"], longitude, f"{name} longitude", 0.000001)
        same(match["latitude"], latitude, f"{name} latitude", 0.000001)
        assert match["state"] == terminals[code][0]["properties"]["state"]

    mapped = [r for (name, year), r in activity.items() if year == 2025 and name != "TOTAL AUSTRALIA"
              and r["state"] and r["longitude"] and 110 <= float(r["longitude"]) <= 155
              and -45 <= float(r["latitude"]) <= -10]
    assert len(mapped) == 69
    treemap = [r for r in json.loads((DATA / "airport_treemap_2025.json").read_text()) if r["kind"] == "airport"]
    assert {r["label"] for r in treemap} == {r["airport_name"] for r in mapped}
    for row in treemap:
        same(row["value"], activity[row["label"], 2025]["total_passengers"], f"Treemap {row['label']}")
    for row in csv_rows("state_international_share_2025.csv"):
        members = [r for r in mapped if r["state"] == row["state"]]
        total = sum(int(r["total_passengers"]) for r in members)
        international = sum(int(r["international_passengers"]) for r in members)
        same(row["total_passengers"], total, f"{row['state']} total")
        same(row["international_passengers"], international, f"{row['state']} international")
        same(row["international_share_percent"], round(100 * international / total, 3), f"{row['state']} share")
        if row["state"] in ("New South Wales", "Tasmania"):
            same(round(100 * international / total, 1), 37.5 if row["state"] == "New South Wales" else 0.4, f"{row['state']} map callout")
    print("Maps: GA terminal coordinates, 69 mapped airports, treemap and eight state shares pass")


def audit_routes() -> None:
    routes = csv_rows("route_activity.csv")
    expected = []
    for row in workbook_rows("TopRoutesJuly2014June2026_0.xlsx", "Top Routes", 16):
        if row[0] and row[1] and numeric(row[2]) and numeric(row[3]):
            route = str(row[20]).strip() if row[20] else f"{row[0]} - {row[1]}"
            expected.append((route, int(row[2]), int(row[3]), row))
    assert len(routes) == len(expected), "Route record count differs from workbook"
    by_route_month = {}
    for route, (name, year, month, source) in zip(routes, expected):
        key = (route["route"], int(route["year"]), int(route["month"]))
        assert key == (name, year, month), f"Route order differs at {key}"
        same(route["passengers"], source[4] if numeric(source[4]) else None, f"{key} passengers")
        same(route["aircraft_trips"], source[5] if numeric(source[5]) else None, f"{key} aircraft")
        by_route_month[key] = float(route["passengers"]) if route["passengers"] else None
    for row in csv_rows("route_summary_2025.csv"):
        name = row["route"]
        total = sum(by_route_month[name, 2025, month] for month in range(1, 13))
        same(row["passengers_2025"], total, f"{name} annual total")
    top_routes = csv_rows("route_summary_2025.csv")[:10]
    markers = csv_rows("route_flow_points_top10_2025.csv")
    assert len(markers) == 20, "Top routes should have two endpoint markers each"
    for route in top_routes:
        endpoints = [m for m in markers if m["route"] == route["route"]]
        assert len(endpoints) == 2, f"Missing endpoint markers for {route['route']}"
        for marker, prefix in zip(endpoints, ("origin", "destination")):
            same(marker["longitude"], route[f"{prefix}_longitude"], f"{route['route']} {prefix} longitude")
            same(marker["latitude"], route[f"{prefix}_latitude"], f"{route['route']} {prefix} latitude")
    for row in csv_rows("route_monthly_recovery_top10.csv"):
        name, month = row["route"], int(row["month"])
        pre = sum(by_route_month[name, year, month] for year in range(2015, 2020)) / 5
        post = sum(by_route_month[name, year, month] for year in range(2023, 2026)) / 3
        same(row["pre_covid_average"], round(pre, 2), f"{name} {month} earlier average")
        same(row["recovery_average"], round(post, 2), f"{name} {month} recent average")
        same(row["recovery_percent"], round((post / pre - 1) * 100, 2), f"{name} {month} change")
        if (name, month) == ("Gold Coast - Melbourne", 2):
            same(round(float(row["recovery_percent"]), 1), 17.3, "Gold Coast–Melbourne February callout")
    assert ("Gold Coast - Melbourne", 11) not in {(r["route"], int(r["month"])) for r in csv_rows("route_monthly_recovery_top10.csv")}
    same(round(float(csv_rows("route_summary_2025.csv")[0]["passengers_2025"]) / 1_000_000, 1), 8.1, "Melbourne–Sydney headline")
    print(f"Routes: {len(routes)} monthly records, annual top routes and 119 heatmap cells pass")


def audit_remoteness() -> None:
    source = {}
    for row in workbook_rows("DomesticAviation_CitiesRegions_1985-2026.xlsx", "Data", 9):
        if row[1] in ("Passenger Trips", "Flights") and numeric(row[9]):
            for column, category in ((3, "Major cities"), (4, "Regional"), (5, "Remote")):
                if numeric(row[column]):
                    source[int(row[9]), row[1].replace("Passenger Trips", "Passenger trips"), category] = row[column]
    processed = csv_rows("route_remoteness_index_1986_2026.csv")
    assert len(source) == len(processed)
    for row in processed:
        key = (int(row["year_end"]), row["measure"], row["category"])
        baseline = source[2019, row["measure"], row["category"]]
        same(row["value"], source[key], f"Remoteness {key}")
        same(row["index_2019"], round(source[key] / baseline * 100, 2), f"Remoteness index {key}")
        if key[0] == 2026 and key[2] == "Remote":
            expected = 112.3 if key[1] == "Passenger trips" else 95.2
            same(round(float(row["index_2019"]), 1), expected, f"Remote 2026 {key[1]} callout")
    print(f"Remoteness: {len(processed)} financial-year source values and indexes pass")


if __name__ == "__main__":
    activity_rows = audit_airports()
    audit_states(activity_rows)
    audit_routes()
    audit_remoteness()
    print("All source reconciliation checks passed.")
