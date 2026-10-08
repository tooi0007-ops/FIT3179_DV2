"""Create derived data for the FIT3179 DV2 airport dashboard.

Raw source files are never modified. This script creates compact CSV/GeoJSON
files and records uncertain airport matches rather than guessing them.
"""

from __future__ import annotations

import csv
import json
import math
import re
import struct
from collections import defaultdict
from pathlib import Path

import openpyxl


PROJECT = Path(__file__).resolve().parents[1]
RAW = PROJECT.parents[0] / "Data Source"
OUTPUT = PROJECT / "data" / "processed"


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def clean_number(value):
    return value if number(value) else None


def normalise_name(value: str | None) -> str:
    text = str(value or "").upper()
    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"\bAIRPORT\b", " ", text)
    text = re.sub(r"\bINTERNATIONAL\b", " ", text)
    text = re.sub(r"\bTERMINALS?\b.*$", " ", text)
    text = re.sub(r"\s+-\s+.*$", " ", text)
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    return " ".join(text.split())


def read_airport_sheet(path: Path, sheet_name: str) -> list[dict]:
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    worksheet = workbook[sheet_name]
    records = []
    for row in worksheet.iter_rows(min_row=8, values_only=True):
        if not row[1] or not number(row[2]):
            continue
        records.append(
            {
                "airport_name": str(row[1]).strip(),
                "year": int(row[2]),
                "rank": clean_number(row[3]),
                "domestic_inbound": clean_number(row[4]),
                "domestic_outbound": clean_number(row[5]),
                "domestic_passengers": clean_number(row[6]),
                "international_inbound": clean_number(row[7]),
                "international_outbound": clean_number(row[8]),
                "international_passengers": clean_number(row[9]),
                "total_inbound": clean_number(row[10]),
                "total_outbound": clean_number(row[11]),
                "total_passengers": clean_number(row[12]),
            }
        )
    workbook.close()
    return records


def read_movement_sheet(path: Path) -> dict[tuple[str, int], dict]:
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    worksheet = workbook["Aircraft Movements"]
    records = {}
    for row in worksheet.iter_rows(min_row=8, values_only=True):
        if not row[1] or not number(row[2]):
            continue
        records[(str(row[1]).strip(), int(row[2]))] = {
            "domestic_aircraft_movements": clean_number(row[6]),
            "international_aircraft_movements": clean_number(row[9]),
            "total_aircraft_movements": clean_number(row[12]),
        }
    workbook.close()
    return records


def read_geojson(path: Path) -> dict[str, dict]:
    with path.open(encoding="utf-8") as source:
        collection = json.load(source)

    grouped = defaultdict(list)
    for feature in collection["features"]:
        properties = feature.get("properties") or {}
        coordinates = feature.get("geometry", {}).get("coordinates") or []
        code = properties.get("airportcode")
        if not code or len(coordinates) < 2:
            continue
        grouped[code].append(
            {
                "airport_code": code,
                "ga_terminal_name": properties.get("name"),
                "state": properties.get("state"),
                "longitude": coordinates[0],
                "latitude": coordinates[1],
            }
        )

    airports = {}
    for code, terminals in grouped.items():
        airports[code] = {
            "airport_code": code,
            "ga_terminal_name": terminals[0]["ga_terminal_name"],
            "state": terminals[0]["state"],
            "longitude": round(sum(item["longitude"] for item in terminals) / len(terminals), 6),
            "latitude": round(sum(item["latitude"] for item in terminals) / len(terminals), 6),
            "terminal_count": len(terminals),
        }
    return airports


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def read_dbf(path: Path) -> list[dict]:
    with path.open("rb") as source:
        header = source.read(32)
        _, _, _, _, record_count, header_length, record_length = struct.unpack("<BBBBLHH20x", header)
        fields = []
        while source.tell() < header_length - 1:
            descriptor = source.read(32)
            if not descriptor or descriptor[0] == 0x0D:
                break
            name = descriptor[:11].split(b"\x00", 1)[0].decode("latin1")
            fields.append((name, descriptor[16]))
        source.seek(header_length)
        rows = []
        for _ in range(record_count):
            record = source.read(record_length)
            if not record or record[0:1] == b"*":
                continue
            position = 1
            row = {}
            for name, length in fields:
                row[name] = record[position : position + length].decode("latin1").strip()
                position += length
            rows.append(row)
    return rows


