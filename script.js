let contentChart, revenueChart, actorChart, mapChart;
let rowsGlobal = [];
let worldFeatures = [];
let compareMode = false;

fetch("data.csv")
  .then(res => res.text())
  .then(csv => {
    rowsGlobal = csv.trim().split("\n").slice(1);
    const select = document.getElementById("countrySelect");

    [...new Set(rowsGlobal.map(r => r.split(",")[1]))]
      .forEach(c => {
        let o = document.createElement("option");
        o.value = c;
        o.textContent = c;
        select.appendChild(o);
      });

    fetch("https://unpkg.com/world-atlas/countries-110m.json")
      .then(res => res.json())
      .then(world => {
        worldFeatures = ChartGeo.topojson.feature(
          world,
          world.objects.countries
        ).features;

        render("All");
      });

    select.addEventListener("change", e => {
      compareMode = false;
      render(e.target.value);
    });
  });

document.getElementById("compareBtn").onclick = () => {
  compareMode = true;
  render("COMPARE");
};

document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
};

function render(selected) {

  let totalMin = 0, totalRev = 0;
  let content = { Music: 0, Movies: 0, Series: 0, Anime: 0 };
  let actors = {}, revenueCountry = {};

  rowsGlobal.forEach(r => {
    const c = r.split(",");
    const country = c[1];

    if (
      (selected !== "All" && !compareMode && country !== selected) ||
      (compareMode && country !== "India" && country !== "USA")
    ) return;

    const cont = c[2];
    const actor = c[4];
    const min = +c[5];
    const rev = +c[6];

    totalMin += min;
    totalRev += rev;
    content[cont] += min;
    actors[actor] = (actors[actor] || 0) + min;
    revenueCountry[country] = (revenueCountry[country] || 0) + rev;
  });

  document.getElementById("countryCount").textContent =
    compareMode ? 2 : selected === "All" ? Object.keys(revenueCountry).length : 1;
  document.getElementById("totalMinutes").textContent = totalMin.toLocaleString();
  document.getElementById("totalRevenue").textContent = totalRev.toLocaleString();

  const topActor = Object.keys(actors)
    .reduce((a, b) => actors[a] > actors[b] ? a : b);

  const topContent = Object.keys(content)
    .reduce((a, b) => content[a] > content[b] ? a : b);

  document.getElementById("countryInsight").textContent =
    `Top Content: ${topContent} | Top Actor: ${topActor}`;

  if (contentChart) contentChart.destroy();
  if (revenueChart) revenueChart.destroy();
  if (actorChart) actorChart.destroy();
  if (mapChart) mapChart.destroy();

  contentChart = new Chart(contentChartEl(), {
    type: "bar",
    data: { labels: Object.keys(content), datasets: [{ data: Object.values(content) }] }
  });

  revenueChart = new Chart(revenueChartEl(), {
    type: "doughnut",
    data: { labels: Object.keys(revenueCountry), datasets: [{ data: Object.values(revenueCountry) }] }
  });

  const topActors = Object.entries(actors).sort((a,b)=>b[1]-a[1]).slice(0,10);
  actorChart = new Chart(actorChartEl(), {
    type: "bar",
    data: { labels: topActors.map(a=>a[0]), datasets: [{ data: topActors.map(a=>a[1]) }] },
    options:{ indexAxis:"y" }
  });

  mapChart = new Chart(mapChartEl(), {
    type: "choropleth",
    data: {
      labels: worldFeatures.map(d => d.properties.name),
      datasets: [{
        label: "Revenue",
        data: worldFeatures.map(f => ({
          feature: f,
          value: revenueCountry[f.properties.name] || 0
        }))
      }]
    },
    options: {
      onClick: (_, els) => {
        if (els.length) {
          const name = worldFeatures[els[0].index].properties.name;
          document.getElementById("countrySelect").value = name;
          compareMode = false;
          render(name);
        }
      },
      scales: {
        projection: { axis: "x", projection: "equalEarth" }
      }
    }
  });
}

const contentChartEl = () => document.getElementById("contentChart");
const revenueChartEl = () => document.getElementById("revenueChart");
const actorChartEl = () => document.getElementById("actorChart");
const mapChartEl = () => document.getElementById("mapChart");
