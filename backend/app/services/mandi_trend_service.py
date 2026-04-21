import csv
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

from app.services.dataset_locator_service import (
    AGRICULTURE_PRICE_DATASET_CANDIDATES,
    first_existing_path,
)

logger = logging.getLogger(__name__)

class MandiTrendService:
    @staticmethod
    def get_crop_trends(state: Optional[str] = None, commodity: Optional[str] = None) -> List[Dict]:
        """
        Calculates price trends by comparing the most recent month data with previous month.
        Returns a list of commodities with their trend percentage.
        """
        csv_path = first_existing_path(AGRICULTURE_PRICE_DATASET_CANDIDATES)
        if csv_path is None:
            return []

        # Dictionary to store prices grouped by commodity and date
        # { "Potato": { "2025-06": [prices...], "2025-05": [prices...] } }
        data_store = {}

        try:
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Filters
                    if state and state.lower() not in row.get("STATE", "").lower():
                        continue
                    if commodity and commodity.lower() not in row.get("Commodity", "").lower():
                        continue

                    crop = row["Commodity"]
                    raw_date = row["Price Date"] # e.g. 6/11/2025
                    try:
                        date_obj = datetime.strptime(raw_date, "%d/%m/%Y")
                        month_key = date_obj.strftime("%Y-%m")
                        price = float(row["Modal_Price"])
                        
                        if crop not in data_store:
                            data_store[crop] = {}
                        if month_key not in data_store[crop]:
                            data_store[crop][month_key] = []
                        
                        data_store[crop][month_key].append(price)
                    except (ValueError, KeyError):
                        continue

            trends = []
            for crop, months in data_store.items():
                sorted_months = sorted(months.keys(), reverse=True)
                if len(sorted_months) < 2:
                    continue
                
                latest_month = sorted_months[0]
                prev_month = sorted_months[1]
                
                avg_latest = sum(months[latest_month]) / len(months[latest_month])
                avg_prev = sum(months[prev_month]) / len(months[prev_month])
                
                avg_latest = round(avg_latest, 2)
                avg_prev = round(avg_prev, 2)
                
                delta_pct = round(((avg_latest - avg_prev) / avg_prev) * 100, 1) if avg_prev > 0 else 0
                
                trends.append({
                    "commodity": crop,
                    "avg_price": avg_latest,
                    "prev_price": avg_prev,
                    "delta_pct": delta_pct,
                    "trend": "up" if delta_pct > 2 else "down" if delta_pct < -2 else "stable",
                    "insight": f"Prices are {'rising' if delta_pct > 0 else 'falling'} by {abs(delta_pct)}% compared to last month."
                })
            
            # Sort by highest activity/change
            return sorted(trends, key=lambda x: abs(x["delta_pct"]), reverse=True)

        except Exception as e:
            logger.error(f"Error calculating mandi trends: {e}")
            return []

mandi_trend_service = MandiTrendService()