def simplify(points: list[list[float]], step: int = 5) -> list[list[float]]:
    """Thin closed rings gently so neighbouring state borders still align."""
    if len(points) <= step:
        return points
    compact = points[::step]
    if compact[-1] != points[-1]:
        compact.append(points[-1])
    return compact


def read_state_boundaries(shp_path: Path, dbf_rows: list[dict]) -> dict:
    features = []
    with shp_path.open("rb") as source:
        source.seek(100)
        index = 0
        while True:
            record_header = source.read(8)
            if not record_header:
                break
            _, length_words = struct.unpack(">ii", record_header)
            content = source.read(length_words * 2)
            shape_type = struct.unpack("<i", content[:4])[0]
            if shape_type != 5 or index >= len(dbf_rows):
                index += 1
                continue
            _, _, _, _, part_count, point_count = struct.unpack("<4d2i", content[4:44])
            parts_offset = 44
            parts = list(struct.unpack(f"<{part_count}i", content[parts_offset : parts_offset + part_count * 4]))
            points_offset = parts_offset + part_count * 4
            raw_points = [
                list(struct.unpack("<2d", content[points_offset + i * 16 : points_offset + (i + 1) * 16]))
                for i in range(point_count)
            ]
            rings = []
            for part_index, start in enumerate(parts):
                end = parts[part_index + 1] if part_index + 1 < len(parts) else point_count
                ring = raw_points[start:end]
                if ring[0] != ring[-1]:
                    ring.append(ring[0])
                compact = simplify(ring)
                if compact[0] != compact[-1]:
                    compact.append(compact[0])
                # Small offshore-island rings do not improve a national dashboard.
                lon_span = max(point[0] for point in compact) - min(point[0] for point in compact)
                lat_span = max(point[1] for point in compact) - min(point[1] for point in compact)
                signed_area = sum(
                    compact[i][0] * compact[i + 1][1] - compact[i + 1][0] * compact[i][1]
                    for i in range(len(compact) - 1)
                ) / 2
                # ABS polygon exteriors are clockwise; counter-clockwise rings
                # are holes. Treating each hole as an exterior created a large,
                # misleading filled polygon around the country.
                if len(compact) >= 4 and signed_area < 0 and (lon_span >= 0.08 or lat_span >= 0.08):
                    rings.append([compact])
            attributes = dbf_rows[index]
            name = attributes.get("STE_NAME21")
            if name not in {"Outside Australia", "Other Territories"}:
                features.append(
                    {
                        "type": "Feature",
                        "properties": {"state": name, "state_code": attributes.get("STE_CODE21")},
                        "geometry": {"type": "MultiPolygon", "coordinates": rings},
                    }
                )
            index += 1
    return {"type": "FeatureCollection", "features": features}


