/* Starbucks Rewards Segmenter: sample data generator and algorithm for Starbucks. */
const TOOL = {
  num: 4, area: "Marketing", product: "AI Customer Segmentation", seed: 54,
  title: "Starbucks Rewards Segmenter", company: "Starbucks",
  why: "Starbucks Rewards records what members buy, when, where and through which channel. That is far richer than age and income, so segments can be built on behaviour and each one gets its own offer.",
  statement: "A company treats its customers using broad demographic segments, resulting in inefficient campaigns. Develop an LLM-powered customer intelligence system that discovers meaningful behavioral segments from transaction and interaction data and recommends differentiated marketing strategies.",
  dataNote: "2,500 Rewards members with 6 months of transactions and app activity (sample data).",
  steps: [
    ["Collect transactions and app data", "Visits, spend, time of day, mobile orders, food, offers"],
    ["Build RFM + behaviour features", "Recency, frequency, monetary plus 5 habit features"],
    ["Scale and reduce", "Standardise, then PCA to 2 dimensions for the map"],
    ["Cluster with K-means", "K-means++ for k = 3 to 7, pick by silhouette"],
    ["Validate segments", "Check that segments differ in value and offer response"],
    ["Profile and name", "Rule-based names; AI analyst can rename"],
    ["Strategy per segment", "Offer, channel, message and timing"],
    ["Track migration", "Compare old demographic groups with new segments"]
  ],
  params: [
    { id: "k", label: "Number of segments", type: "select", value: "auto", options: [{ value: "auto", label: "Auto (best silhouette)" }, { value: "3", label: "3" }, { value: "4", label: "4" }, { value: "5", label: "5" }, { value: "6", label: "6" }, { value: "7", label: "7" }] }
  ],
  questions: ["Describe each segment like a person", "Which segment is most valuable to grow?", "Suggest a campaign for the weakest segment", "Why are demographic segments worse here?"],
  generate(r) {
    const arche = [
      { n: 0.28, rec: 3, freq: 18, tick: 6.2, am: 0.82, mob: 0.75, food: 0.2, offer: 0.35, wknd: 0.1 },
      { n: 0.18, rec: 6, freq: 8, tick: 11.5, am: 0.35, mob: 0.25, food: 0.65, offer: 0.3, wknd: 0.55 },
      { n: 0.22, rec: 28, freq: 2.5, tick: 7.0, am: 0.45, mob: 0.15, food: 0.25, offer: 0.7, wknd: 0.45 },
      { n: 0.14, rec: 4, freq: 11, tick: 8.5, am: 0.25, mob: 0.9, food: 0.4, offer: 0.15, wknd: 0.3 },
      { n: 0.18, rec: 60, freq: 1.0, tick: 6.0, am: 0.5, mob: 0.2, food: 0.15, offer: 0.1, wknd: 0.4 }
    ];
    const ages = ["18-24", "25-34", "35-44", "45+"];
    const mem = [];
    for (let i = 0; i < 2500; i++) {
      const a = r.wpick(arche, arche.map(x => x.n)), j = (v, s) => Math.max(0, r.n(v, s));
      const freq = j(a.freq, a.freq * 0.25), tick = j(a.tick, 1.2);
      mem.push({ id: "R" + (50000 + i), age: r.pick(ages), rec: Math.round(j(a.rec, a.rec * 0.35)), freq, mon: freq * tick * 6, tick, am: S.clamp(r.n(a.am, 0.1), 0, 1), mob: S.clamp(r.n(a.mob, 0.12), 0, 1), food: S.clamp(r.n(a.food, 0.1), 0, 1), offer: S.clamp(r.n(a.offer, 0.1), 0, 1), wknd: S.clamp(r.n(a.wknd, 0.1), 0, 1) });
    }
    return { mem };
  },
  analyze(D, P, r) {
    const Mm = D.mem, fn = ["Recency (days)", "Visits / month", "Spend (6 mo)", "Avg ticket", "Morning share", "Mobile order share", "Food attach", "Offer redemption", "Weekend share"];
    const raw = Mm.map(m => [Math.log1p(m.rec), m.freq, Math.log1p(m.mon), m.tick, m.am, m.mob, m.food, m.offer, m.wknd]);
    const sc = M.scaler(raw), Z = raw.map(sc.t);
    const samp = S.range(500).map(() => Math.floor(r() * Z.length));
    const tried = [];
    for (let k = 3; k <= 7; k++) { const km = M.kmeans(Z, k, RNG(k * 97), 40); tried.push({ k, km, sil: M.silhouette(Z, km.labels, samp) }); }
    const best = P.k === "auto" ? [...tried].sort((a, b) => b.sil - a.sil)[0] : tried.find(t => t.k === +P.k);
    const { labels } = best.km, k = best.k; const pca = M.pca2(Z);
    const segs = S.range(k).map(c => { const g = Mm.filter((_, i) => labels[i] === c); const avg = f => S.mean(g.map(f)); return { c, n: g.length, rec: avg(m => m.rec), freq: avg(m => m.freq), mon: avg(m => m.mon), tick: avg(m => m.tick), am: avg(m => m.am), mob: avg(m => m.mob), food: avg(m => m.food), offer: avg(m => m.offer), wknd: avg(m => m.wknd), ages: [...S.groupBy(g, m => m.age)].map(([a, v]) => [a, v.length / g.length]) }; });
    const name = s => s.rec > 40 ? "Lapsed members" : s.rec > 18 && s.offer > 0.5 ? "Deal seekers" : s.freq > 14 && s.am > 0.6 ? "Weekday morning regulars" : s.mob > 0.65 ? "Mobile order and go" : s.food > 0.5 || s.tick > 10 ? "Weekend treat and food" : s.freq > 8 ? "Steady habit builders" : "Occasional visitors";
    const used = {}; segs.forEach(s => { let nm = name(s); used[nm] = (used[nm] || 0) + 1; s.name = used[nm] > 1 ? nm + " " + used[nm] : nm; });
    const strat = s => s.name.startsWith("Lapsed") ? ["Win-back", "Bonus stars on next visit within 14 days", "Email + app push", "Day 30 and day 45 after last visit"] : s.name.startsWith("Deal") ? ["Habit builder", "Visit 3 times this week, earn 100 bonus stars", "App offers", "Monday mornings"] : s.name.startsWith("Weekday") ? ["Protect and upsell", "Breakfast sandwich add-on at member price", "App home screen", "6 to 9 am weekdays"] : s.name.startsWith("Mobile") ? ["Convenience", "Order-ahead perks and new-drink previews", "Push notifications", "Lunch window"] : s.name.startsWith("Weekend") ? ["Premium and food", "Seasonal menu and pastry pairings", "Social + in-store", "Friday to Sunday"] : ["Frequency", "Double stars on a second visit day", "App offers", "Midweek"];
    segs.forEach(s => { s.share = s.n / Mm.length; s.val = s.mon * s.n; s.st = strat(s); });
    const tot = S.sum(segs.map(s => s.val)); segs.sort((a, b) => b.val - a.val);
    const order = segs.map(s => s.c);
    // demographic comparison: spread of spend inside age groups vs inside segments
    const within = grp => S.mean([...grp].map(([, v]) => S.sd(v.map(m => m.mon)) / S.mean(v.map(m => m.mon))));
    const demoCV = within(S.groupBy(Mm, m => m.age)), segCV = within(S.groupBy(Mm.map((m, i) => ({ ...m, s: labels[i] })), m => m.s));
    const pts = pca.proj.map((p, i) => ({ x: p[0], y: p[1], g: order.indexOf(labels[i]) % 7, r: 2 })).filter((_, i) => i % 2 === 0);
    const tone = i => "c" + ((i % 7) + 1);
    return {
      steps: [`${F.num(Mm.length)} members, ${F.money(S.sum(Mm.map(m => m.mon)))} spend in 6 months`, `${fn.length} features per member`, `PCA keeps ${F.pct(pca.explained[0] + pca.explained[1], 0)} of variance in 2D`, "Silhouette: " + tried.map(t => `k${t.k} ${t.sil.toFixed(2)}`).join(", "), `Chosen k = ${k}; spend per member ranges ${F.money(Math.min(...segs.map(s => s.mon)))} to ${F.money(Math.max(...segs.map(s => s.mon)))}`, segs.map(s => s.name).join(" · "), `${k} distinct plays`, `Spend spread inside groups: age ${F.pct(demoCV, 0)} vs segments ${F.pct(segCV, 0)}`],
      kpis: [
        { label: "Members analysed", value: F.num(Mm.length), note: "6 months of activity" },
        { label: "Segments found", value: String(k), note: P.k === "auto" ? `Silhouette ${best.sil.toFixed(2)}` : "Set manually" },
        { label: "Top segment value", value: F.pct(segs[0].val / tot, 0), note: `${segs[0].name}, ${F.pct(segs[0].share, 0)} of members`, tone: "good" },
        { label: "Spend variation cut", value: F.pct(1 - segCV / demoCV, 0), note: "Less spread inside behaviour segments than age bands", tone: "good" }
      ],
      sections: [
        { title: "Segment map", note: `Each dot is a member, placed by the two main patterns in their behaviour (PCA). Colour shows the segment.`, chart: C.scatter(pts, { xf: v => v.toFixed(0), yf: v => v.toFixed(0), xl: "Component 1 (engagement and frequency)", yl: "Component 2 (channel and occasion)" }) + C.legend(segs.map((s, i) => ({ label: s.name, tone: tone(i) }))) },
        { pair: [
          { title: "Share of members vs share of spend", chart: C.grouped(segs.map(s => s.name), [{ name: "Members", values: segs.map(s => s.share), tone: "c2" }, { name: "Spend", values: segs.map(s => s.val / tot), tone: "c1" }], { fmt: v => F.pct(v, 0), labelW: 180 }) + C.legend([{ label: "Share of members", tone: "c2" }, { label: "Share of spend", tone: "c1" }]) },
          { title: "Behaviour fingerprint", note: "Segment average as a share of the highest segment on each habit.", chart: (() => { const keys = [["freq", "Visits"], ["tick", "Ticket"], ["am", "Morning"], ["mob", "Mobile"], ["food", "Food"], ["offer", "Offers"], ["wknd", "Weekend"]]; const mx = keys.map(([k]) => Math.max(...segs.map(s => s[k]))); return C.heat(segs.map(s => s.name), keys.map(k => k[1]), segs.map(s => keys.map(([kk], j) => s[kk] / mx[j])), { fmt: v => Math.round(v * 100), rowW: 170, cell: 60, lo: 0, hi: 1 }); })() }
        ] },
        { title: "Segment profiles and strategy", html: T.table(["Segment", "Members", "Visits/mo", "Ticket", "Last visit", "Play", "Offer", "Channel", "Timing"], segs.map(s => [s.name, F.num(s.n), s.freq.toFixed(1), F.money(s.tick, "$", 2), Math.round(s.rec) + " days", s.st[0], s.st[1], s.st[2], s.st[3]]), { right: [1, 2, 3, 4] }) },
        { title: "Why age bands fall short", note: "Every age band contains every behaviour segment, so a campaign aimed at an age band hits the wrong people most of the time.", chart: (() => { const ages = ["18-24", "25-34", "35-44", "45+"]; return C.heat(ages, segs.map(s => C.trim(s.name, 12)), ages.map(a => segs.map(s => { const g = Mm.filter((m, i) => m.age === a); return g.filter(m => labels[Mm.indexOf(m)] === s.c).length / g.length; })), { fmt: v => F.pct(v, 0), rowW: 70, cell: 92, lo: 0, hi: 0.6 }); })() }
      ],
      recs: segs.map(s => ({ title: `${s.name}: ${s.st[0]}`, body: `${F.num(s.n)} members, ${s.freq.toFixed(1)} visits a month at ${F.money(s.tick, "$", 2)}. Send "${s.st[1]}" through ${s.st[2].toLowerCase()} on ${s.st[3].toLowerCase()}.`, impact: F.pct(s.val / tot, 0) + " of spend", tone: s.rec > 40 ? "bad" : "" })),
      recNote: "One play per segment, ordered by share of member spend.",
      context: { k, silhouette_by_k: tried.map(t => ({ k: t.k, silhouette: +t.sil.toFixed(3) })), segments: segs.map(s => ({ name: s.name, members: s.n, share_of_members: +s.share.toFixed(3), share_of_spend: +(s.val / tot).toFixed(3), visits_per_month: +s.freq.toFixed(1), avg_ticket: +s.tick.toFixed(2), days_since_visit: Math.round(s.rec), morning_share: +s.am.toFixed(2), mobile_share: +s.mob.toFixed(2), food_attach: +s.food.toFixed(2), offer_redemption: +s.offer.toFixed(2), weekend_share: +s.wknd.toFixed(2), strategy: s.st })), spend_variation_age_bands: +demoCV.toFixed(2), spend_variation_segments: +segCV.toFixed(2) }
    };
  }
};
