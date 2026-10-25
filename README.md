# Starbucks Rewards Segmenter

AI solution 04 of 14 · Marketing · built for **Starbucks**

Prepared by **K Mohan Kumar**.

**Live website:** https://mohankumar3548.github.io/starbucks-customer-segments-ai/

## Problem statement

A company treats its customers using broad demographic segments, resulting in inefficient campaigns. Develop an LLM-powered customer intelligence system that discovers meaningful behavioral segments from transaction and interaction data and recommends differentiated marketing strategies.

## Why Starbucks

Starbucks Rewards records what members buy, when, where and through which channel. That is far richer than age and income, so segments can be built on behaviour and each one gets its own offer.

## Project structure

```
starbucks-customer-segments-ai/
├── index.html                 Website entry point (served by GitHub Pages)
├── frontend/
│   ├── css/style.css          Layout, typography, light and dark themes
│   └── js/
│       ├── engine.js          Maths, models, charts, page layout and AI analyst panel
│       └── model.js           Sample data and the algorithm for this problem (browser version)
├── app.py                     Streamlit dashboard (Python version of the website)
├── src/
│   ├── data_generator.py      Builds the sample dataset and saves it to data/
│   ├── model.py               The algorithm in Python (pandas, NumPy, scikit-learn)
│   ├── report.py              Writes results to reports/
│   ├── utils.py               Formatting and forecasting helpers
│   └── meta.json              Problem statement, company and algorithm steps
├── data/                      Sample data as CSV
├── reports/                   Results: results.json, summary.md and CSV tables
├── tests/test_model.py        pytest tests for the data and the model
├── requirements.txt
└── pytest.ini
```

## Algorithm

1. **Collect transactions and app data**: Visits, spend, time of day, mobile orders, food, offers
2. **Build RFM + behaviour features**: Recency, frequency, monetary plus 5 habit features
3. **Scale and reduce**: Standardise, then PCA to 2 dimensions for the map
4. **Cluster with K-means**: K-means++ for k = 3 to 7, pick by silhouette
5. **Validate segments**: Check that segments differ in value and offer response
6. **Profile and name**: Rule-based names; AI analyst can rename
7. **Strategy per segment**: Offer, channel, message and timing
8. **Track migration**: Compare old demographic groups with new segments

The same algorithm is implemented twice: in JavaScript (`frontend/js/model.js`) so the website runs in any browser with no server, and in Python (`src/model.py`) for analysis, the Streamlit dashboard and the tests.

## How to run

**Website:** open the live link above, or open `index.html` in a browser.

**Python:**

```bash
pip install -r requirements.txt
python -m src.data_generator     # create the sample data in data/
python -m src.model              # run the algorithm and write reports/
streamlit run app.py             # open the interactive dashboard
pytest                           # run the tests
```

## Data

2,500 Rewards members with 6 months of transactions and app activity (sample data). Files: `data/members.csv`. All figures are illustrative and are not Starbucks's actual numbers.

## Results (default settings, Python run)

| Measure | Value | Note |
|---|---|---|
| Members analysed | 2,500 | 6 months of activity |
| Segments found | 5 | Silhouette 0.51 |
| Top segment value | 46% | Weekday morning regulars, 28% of members |
| Spend variation cut | 60% | Less spread inside segments than inside age bands |

### Recommended actions

1. **Weekday morning regulars: Protect and upsell.** 689 members, 17.9 visits a month at $6.18. Send 'Breakfast sandwich add-on at member price' via app home screen (6 to 9 am weekdays).
2. **Weekend treat and food: Premium and food.** 460 members, 8.0 visits a month at $11.46. Send 'Seasonal menu and pastry pairings' via social + in-store (friday to sunday).
3. **Mobile order and go: Convenience.** 355 members, 11.2 visits a month at $8.63. Send 'Order-ahead perks and new-drink previews' via push notifications (lunch window).
4. **Deal seekers: Habit builder.** 549 members, 2.5 visits a month at $7.01. Send 'Visit 3 times this week for 100 bonus stars' via app offers (monday mornings).
5. **Lapsed members: Win-back.** 447 members, 1.0 visits a month at $5.92. Send 'Bonus stars on next visit within 14 days' via email + app push (day 30 and 45 after last visit).

Full output: [`reports/summary.md`](reports/summary.md) and [`reports/results.json`](reports/results.json).

## AI analyst panel

The website includes an "Ask the AI analyst" panel that answers questions about the results through Claude. It works when the page is opened as a Claude artifact on claude.ai. On GitHub Pages the models, charts and controls run in full and the panel shows that it is unavailable.