def read_routes(path: Path, airport_points: dict[str, dict]) -> list[dict]:
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    worksheet = workbook["Top Routes"]
    code_overrides = {"CBR": "CNB", "QNA": "BNK"}
    routes = []
    for row in worksheet.iter_rows(min_row=16, values_only=True):
        if not row[0] or not row[1] or not number(row[2]) or not number(row[3]):
            continue
        origin_code = str(row[0]).strip()
        destination_code = str(row[1]).strip()
        mapped_origin = code_overrides.get(origin_code, origin_code)
        mapped_destination = code_overrides.get(destination_code, destination_code)
        origin = airport_points.get(mapped_origin)
        destination = airport_points.get(mapped_destination)
        routes.append(
            {
                "origin_code": origin_code,
                "destination_code": destination_code,
                "route": str(row[20]).strip() if row[20] else f"{origin_code} - {destination_code}",
                "year": int(row[2]),
                "month": int(row[3]),
                "passengers": clean_number(row[4]),
                "aircraft_trips": clean_number(row[5]),
                "load_factor": clean_number(row[6]),
                "distance_km": clean_number(row[7]),
                "origin_longitude": origin["longitude"] if origin else None,
                "origin_latitude": origin["latitude"] if origin else None,
                "destination_longitude": destination["longitude"] if destination else None,
                "destination_latitude": destination["latitude"] if destination else None,
                "map_status": "mapped" if origin and destination else "unmapped_endpoint",
            }
        )
    workbook.close()
    return routes


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    airport_book = RAW / "WebAirport_CY_1985-2025.xlsx"
    route_book = RAW / "TopRoutesJuly2014June2026_0.xlsx"
    geojson_path = RAW / "ga_airport_terminals.geojson"
    state_root = RAW / "STE_2021_AUST_SHP_GDA2020"

    passenger_rows = read_airport_sheet(airport_book, "Airport Passengers")
    movement_rows = read_movement_sheet(airport_book)
    airport_points = read_geojson(geojson_path)

    by_normalised_name = defaultdict(list)
    for airport in airport_points.values():
        by_normalised_name[normalise_name(airport["ga_terminal_name"])].append(airport)

    # Conservative aliases. Every other unresolved record remains explicitly unmatched.
    known_aliases = {
        "NEWCASTLE": "NTL",
        "KALGOORLIE": "KGI",
        "MOORABBIN": "MBW",
        "ESSENDON FIELDS": "MEB",
        "BATHURST ISLAND": "BHS",
    }
    crosswalk = {}
    for row in passenger_rows:
        name = row["airport_name"]
        if name == "TOTAL AUSTRALIA" or name in crosswalk:
            continue
        normalised = normalise_name(name)
        candidates = by_normalised_name.get(normalised, [])
        if len(candidates) == 1:
            match, status = candidates[0], "normalised_exact"
        elif name in known_aliases and known_aliases[name] in airport_points:
            match, status = airport_points[known_aliases[name]], "verified_alias"
        else:
            match, status = None, "unmatched"
        crosswalk[name] = {
            "airport_name": name,
            "airport_code": match["airport_code"] if match else None,
            "ga_terminal_name": match["ga_terminal_name"] if match else None,
            "state": match["state"] if match else None,
            "longitude": match["longitude"] if match else None,
            "latitude": match["latitude"] if match else None,
            "terminal_count": match["terminal_count"] if match else None,
            "match_status": status,
        }

    activities = []
    for row in passenger_rows:
        airport = row["airport_name"]
        lookup = crosswalk.get(airport, {})
        movements = movement_rows.get((airport, row["year"]), {})
        activity = {**row, **movements, **lookup}
        if activity.get("total_passengers") is not None and activity.get("total_aircraft_movements"):
            activity["passengers_per_aircraft_movement"] = round(
                activity["total_passengers"] / activity["total_aircraft_movements"], 2
            )
        else:
            activity["passengers_per_aircraft_movement"] = None
        if activity.get("total_passengers"):
            activity["international_share"] = round(
                activity["international_passengers"] / activity["total_passengers"], 5
            )
        else:
            activity["international_share"] = None
        activities.append(activity)

    activity_fields = [
        "airport_name", "airport_code", "ga_terminal_name", "state", "longitude", "latitude", "terminal_count", "match_status",
        "year", "rank", "domestic_inbound", "domestic_outbound", "domestic_passengers",
        "international_inbound", "international_outbound", "international_passengers", "total_inbound", "total_outbound",
        "total_passengers", "domestic_aircraft_movements", "international_aircraft_movements", "total_aircraft_movements",
        "passengers_per_aircraft_movement", "international_share",
    ]
    write_csv(OUTPUT / "airport_activity.csv", activities, activity_fields)
    write_csv(
        OUTPUT / "airport_crosswalk.csv",
        sorted(crosswalk.values(), key=lambda item: item["airport_name"]),
        ["airport_name", "airport_code", "ga_terminal_name", "state", "longitude", "latitude", "terminal_count", "match_status"],
    )

    state_totals = defaultdict(lambda: {"total_passengers": 0, "domestic_passengers": 0, "international_passengers": 0, "airport_count": 0})
    seen = defaultdict(set)
    for row in activities:
        if row["airport_name"] == "TOTAL AUSTRALIA" or not row.get("state") or row["total_passengers"] is None:
            continue
        key = (row["year"], row["state"])
        state_totals[key]["total_passengers"] += row["total_passengers"]
        state_totals[key]["domestic_passengers"] += row["domestic_passengers"] or 0
        state_totals[key]["international_passengers"] += row["international_passengers"] or 0
        seen[key].add(row["airport_name"])
    state_rows = []
    for (year, state), measures in sorted(state_totals.items()):
        state_rows.append(
            {
                "year": year,
                "state": state,
                **measures,
                "airport_count": len(seen[(year, state)]),
                "coverage_note": "Only airports with verified GA terminal matches are included.",
            }
        )
    write_csv(
        OUTPUT / "state_activity.csv",
        state_rows,
        ["year", "state", "total_passengers", "domestic_passengers", "international_passengers", "airport_count", "coverage_note"],
    )

    state_by_year = {(row["state"], row["year"]): row for row in state_rows}
    recovery_rows = []
    for state in sorted({row["state"] for row in state_rows}):
        before = state_by_year.get((state, 2019))
        after = state_by_year.get((state, 2025))
        if before and after and before["total_passengers"]:
            recovery_rows.append(
                {
                    "state": state,
                    "passengers_2019": before["total_passengers"],
                    "passengers_2025": after["total_passengers"],
                    "recovery_percent": round((after["total_passengers"] / before["total_passengers"] - 1) * 100, 2),
                }
            )
    write_csv(OUTPUT / "state_recovery_2019_2025.csv", recovery_rows, ["state", "passengers_2019", "passengers_2025", "recovery_percent"])

    airport_2025 = [row for row in activities if row["year"] == 2025 and row["airport_name"] != "TOTAL AUSTRALIA"]
    write_csv(OUTPUT / "airport_2025.csv", airport_2025, activity_fields)
    ranked_airports_2025 = [row for row in airport_2025 if row["rank"] is not None]
    write_csv(OUTPUT / "airport_2025_top10.csv", [row for row in ranked_airports_2025 if row["rank"] <= 10], activity_fields)
    write_csv(OUTPUT / "airport_2025_top20.csv", [row for row in ranked_airports_2025 if row["rank"] <= 20], activity_fields)
    rank_rows = [
        row for row in activities
        if row["airport_name"] != "TOTAL AUSTRALIA" and 2015 <= row["year"] <= 2025 and row["rank"] is not None and row["rank"] <= 10
    ]
    write_csv(OUTPUT / "airport_top10_ranks_2015_2025.csv", rank_rows, activity_fields)
    # Keep a fixed cohort for a readable bump chart: every airport that appears
    # in the top ten at least once, with its rank in every available year.
    bump_airports = {row["airport_name"] for row in rank_rows}
    bump_rows = [
        row for row in activities
        if row["airport_name"] in bump_airports and 2015 <= row["year"] <= 2025 and row["rank"] is not None
    ]
    write_csv(OUTPUT / "airport_bump_2015_2025.csv", bump_rows, activity_fields)

    compare_2019 = {row["airport_name"]: row for row in activities if row["year"] == 2019 and row["airport_name"] != "TOTAL AUSTRALIA"}
    compare_rows = []
    for row in airport_2025:
        before = compare_2019.get(row["airport_name"])
        if before and before["total_passengers"] and row["total_passengers"] is not None:
            compare_rows.append(
                {
                    "airport_name": row["airport_name"],
                    "passengers_2019": before["total_passengers"],
                    "passengers_2025": row["total_passengers"],
                    "change_percent": round((row["total_passengers"] / before["total_passengers"] - 1) * 100, 2),
                }
            )
    write_csv(OUTPUT / "airport_compare_2019_2025.csv", compare_rows, ["airport_name", "passengers_2019", "passengers_2025", "change_percent"])
    write_csv(
        OUTPUT / "airport_compare_top15_2019_2025.csv",
        sorted(compare_rows, key=lambda row: row["passengers_2025"], reverse=True)[:15],
        ["airport_name", "passengers_2019", "passengers_2025", "change_percent"],
    )

    routes = read_routes(route_book, airport_points)
    route_fields = [
        "origin_code", "destination_code", "route", "year", "month", "passengers", "aircraft_trips", "load_factor", "distance_km",
        "origin_longitude", "origin_latitude", "destination_longitude", "destination_latitude", "map_status",
    ]
    write_csv(OUTPUT / "route_activity.csv", routes, route_fields)

    routes_2025 = defaultdict(list)
    for row in routes:
        if row["year"] == 2025 and row["passengers"] is not None and row["map_status"] == "mapped":
            routes_2025[row["route"]].append(row)
    route_summary = []
    for route_name, rows in routes_2025.items():
        if {row["month"] for row in rows} != set(range(1, 13)):
            continue
        first = rows[0]
        route_summary.append(
            {
                "route": route_name,
                "origin_code": first["origin_code"],
                "destination_code": first["destination_code"],
                "passengers_2025": sum(row["passengers"] for row in rows),
                "origin_longitude": first["origin_longitude"],
                "origin_latitude": first["origin_latitude"],
                "destination_longitude": first["destination_longitude"],
                "destination_latitude": first["destination_latitude"],
            }
        )
    route_summary.sort(key=lambda row: row["passengers_2025"], reverse=True)
    write_csv(
        OUTPUT / "route_summary_2025.csv",
        route_summary,
        ["route", "origin_code", "destination_code", "passengers_2025", "origin_longitude", "origin_latitude", "destination_longitude", "destination_latitude"],
    )

    flow_points = []
    for route in route_summary:
        origin = (route["origin_longitude"], route["origin_latitude"])
        destination = (route["destination_longitude"], route["destination_latitude"])
        # A midpoint makes the displayed link a curved, bidirectional corridor.
        # The published route totals combine both directions, so this is visual
        # separation only; it does not imply an origin or destination.
        longitude_gap = abs(destination[0] - origin[0])
        midpoint = (
            (origin[0] + destination[0]) / 2,
            (origin[1] + destination[1]) / 2 + max(1.1, longitude_gap * 0.09),
        )
        for order, (longitude, latitude) in enumerate([origin, midpoint, destination]):
            flow_points.append(
                {
                    "route": route["route"],
                    "point_order": order,
                    "passengers_2025": route["passengers_2025"],
                    "longitude": longitude,
                    "latitude": latitude,
                }
            )
    write_csv(OUTPUT / "route_flow_points_2025.csv", flow_points, ["route", "point_order", "passengers_2025", "longitude", "latitude"])
    top_flow_routes = {row["route"] for row in route_summary[:10]}
    write_csv(
        OUTPUT / "route_flow_points_top10_2025.csv",
        [row for row in flow_points if row["route"] in top_flow_routes],
        ["route", "point_order", "passengers_2025", "longitude", "latitude"],
    )

    monthly = defaultdict(lambda: {"pre": [], "post": []})
    for row in routes:
        if row["passengers"] is None:
            continue
        if 2015 <= row["year"] <= 2019:
            monthly[(row["route"], row["month"])]["pre"].append(row["passengers"])
        elif 2023 <= row["year"] <= 2025:
            monthly[(row["route"], row["month"])]["post"].append(row["passengers"])
    route_totals_2025 = {row["route"]: row["passengers_2025"] for row in route_summary}
    recovery_months = []
    for (route, month), values in monthly.items():
        if len(values["pre"]) == 5 and len(values["post"]) == 3 and route in route_totals_2025:
            pre_average = sum(values["pre"]) / len(values["pre"])
            post_average = sum(values["post"]) / len(values["post"])
            recovery_months.append(
                {
                    "route": route,
                    "month": month,
                    "pre_covid_average": round(pre_average, 2),
                    "recovery_average": round(post_average, 2),
                    "recovery_percent": round((post_average / pre_average - 1) * 100, 2),
                    "passengers_2025": route_totals_2025[route],
                }
            )
    write_csv(
        OUTPUT / "route_monthly_recovery.csv",
        recovery_months,
        ["route", "month", "pre_covid_average", "recovery_average", "recovery_percent", "passengers_2025"],
    )
    top_recovery_routes = {row["route"] for row in sorted(route_summary, key=lambda item: item["passengers_2025"], reverse=True)[:10]}
    write_csv(
        OUTPUT / "route_monthly_recovery_top10.csv",
        [row for row in recovery_months if row["route"] in top_recovery_routes],
        ["route", "month", "pre_covid_average", "recovery_average", "recovery_percent", "passengers_2025"],
    )

    # A compact hierarchy for the Vega treemap. Only verified terminal matches
    # are used so the state parent and airport leaf agree spatially.
    treemap_rows = [{"id": "australia", "parent": "", "label": "Australia", "state": "Australia", "value": 0, "kind": "root"}]
    mapped_airports = [row for row in airport_2025 if row["match_status"] != "unmatched" and row["state"]]
    for state in sorted({row["state"] for row in mapped_airports}):
        state_id = f"state::{state}"
        treemap_rows.append({"id": state_id, "parent": "australia", "label": state, "state": state, "value": 0, "kind": "state"})
        for row in sorted((item for item in mapped_airports if item["state"] == state), key=lambda item: item["total_passengers"], reverse=True):
            treemap_rows.append({
                "id": f"airport::{row['airport_name']}", "parent": state_id,
                "label": row["airport_name"], "state": state, "value": row["total_passengers"], "kind": "airport",
            })
    with (OUTPUT / "airport_treemap_2025.json").open("w", encoding="utf-8") as target:
        json.dump(treemap_rows, target, separators=(",", ":"))

    state_boundaries = read_state_boundaries(state_root / "STE_2021_AUST_GDA2020.shp", read_dbf(state_root / "STE_2021_AUST_GDA2020.dbf"))
    with (OUTPUT / "australia_states_simplified.geojson").open("w", encoding="utf-8") as target:
        json.dump(state_boundaries, target, separators=(",", ":"))

    quality = {
        "airport_activity_rows": len(activities),
        "airport_crosswalk": {
            "matched": sum(item["match_status"] != "unmatched" for item in crosswalk.values()),
            "unmatched": sum(item["match_status"] == "unmatched" for item in crosswalk.values()),
        },
        "route_rows": len(routes),
        "route_rows_with_both_endpoints": sum(item["map_status"] == "mapped" for item in routes),
        "route_rows_with_missing_or_suppressed_passengers": sum(item["passengers"] is None for item in routes),
        "state_boundary_features": len(state_boundaries["features"]),
    }
    with (OUTPUT / "data_quality.json").open("w", encoding="utf-8") as target:
        json.dump(quality, target, indent=2)


if __name__ == "__main__":
    main()
