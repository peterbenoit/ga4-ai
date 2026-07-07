export const PRESETS = [
  {
    id: "traffic-acquisition",
    label: "Traffic acquisition",
    description: "Sessions and users by channel (organic, direct, referral, paid).",
    kind: "report",
    request(dateRange) {
      return {
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "newUsers" }],
        dateRanges: [dateRange],
        limit: 100
      };
    }
  },
  {
    id: "user-acquisition",
    label: "User acquisition",
    description: "New users grouped by the channel that first brought them to the site.",
    kind: "report",
    request(dateRange) {
      return {
        dimensions: [{ name: "firstUserDefaultChannelGroup" }],
        metrics: [{ name: "activeUsers" }, { name: "newUsers" }],
        dateRanges: [dateRange],
        limit: 100
      };
    }
  },
  {
    id: "pages-and-screens",
    label: "Pages and screens",
    description: "Most-viewed pages, sorted by views.",
    kind: "report",
    request(dateRange) {
      return {
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        dateRanges: [dateRange],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 25
      };
    }
  },
  {
    id: "events",
    label: "Events",
    description: "Event counts by event name.",
    kind: "report",
    request(dateRange) {
      return {
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "activeUsers" }],
        dateRanges: [dateRange],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 25
      };
    }
  },
  {
    id: "key-events",
    label: "Key events / conversions",
    description: "Conversion counts by event name.",
    kind: "report",
    request(dateRange, metadata) {
      // GA4 renamed "conversions" to "key events"; newer properties expose
      // the metric as apiName "keyEvents" instead of "conversions", not
      // both, so pick whichever one the property's own metadata has.
      const hasKeyEvents = metadata?.metrics?.some(({ apiName }) => apiName === "keyEvents");
      const metricName = hasKeyEvents ? "keyEvents" : "conversions";

      return {
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: metricName }],
        dateRanges: [dateRange],
        orderBys: [{ metric: { metricName }, desc: true }],
        limit: 25
      };
    }
  },
  {
    id: "join-funnel",
    label: "Join funnel",
    description: "Home to /joinmvp to outbound join click, with drop-off between steps. Needs the join-click step configured before it can run.",
    kind: "funnel",
    steps: [
      {
        label: "Home page",
        dimensionFilter: {
          filter: { fieldName: "pagePath", stringFilter: { matchType: "EXACT", value: "/" } }
        }
      },
      {
        label: "/joinmvp",
        dimensionFilter: {
          filter: { fieldName: "pagePath", stringFilter: { matchType: "EXACT", value: "/joinmvp" } }
        }
      },
      {
        // TODO(MVP-2): replace with the real event/param filter for the
        // outbound join click, confirmed against GTM-M5WC82N / GTM-5LG8W55
        // or the GA4 Events report. See REQUIREMENTS-v2.md MVP-2.
        label: "Outbound join click",
        pending: true,
        dimensionFilter: null
      }
    ]
  },
  {
    id: "realtime",
    label: "Realtime",
    description: "Active users right now, by page.",
    kind: "realtime",
    request() {
      return {
        dimensions: [{ name: "unifiedScreenName" }],
        metrics: [{ name: "activeUsers" }],
        limit: 25
      };
    }
  }
];
