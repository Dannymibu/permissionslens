const LEVELS = {
  expected: { title: "Appropriate", cls: "ok", action: "Reasonable to allow. Choose \"Only while using the app\" if your phone offers it." },
  sometimes: { title: "It depends", cls: "maybe", action: "Allow it only if you use the feature that needs it. Pick \"Ask every time\" or \"Only while using the app\", and switch it off if you stop using that feature." },
  unusual: { title: "Be cautious", cls: "warn", action: "Deny it. If the app refuses to work without it, ask why it needs it or look for a different app." },
  redflag: { title: "Red flag", cls: "bad", action: "Deny it. If the app keeps demanding it, uninstall the app and check it came from an official store." }
};

const $ = (id) => document.getElementById(id);
let perms = [];
let cats = [];

async function load() {
  try {
    const files = ["permission.json", "category.json"];
    [perms, cats] = await Promise.all(files.map((f) => fetch(f).then((r) => {
      if (!r.ok) throw new Error(f);
      return r.json();
    })));
  } catch (err) {
    const box = $("error");
    box.hidden = false;
    box.textContent = "The data files could not be loaded. Open this page through a local server (for example, run \"python -m http.server\" in this folder) and reload.";
    return;
  }
  fill($("cat"), cats, "choose an app type");
  fill($("perm"), perms, "choose a permission");
  renderGuide();
  $("cat").addEventListener("change", render);
  $("perm").addEventListener("change", render);
  render();
}

function fill(select, items, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>` +
    items.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");
}

function render() {
  const cat = cats.find((c) => c.id === $("cat").value);
  const perm = perms.find((p) => p.id === $("perm").value);
  const out = $("result");
  if (!cat || !perm) {
    out.innerHTML = `<p class="empty">Choose an app type and a permission to see the advice.</p>`;
    return;
  }
  const rule = cat.rules[perm.id] || ["unusual"];
  const key = rule[0] === "unusual" && perm.risk === "high" ? "redflag" : rule[0];
  const level = LEVELS[key];
  const why = rule[1] || `${cat.name} apps normally work fine without ${perm.name.toLowerCase()}. ${cat.unusual || ""}`;
  out.innerHTML = `
    <article class="verdict ${level.cls}">
      <h2>${level.title}</h2>
      <p class="why">${why}</p>
      <div class="cols">
        <div>
          <h3>What this permission lets an app do</h3>
          <p>${perm.what}</p>
          <p>${perm.danger}</p>
        </div>
        <div>
          <h3>What to do</h3>
          <p>${level.action}</p>
          <p>${perm.tip}</p>
        </div>
      </div>
    </article>`;
}

function renderGuide() {
  $("guide").innerHTML = perms.map((p) => `
    <button type="button" data-id="${p.id}">
      <span>${p.icon} ${p.name}</span>
      <span class="risk ${p.risk}">${p.risk[0].toUpperCase() + p.risk.slice(1)} risk</span>
    </button>`).join("");
  $("guide").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    $("perm").value = btn.dataset.id;
    render();
    $("cat").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

load();

