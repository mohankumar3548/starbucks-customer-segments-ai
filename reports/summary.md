# Starbucks Rewards Segmenter: results

Built for Starbucks. Prepared by K Mohan Kumar.

## Key figures

- **Members analysed:** 2,500 (6 months of activity)
- **Segments found:** 5 (Silhouette 0.51)
- **Top segment value:** 46% (Weekday morning regulars, 28% of members)
- **Spend variation cut:** 60% (Less spread inside segments than inside age bands)

## Algorithm, as it ran

1. **Collect transactions and app data**: 2,500 members, $991K spend in 6 months
2. **Build RFM + behaviour features**: 9 features per member
3. **Scale and reduce**: PCA keeps 73% of variance in 2D
4. **Cluster with K-means**: Silhouette: k3 0.46, k4 0.48, k5 0.51, k6 0.41, k7 0.32
5. **Validate segments**: Chosen k = 5; spend per member ranges $36 to $665
6. **Profile and name**: Weekday morning regulars | Weekend treat and food | Mobile order and go | Deal seekers | Lapsed members
7. **Strategy per segment**: 5 distinct plays
8. **Track migration**: Spend spread inside groups: age 77% vs segments 30%

## Recommended actions

1. **Weekday morning regulars: Protect and upsell.** 689 members, 17.9 visits a month at $6.18. Send 'Breakfast sandwich add-on at member price' via app home screen (6 to 9 am weekdays). *Impact: 46% of spend*
2. **Weekend treat and food: Premium and food.** 460 members, 8.0 visits a month at $11.46. Send 'Seasonal menu and pastry pairings' via social + in-store (friday to sunday). *Impact: 26% of spend*
3. **Mobile order and go: Convenience.** 355 members, 11.2 visits a month at $8.63. Send 'Order-ahead perks and new-drink previews' via push notifications (lunch window). *Impact: 21% of spend*
4. **Deal seekers: Habit builder.** 549 members, 2.5 visits a month at $7.01. Send 'Visit 3 times this week for 100 bonus stars' via app offers (monday mornings). *Impact: 6% of spend*
5. **Lapsed members: Win-back.** 447 members, 1.0 visits a month at $5.92. Send 'Bonus stars on next visit within 14 days' via email + app push (day 30 and 45 after last visit). *Impact: 2% of spend*

_Generated from sample data. Figures are illustrative._
