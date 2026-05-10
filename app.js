
// ---------- STORAGE ----------
function key() {
  const u = localStorage.getItem("user");
  return "links_" + u;
}

function getLinks() {
  return JSON.parse(localStorage.getItem(key()) || "[]");
}

function saveLinks(l) {
  localStorage.setItem(key(), JSON.stringify(l));
  render();
}

// ---------- CREATE LINK ----------
function createLink() {
  const tg = document.getElementById("tg").value.trim();
  if (!tg) return alert("Enter Telegram username");

  const links = getLinks();

  links.push({
    id: Math.random().toString(36).substr(2, 8),
    tg,
    created: Date.now(),
    active: true,
    messages: 0
  });

  saveLinks(links);
}

// ---------- RENDER DASHBOARD ----------
function render() {
  const list = document.getElementById("list");
  if (!list) return;

  const links = getLinks();
  list.innerHTML = "";

  let totalMessages = 0;

  links.forEach(l => {

    const expired = Date.now() - l.created > 86400000;
    if (expired) l.active = false;

    totalMessages += l.messages || 0;

    const url = `${location.origin}/send.html?id=${l.id}`;

    const li = document.createElement("li");
    li.innerHTML = `
      ${l.active ? "🟢" : "🔴"}
      <a href="${url}" target="_blank">${url}</a>

      <button onclick="copy('${url}')">Copy</button>
      <button onclick="share('${url}')">Share</button>
      <button onclick="deleteLink('${l.id}')">X</button>
    `;
    list.appendChild(li);
  });

  document.getElementById("counter").innerText = totalMessages;

  saveLinks(links);
}

// ---------- COPY ----------
function copy(url) {
  navigator.clipboard.writeText(url);
  alert("Copied!");
}

// ---------- SHARE ----------
function share(url) {
  if (navigator.share) {
    navigator.share({
      title: "Anonymous Link",
      url: url
    });
  } else {
    copy(url);
  }
}

// ---------- DELETE ----------
function deleteLink(id) {
  let links = getLinks();
  links = links.map(l =>
    l.id === id ? { ...l, active: false } : l
  );
  saveLinks(links);
}

// ---------- SEND MESSAGE ----------
async function sendMessage() {

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const user = localStorage.getItem("user");

  const links = JSON.parse(localStorage.getItem("links_" + user) || "[]");
  const link = links.find(l => l.id === id && l.active);

  if (!link) {
    document.body.innerHTML = "<h2>Link expired</h2>";
    return;
  }

  const msg = document.getElementById("msg").value;
  if (!msg) return alert("Write message");

  // update counter
  link.messages = (link.messages || 0) + 1;
  localStorage.setItem("links_" + user, JSON.stringify(links));

  // PDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text(msg, 10, 20);

  const blob = pdf.output("blob");

  const data = new FormData();
  data.append("chat_id", "@" + link.tg);
  data.append("document", blob);

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: data
  });

  updateCounterUI(link.id);
  alert("Sent!");
}

// ---------- COPY LINK ----------
function copyLink() {
  navigator.clipboard.writeText(location.href);
  alert("Link copied!");
}

// ---------- SHARE LINK ----------
function shareLink() {
  if (navigator.share) {
    navigator.share({
      title: "Send Anonymous Message",
      url: location.href
    });
  } else {
    copyLink();
  }
}

// ---------- COUNTER ----------
function updateCounterUI(id) {
  const params = new URLSearchParams(location.search);
  const linkId = params.get("id");

  const user = localStorage.getItem("user");
  const links = JSON.parse(localStorage.getItem("links_" + user) || "[]");

  const link = links.find(l => l.id === linkId);
  if (link) {
    document.getElementById("msgCount").innerText = link.messages;
  }
}

// init
render();
updateCounterUI();