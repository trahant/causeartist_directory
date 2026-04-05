#!/usr/bin/env python3
"""
Search the ProPublica Nonprofit Explorer API for impact-focused funders
and write a CSV for Causeartist funder import.
"""

import csv
import json
import os
import sys
import time
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    print("Error: the 'requests' package is required but is not installed.")
    print("Install it with:")
    print("  pip install requests")
    sys.exit(1)

# --- CONFIGURATION ---

BASE_URL = "https://projects.propublica.org/nonprofits/api/v2"

# NTEE codes for impact funders
# T = Philanthropy, Voluntarism, Grantmaking
# S = Community Improvement
IMPACT_NTEE_CODES = [
    "T20",  # Private Foundations
    "T21",  # Corporate Foundations
    "T22",  # Private Operating Foundations
    "T30",  # Public Foundations
    "T31",  # Community Foundations
    "T50",  # Philanthropy/Charity/Voluntarism
    "T70",  # Federated Giving Programs
    "T90",  # Named Trusts
    "S31",  # Urban/Community Economic Development
    "S43",  # Small Business Development
    "S50",  # Nonprofit Management
    "Q30",  # International Development
    "Q33",  # International Relief
]

# Keywords to filter for impact/mission focus
IMPACT_KEYWORDS = [
    "impact", "social venture", "social enterprise", "mission",
    "community development", "microfinance", "accelerator",
    "incubator", "philanthropy", "foundation", "climate",
    "environmental", "sustainable", "equity", "inclusion",
    "opportunity", "innovation", "entrepreneurship", "fund",
    "capital", "investment", "grant", "fellowship"
]

# Minimum revenue — focus on organizations with meaningful grantmaking scale
MIN_REVENUE = 5_000_000  # $5M minimum


# --- FUNCTIONS ---

def search_nonprofits_by_ntee(ntee_code: str, page: int = 0) -> dict:
    """Search ProPublica API by NTEE code; 501(c)(3) only (c_code[]=3)."""
    url = f"{BASE_URL}/search.json"
    # Equivalent to: search.json?q=&ntee%5B%5D={code}&c_code%5B%5D=3
    params = {
        "q": "",
        "ntee[]": ntee_code,
        "c_code[]": "3",
        "page": page,
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error searching NTEE {ntee_code} page {page}: {e}")
        return {"organizations": []}


def get_organization_details(ein: str) -> dict:
    """Get detailed info for a specific organization"""
    url = f"{BASE_URL}/organizations/{ein}.json"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching EIN {ein}: {e}")
        return {}


def classify_funder_type(name: str, ntee_code: str, description: str) -> str:
    """Classify funder type based on name, NTEE code and description"""
    name_lower = name.lower()
    desc_lower = (description or "").lower()

    nc = (ntee_code or "").upper()
    if nc in ("T21", "T021"):
        return "corporate"
    if any(word in name_lower for word in ["accelerator", "incubator", "launchpad"]):
        return "accelerator"
    if any(word in name_lower for word in ["fellowship", "fellows"]):
        return "fellowship"
    if any(word in name_lower for word in ["community foundation", "cf "]):
        return "foundation"
    if any(word in name_lower for word in ["cdfi", "loan fund", "credit union"]):
        return "cdfi"
    if any(word in name_lower for word in ["venture", "capital", "vc ", "fund"]):
        return "impact-fund"
    if nc.startswith("T"):
        return "foundation"
    return "foundation"


def is_impact_focused(org: dict) -> bool:
    """Accept most nonprofits - we filter manually after"""
    name = (org.get("name") or "").lower()

    # Exclude clearly irrelevant types
    exclude_keywords = [
        "church", "temple", "mosque", "synagogue", "parish",
        "hospital", "medical center", "health system",
        "school district", "unified school",
        "homeowners association", "hoa ",
        "cemetery", "funeral",
        "veterans of foreign wars", "vfw ",
        "american legion",
        "rotary club",
        "lions club",
        "kiwanis"
    ]

    if any(word in name for word in exclude_keywords):
        return False

    return True


def generate_slug(name: str) -> str:
    """Generate URL slug from organization name"""
    import re

    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug.strip())
    slug = re.sub(r'-+', '-', slug)
    return slug[:80]  # Max 80 chars


# --- NTEE-based search (501(c)(3) via c_code[]=3) ---

NTEE_SEARCHES = [
    ("T020", "Private Foundations"),
    ("T021", "Corporate Foundations"),
    ("T030", "Public Foundations"),
    ("T031", "Community Foundations"),
    ("T050", "Philanthropy Voluntarism"),
    ("T070", "Federated Giving Programs"),
    ("S020", "Community Economic Development"),
    ("S043", "Small Business Development"),
    ("Q330", "International Development"),
]


def main():
    print("Causeartist Nonprofit Funder Search")
    print("Source: ProPublica Nonprofit Explorer API")
    print("=" * 50)

    all_orgs = {}  # Use dict to deduplicate by EIN

    for ntee_code, label in NTEE_SEARCHES:
        print(f"\nSearching NTEE {ntee_code} — {label}")

        for page in range(5):
            data = search_nonprofits_by_ntee(ntee_code, page)
            time.sleep(1)  # Rate limiting: 1 second between API requests

            orgs = data.get("organizations", [])

            if not orgs:
                break

            for org in orgs:
                ein = org.get("ein")
                if not ein:
                    continue

                if ein in all_orgs:
                    continue

                revenue = org.get("revenue_amount") or 0
                if revenue < MIN_REVENUE:
                    continue

                if not is_impact_focused(org):
                    continue

                all_orgs[ein] = org
                print(f"  Found: {org.get('name')} (${revenue:,.0f} revenue)")

    print(f"\n{'=' * 50}")
    print(f"Total unique organizations found: {len(all_orgs)}")
    print("Writing to nonprofits_funders.csv...")

    # Write CSV output
    output_file = "nonprofits_funders.csv"

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "Company Name",
            "Website URL",
            "Type",
            "State",
            "Revenue",
            "EIN",
            "NTEE Code",
            "Slug",
            "Confidence"
        ])
        writer.writeheader()

        for ein, org in all_orgs.items():
            name = org.get("name", "")
            ntee = org.get("ntee_code", "")
            state = org.get("state", "")
            revenue = org.get("revenue_amount", 0)
            website = org.get("website") or ""

            funder_type = classify_funder_type(name, ntee, "")
            slug = generate_slug(name)

            writer.writerow({
                "Company Name": name,
                "Website URL": website,
                "Type": funder_type,
                "State": state,
                "Revenue": revenue,
                "EIN": ein,
                "NTEE Code": ntee,
                "Slug": slug,
                "Confidence": "medium"
            })

    print(f"Saved {len(all_orgs)} organizations to {output_file}")
    print("\nNext steps:")
    print("1. Review nonprofits_funders.csv")
    print("2. Filter and clean the data")
    print("3. Import into Causeartist using the funder import script")


if __name__ == "__main__":
    main()
