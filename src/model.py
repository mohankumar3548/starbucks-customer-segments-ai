"""Behavioural customer segmentation for Starbucks Rewards (RFM + habits, PCA, K-means)."""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from src.utils import bar, kpi, money, num, pct, rec, scatter, table

META = json.loads(Path(__file__).with_name("meta.json").read_text())
PARAMS = [{"name": "k", "label": "Number of segments", "options": ["auto", "3", "4", "5", "6", "7"], "default": "auto"}]
FEATURES = ["days_since_visit", "visits_per_month", "spend_6m", "avg_ticket", "morning_share", "mobile_order_share", "food_attach", "offer_redemption", "weekend_share"]


def name_segment(s):
    if s.days_since_visit > 40: return "Lapsed members"
    if s.days_since_visit > 18 and s.offer_redemption > 0.5: return "Deal seekers"
    if s.visits_per_month > 14 and s.morning_share > 0.6: return "Weekday morning regulars"
    if s.mobile_order_share > 0.65: return "Mobile order and go"
    if s.food_attach > 0.5 or s.avg_ticket > 10: return "Weekend treat and food"
    if s.visits_per_month > 8: return "Steady habit builders"
    return "Occasional visitors"


STRATEGY = {"Lapsed members": ("Win-back", "Bonus stars on next visit within 14 days", "Email + app push", "Day 30 and 45 after last visit"),
            "Deal seekers": ("Habit builder", "Visit 3 times this week for 100 bonus stars", "App offers", "Monday mornings"),
            "Weekday morning regulars": ("Protect and upsell", "Breakfast sandwich add-on at member price", "App home screen", "6 to 9 am weekdays"),
            "Mobile order and go": ("Convenience", "Order-ahead perks and new-drink previews", "Push notifications", "Lunch window"),
            "Weekend treat and food": ("Premium and food", "Seasonal menu and pastry pairings", "Social + in-store", "Friday to Sunday"),
            "Steady habit builders": ("Frequency", "Double stars on a second visit day", "App offers", "Midweek"),
            "Occasional visitors": ("Frequency", "Double stars on a second visit day", "App offers", "Midweek")}


def run(data, k="auto"):
    M = data["members"].copy()
    X = M[FEATURES].copy()
    X["days_since_visit"] = np.log1p(X["days_since_visit"]); X["spend_6m"] = np.log1p(X["spend_6m"])
    Z = StandardScaler().fit_transform(X)
    sample = np.random.default_rng(0).choice(len(Z), 600, replace=False)
    tried = []
    for kk in range(3, 8):
        km = KMeans(n_clusters=kk, n_init=10, random_state=kk).fit(Z)
        tried.append((kk, km, silhouette_score(Z[sample], km.labels_[sample])))
    best = max(tried, key=lambda t: t[2]) if k == "auto" else next(t for t in tried if t[0] == int(k))
    kk, km, sil = best
    M["segment_id"] = km.labels_
    pca = PCA(n_components=2).fit(Z); P = pca.transform(Z)
    prof = M.groupby("segment_id")[FEATURES].mean()
    prof["members"] = M.groupby("segment_id").size()
    prof["name"] = [name_segment(r) for _, r in prof.iterrows()]
    seen = {}
    for i in prof.index:
        n = prof.at[i, "name"]; seen[n] = seen.get(n, 0) + 1
        if seen[n] > 1: prof.at[i, "name"] = f"{n} {seen[n]}"
    prof["total_spend"] = M.groupby("segment_id")["spend_6m"].sum()
    prof["share_of_members"] = prof.members / len(M); prof["share_of_spend"] = prof.total_spend / prof.total_spend.sum()
    base = lambda n: n.rstrip(" 0123456789")
    for j, col in enumerate(["play", "offer", "channel", "timing"]):
        prof[col] = [STRATEGY[base(n)][j] for n in prof.name]
    prof = prof.sort_values("share_of_spend", ascending=False)
    M["segment"] = M.segment_id.map(prof.name)
    seg_cv = M.groupby("segment")["spend_6m"].apply(lambda s: s.std() / s.mean()).mean()
    age_cv = M.groupby("age_band")["spend_6m"].apply(lambda s: s.std() / s.mean()).mean()
    mapdf = pd.DataFrame({"component_1": P[::2, 0], "component_2": P[::2, 1], "segment": M.segment.values[::2]})
    mix = pd.crosstab(M.age_band, M.segment, normalize="index").round(3).reset_index()
    out = prof.reset_index()[["name", "members", "share_of_members", "share_of_spend", "visits_per_month", "avg_ticket", "days_since_visit", "morning_share", "mobile_order_share", "food_attach", "offer_redemption", "play", "offer", "channel", "timing"]].round(3)
    top = out.iloc[0]
    return {
        "steps": [f"{len(M):,} members, {money(M.spend_6m.sum())} spend in 6 months", f"{len(FEATURES)} features per member",
                  f"PCA keeps {pct(pca.explained_variance_ratio_.sum(), 0)} of variance in 2D", "Silhouette: " + ", ".join(f"k{t[0]} {t[2]:.2f}" for t in tried),
                  f"Chosen k = {kk}; spend per member ranges {money(prof.spend_6m.min())} to {money(prof.spend_6m.max())}", " | ".join(out.name),
                  f"{kk} distinct plays", f"Spend spread inside groups: age {pct(age_cv, 0)} vs segments {pct(seg_cv, 0)}"],
        "kpis": [kpi("Members analysed", num(len(M)), "6 months of activity"), kpi("Segments found", str(kk), f"Silhouette {sil:.2f}"),
                 kpi("Top segment value", pct(top.share_of_spend, 0), f"{top['name']}, {pct(top.share_of_members, 0)} of members"),
                 kpi("Spend variation cut", pct(1 - seg_cv / age_cv, 0), "Less spread inside segments than inside age bands")],
        "charts": [scatter("Segment map (PCA)", mapdf, "component_1", "component_2", "Each dot is a member placed by the two main patterns in their behaviour.", color="segment"),
                   bar("Share of members vs share of spend", out, "name", ["share_of_members", "share_of_spend"])],
        "tables": [table("Segment profiles and strategy", out), table("Why age bands fall short", mix, "Share of each age band in each behaviour segment.")],
        "recs": [rec(f"{r['name']}: {r.play}", f"{num(r.members)} members, {r.visits_per_month:.1f} visits a month at ${r.avg_ticket:.2f}. Send '{r.offer}' via {r.channel.lower()} ({r.timing.lower()}).", pct(r.share_of_spend, 0) + " of spend") for _, r in out.iterrows()],
    }


if __name__ == "__main__":
    from src.data_generator import load_or_generate
    from src.report import write_reports

    out = run(load_or_generate(), **{p["name"]: p["default"] for p in PARAMS})
    for k in out["kpis"]:
        print(f"{k['label']}: {k['value']}  {k['note']}")
    print("Reports written to", write_reports(out, META, Path(__file__).resolve().parent.parent / "reports"))
