"""Sample data for Starbucks Rewards: 2,500 members with 6 months of behaviour."""
from pathlib import Path

import numpy as np
import pandas as pd

# hidden behaviour archetypes the clustering should rediscover
ARCHETYPES = [
    dict(share=0.28, rec=3, freq=18, tick=6.2, am=0.82, mob=0.75, food=0.20, offer=0.35, wknd=0.10),
    dict(share=0.18, rec=6, freq=8, tick=11.5, am=0.35, mob=0.25, food=0.65, offer=0.30, wknd=0.55),
    dict(share=0.22, rec=28, freq=2.5, tick=7.0, am=0.45, mob=0.15, food=0.25, offer=0.70, wknd=0.45),
    dict(share=0.14, rec=4, freq=11, tick=8.5, am=0.25, mob=0.90, food=0.40, offer=0.15, wknd=0.30),
    dict(share=0.18, rec=60, freq=1.0, tick=6.0, am=0.50, mob=0.20, food=0.15, offer=0.10, wknd=0.40),
]
AGES = ["18-24", "25-34", "35-44", "45+"]


def generate(seed: int = 42) -> dict:
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(2500):
        a = ARCHETYPES[rng.choice(len(ARCHETYPES), p=[x["share"] for x in ARCHETYPES])]
        pos = lambda m, s: max(0.0, rng.normal(m, s))
        unit = lambda m: float(np.clip(rng.normal(m, 0.1), 0, 1))
        freq, tick = pos(a["freq"], a["freq"] * 0.25), pos(a["tick"], 1.2)
        rows.append({"member_id": f"R{50000 + i}", "age_band": rng.choice(AGES), "days_since_visit": round(pos(a["rec"], a["rec"] * 0.35)),
                     "visits_per_month": round(freq, 2), "avg_ticket": round(tick, 2), "spend_6m": round(freq * tick * 6, 2),
                     "morning_share": round(unit(a["am"]), 3), "mobile_order_share": round(unit(a["mob"]), 3), "food_attach": round(unit(a["food"]), 3),
                     "offer_redemption": round(unit(a["offer"]), 3), "weekend_share": round(unit(a["wknd"]), 3)})
    return {"members": pd.DataFrame(rows)}


# ---------------------------------------------------------------------------
# Save and load helpers
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def save(data: dict, folder: Path = DATA_DIR) -> None:
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    for name, df in data.items():
        df.to_csv(folder / f"{name}.csv", index=False)


def load_or_generate(folder: Path = DATA_DIR, seed: int = 42) -> dict:
    """Read the CSVs in data/ if they exist, otherwise generate fresh sample data."""
    folder = Path(folder)
    names = list(generate(seed).keys())
    if all((folder / f"{n}.csv").exists() for n in names):
        return {n: pd.read_csv(folder / f"{n}.csv") for n in names}
    return generate(seed)


if __name__ == "__main__":
    d = generate(42)
    save(d)
    for n, df in d.items():
        print(f"data/{n}.csv  {len(df):,} rows x {df.shape[1]} columns")
