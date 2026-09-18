const fetch = require("node-fetch");
(async () => {
  const res = await fetch("http://localhost:5173/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: "techmedaddy/TorrentEdge" })
  });
  const data = await res.json();
  console.log("Init:", data);
  const id = data.workflow.id;
  while (true) {
    await new Promise((r) => setTimeout(r, 1000));
    const statRes = await fetch(`http://localhost:5173/api/workflows/${id}`);
    const statData = await statRes.json();
    console.log("Status:", statData.workflow.status);
    if (statData.workflow.status === "errored") {
      console.log("Errored! Data:", statData);
      break;
    }
  }
})();
