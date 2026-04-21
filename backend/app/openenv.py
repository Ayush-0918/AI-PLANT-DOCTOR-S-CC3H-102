from fastapi import APIRouter  # type: ignore[import]
from typing import Any, Dict
import random

router = APIRouter()

# Global simulated agricultural state for RL agents
env_state: Dict[str, Any] = {
    "crop": "Wheat",
    "soil_moisture": 60,
    "market_price": 2100,
    "weather_risk": "Low",
    "step_count": 0
}

@router.post("/reset")
def reset_env():
    global env_state
    env_state = {
        "crop": random.choice(["Wheat", "Rice", "Tomato", "Potato"]),
        "soil_moisture": random.randint(30, 90),
        "market_price": random.randint(1000, 3500),
        "weather_risk": random.choice(["Low", "Moderate", "High"]),
        "step_count": 0
    }
    return {"observation": env_state}

@router.get("/state")
def get_state():
    return {"observation": env_state}

@router.post("/step")
def step_env(action: Dict[str, Any]):
    """
    OpenEnv compatible step function.
    Action format: {"action": "SELL" | "WAIT" | "IRRIGATE"}
    """
    global env_state
    decision = str(action.get("action", "WAIT")).upper()

    reward = 0
    market_price = int(env_state["market_price"])
    soil_moisture = int(env_state["soil_moisture"])
    weather_risk = str(env_state["weather_risk"])

    # Reward logic for OpenAI Gym/OpenEnv compatibility
    if decision == "SELL":
        if market_price > 2500 and weather_risk == "High":
             reward = 2  # Best time to sell before storm
        elif market_price > 2000:
             reward = 1
        else:
             reward = -1  # Sold at low price
    elif decision == "WAIT":
        if market_price <= 2000:
             reward = 1
        elif weather_risk == "High":
             reward = -2  # Crop destroyed waiting
        else:
             reward = -1
    elif decision == "IRRIGATE":
        if soil_moisture < 40:
             reward = 1
        else:
             reward = -1

    # Step transition
    env_state["step_count"] = int(env_state["step_count"]) + 1
    env_state["market_price"] = market_price + random.randint(-300, 300)

    # Introduce random weather events
    if random.random() > 0.8:
        env_state["weather_risk"] = "High" if weather_risk == "Low" else "Low"

    step_count = int(env_state["step_count"])
    done = step_count >= 10

    return {
        "observation": env_state,
        "reward": reward,
        "done": done,
        "info": {"message": "Episode running" if not done else "Episode finished"}
    }
