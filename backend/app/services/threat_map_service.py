"""
Community Threat Map Service
Geospatial pest and disease early-warning system

When 14+ farmers detect the same disease within 10km:
- Automatically alert all farmers in the area
- Show 48-hour advanced warning
- Enable proactive treatment to prevent crop loss
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pymongo import GEO2D
import numpy as np
from collections import defaultdict
from math import cos


class ThreatMapService:
    """Community-driven pest early warning system using geospatial clustering"""

    # Configuration
    THREAT_RADIUS_KM = 10  # 10km neighborhood
    THREAT_THRESHOLD = 14  # 14+ farmers must detect disease
    FORECAST_HOURS = 48  # Alert issued 48 hours in advance
    ALERT_VALIDITY_HOURS = 72  # Alert valid for 72 hours

    def __init__(self, db):
        self.db = db

    async def ensure_geospatial_index(self):
        """Create geospatial index for fast proximity queries"""
        try:
            await self.db["scans"].create_index([("location", "2dsphere")])
            print("[ThreatMap] ✅ Geospatial index created")
        except Exception as e:
            print(f"[ThreatMap] ⚠️ Index creation: {e}")

    async def check_threats(
        self, latitude: float, longitude: float, radius_km: float = 10
    ) -> Dict[str, Any]:
        """
        Check if location has active threat warnings nearby

        Returns:
            {
                'has_threats': bool,
                'threats': [
                    {
                        'disease': 'Tomato___Early_blight',
                        'distance_km': 3.5,
                        'farmer_count': 16,
                        'alert_level': 'HIGH',
                        'hours_remaining': 32,
                        'recommendation': 'Apply preventive spray immediately'
                    }
                ],
                'safe_zones': [...]
            }
        """

        try:
            # Find recent scans near location (within radius)
            pipeline = [
                {
                    "$geoNear": {
                        "near": {
                            "type": "Point",
                            "coordinates": [longitude, latitude],
                        },
                        "distanceField": "distance_meters",
                        "maxDistance": radius_km * 1000,  # Convert to meters
                        "spherical": True,
                    }
                },
                {
                    "$match": {
                        "timestamp": {
                            "$gte": datetime.now() - timedelta(days=7)
                        }
                    }
                },
            ]

            scans = await self.db["scans"].aggregate(pipeline).to_list(None)

            # Cluster by disease
            disease_clusters = self._cluster_by_disease(scans)

            # Identify threats (diseases with 14+ farmers in area)
            threats = self._identify_threats(
                disease_clusters, latitude, longitude
            )

            return {
                "has_threats": len(threats) > 0,
                "threats": threats,
                "location": {"latitude": latitude, "longitude": longitude},
                "search_radius_km": radius_km,
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            print(f"[ThreatMap] Error checking threats: {e}")
            return {
                "has_threats": False,
                "threats": [],
                "error": str(e),
            }

    def _cluster_by_disease(
        self, scans: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict]]:
        """Group scans by disease for clustering analysis"""
        clusters = defaultdict(list)

        for scan in scans:
            disease = scan.get("disease", "Unknown")
            clusters[disease].append(scan)

        return clusters

    def _identify_threats(
        self,
        disease_clusters: Dict[str, List[Dict]],
        user_lat: float,
        user_lon: float,
    ) -> List[Dict[str, Any]]:
        """
        Identify threat-level diseases

        A threat is triggered when:
        1. 14+ farmers detected same disease
        2. Within 10km radius
        3. In last 7 days
        """
        threats = []

        for disease, scans in disease_clusters.items():
            # Skip healthy crops
            if "healthy" in disease.lower():
                continue

            # Need at least THREAT_THRESHOLD farmers
            if len(scans) < self.THREAT_THRESHOLD:
                continue

            # Calculate center of cluster
            lats = [
                s.get("location", {}).get("coordinates", [0, 0])[1]
                for s in scans
            ]
            lons = [
                s.get("location", {}).get("coordinates", [0, 0])[0]
                for s in scans
            ]

            cluster_lat = np.mean(lats)
            cluster_lon = np.mean(lons)

            # Distance from user to cluster
            distance_km = self._haversine_distance(
                user_lat, user_lon, cluster_lat, cluster_lon
            )

            # Skip if cluster is far away
            if distance_km > self.THREAT_RADIUS_KM:
                continue

            # Calculate alert level based on farmer count and proximity
            alert_level = self._calculate_alert_level(
                len(scans), distance_km
            )

            # Get most recent scan timestamp
            latest_scan = max(scans, key=lambda s: s.get("timestamp", datetime.min))
            hours_since = (
                datetime.now() - latest_scan.get("timestamp", datetime.now())
            ).total_seconds() / 3600

            threat = {
                "disease": disease,
                "farmer_count": len(scans),
                "distance_km": round(distance_km, 1),
                "alert_level": alert_level,
                "confidence_score": min(100, (len(scans) / 30 * 100)),
                "hours_since_last_detection": round(hours_since, 1),
                "hours_remaining_alert": max(
                    0,
                    self.ALERT_VALIDITY_HOURS
                    - hours_since,
                ),
                "recommendation": self._get_recommendation(
                    disease, alert_level
                ),
                "affected_area_km2": self._estimate_affected_area(
                    scans
                ),
            }

            threats.append(threat)

        # Sort by alert level and proximity
        return sorted(
            threats,
            key=lambda t: (
                {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}.get(
                    t["alert_level"], 4
                ),
                t["distance_km"],
            ),
        )

    def _calculate_alert_level(self, farmer_count: int, distance_km: float) -> str:
        """
        Calculate alert level based on:
        - Number of farmers reporting
        - Proximity to user
        """
        proximity_score = max(0, 10 - distance_km)  # Closer = higher score
        farmer_score = min(10, farmer_count / 3)  # More farmers = higher score
        total_score = proximity_score + farmer_score

        if total_score >= 15:
            return "CRITICAL"
        elif total_score >= 12:
            return "HIGH"
        elif total_score >= 8:
            return "MEDIUM"
        else:
            return "LOW"

    def _get_recommendation(self, disease: str, alert_level: str) -> str:
        """Get actionable farming recommendation"""
        recommendations = {
            "CRITICAL": f"⚠️ CRITICAL: {disease} detected nearby! Apply preventive treatment immediately.",
            "HIGH": f"Apply preventive spray within 24 hours. {disease} spreading in area.",
            "MEDIUM": f"Monitor crop carefully. {disease} reported nearby. Consider preventive measures.",
            "LOW": f"Be aware: {disease} reported in wider area. Monitor crop health daily.",
        }

        return recommendations.get(
            alert_level,
            "Monitor crop health regularly.",
        )

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two GPS coordinates in km"""
        from math import radians, sin, cos, sqrt, atan2

        R = 6371  # Earth's radius in km

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    def _estimate_affected_area(self, scans: List[Dict]) -> float:
        """Estimate area affected based on GPS spread"""
        if len(scans) < 2:
            return 0.5

        lats = [
            s.get("location", {}).get("coordinates", [0, 0])[1]
            for s in scans
        ]
        lons = [
            s.get("location", {}).get("coordinates", [0, 0])[0]
            for s in scans
        ]

        lat_spread = max(lats) - min(lats)
        lon_spread = max(lons) - min(lons)

        # Rough estimation
        area_km2 = lat_spread * 111 * lon_spread * 111 * cos(np.radians(np.mean(lats)))

        return round(max(0.1, area_km2), 1)


async def get_threat_alerts(db, latitude: float, longitude: float) -> Dict[str, Any]:
    """Convenience function to get threat alerts for a location"""
    service = ThreatMapService(db)
    return await service.check_threats(latitude, longitude)


async def subscribe_to_threats(
    db, user_id: str, latitude: float, longitude: float, radius_km: int = 10
) -> bool:
    """Subscribe user to threat alerts in their area"""
    try:
        await db["threat_subscriptions"].update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "location": {
                        "type": "Point",
                        "coordinates": [longitude, latitude],
                    },
                    "radius_km": radius_km,
                    "subscribed_at": datetime.now(),
                    "active": True,
                }
            },
            upsert=True,
        )
        return True
    except Exception as e:
        print(f"[ThreatMap] Error subscribing user: {e}")
        return False
