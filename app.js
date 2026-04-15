/* =====================================================
   Gestor de Torneo Deportivo — app.js
   Toda la lógica del torneo en un solo archivo.
   ===================================================== */

(function () {
  "use strict";

  // ========== STATE ==========
  const STORAGE_KEY = "tournament_data";

  let state = loadState() || {
    teams: [],
    groups: [],
    matches: [],       // group-phase matches
    knockout: [],      // array of rounds; each round is array of matches
    tournamentStarted: false,
    knockoutStarted: false,
  };

  // ========== DOM REFS ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const teamInput = $("#team-name-input");
  const addTeamBtn = $("#add-team-btn");
  const teamList = $("#team-list");
  const teamCount = $("#team-count");
  const generateBtn = $("#generate-tournament-btn");
  const resetBtn = $("#reset-tournament-btn");
  const groupsContainer = $("#groups-container");
  const matchesContainer = $("#matches-container");
  const standingsContainer = $("#standings-container");
  const knockoutMessage = $("#knockout-message");
  const bracketContainer = $("#bracket-container");
  const championBanner = $("#champion-banner");

  // ========== NAVIGATION ==========
  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".section").forEach((s) => s.classList.remove("active"));
      const target = btn.getAttribute("data-section");
      $(`#${target}`).classList.add("active");
    });
  });

  // ========== TEAM MANAGEMENT ==========
  addTeamBtn.addEventListener("click", addTeam);
  teamInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTeam();
  });
  resetBtn.addEventListener("click", resetTournament);
  generateBtn.addEventListener("click", generateTournament);

  function addTeam() {
    if (state.tournamentStarted) return;
    const name = teamInput.value.trim();
    if (!name) return;
    if (state.teams.some((t) => t.toLowerCase() === name.toLowerCase())) {
      alert("Ese equipo ya existe.");
      return;
    }
    state.teams.push(name);
    teamInput.value = "";
    teamInput.focus();
    save();
    renderTeams();
  }

  function removeTeam(index) {
    if (state.tournamentStarted) return;
    state.teams.splice(index, 1);
    save();
    renderTeams();
  }

  function renderTeams() {
    teamList.innerHTML = "";
    state.teams.forEach((t, i) => {
      const li = document.createElement("li");
      li.textContent = t;
      if (!state.tournamentStarted) {
        const btn = document.createElement("button");
        btn.className = "remove-team";
        btn.textContent = "✕";
        btn.title = "Eliminar equipo";
        btn.addEventListener("click", () => removeTeam(i));
        li.appendChild(btn);
      }
      teamList.appendChild(li);
    });
    teamCount.textContent = `Equipos registrados: ${state.teams.length}`;
    generateBtn.disabled = state.teams.length < 4 || state.tournamentStarted;
  }

  // ========== GENERATE TOURNAMENT ==========
  function generateTournament() {
    if (state.teams.length < 4) {
      alert("Se necesitan al menos 4 equipos para generar un torneo.");
      return;
    }
    if (state.tournamentStarted) return;

    const shuffled = shuffle([...state.teams]);
    const numGroups = calcNumGroups(shuffled.length);
    const groups = distributeGroups(shuffled, numGroups);

    state.groups = groups;
    state.matches = generateGroupMatches(groups);
    state.knockout = [];
    state.knockoutStarted = false;
    state.tournamentStarted = true;
    save();
    renderAll();

    // Navigate to groups section
    activateSection("groups-section");
  }

  function calcNumGroups(n) {
    if (n <= 6) return 2;
    if (n <= 12) return Math.ceil(n / 4);
    if (n <= 20) return Math.ceil(n / 5);
    return Math.ceil(n / 4);
  }

  function distributeGroups(teams, numGroups) {
    const groups = Array.from({ length: numGroups }, (_, i) => ({
      name: `Grupo ${String.fromCharCode(65 + i)}`,
      teams: [],
    }));
    teams.forEach((t, i) => {
      groups[i % numGroups].teams.push(t);
    });
    return groups;
  }

  function generateGroupMatches(groups) {
    const matches = [];
    groups.forEach((g) => {
      const t = g.teams;
      for (let i = 0; i < t.length; i++) {
        for (let j = i + 1; j < t.length; j++) {
          matches.push({
            group: g.name,
            home: t[i],
            away: t[j],
            homeScore: null,
            awayScore: null,
          });
        }
      }
    });
    return matches;
  }

  // ========== RENDER ALL ==========
  function renderAll() {
    renderTeams();
    renderGroups();
    renderMatches();
    renderStandings();
    renderKnockout();
  }

  // ========== RENDER GROUPS ==========
  function renderGroups() {
    groupsContainer.innerHTML = "";
    if (!state.tournamentStarted) {
      groupsContainer.innerHTML = "<p class='info-text'>Genera el torneo para ver los grupos.</p>";
      return;
    }
    state.groups.forEach((g) => {
      const card = document.createElement("div");
      card.className = "group-card";
      card.innerHTML = `<h3>${g.name}</h3><ul>${g.teams.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
      groupsContainer.appendChild(card);
    });
  }

  // ========== RENDER MATCHES ==========
  function renderMatches() {
    matchesContainer.innerHTML = "";
    if (!state.tournamentStarted) {
      matchesContainer.innerHTML = "<p class='info-text'>Genera el torneo para ver los partidos.</p>";
      return;
    }
    const byGroup = {};
    state.matches.forEach((m, idx) => {
      if (!byGroup[m.group]) byGroup[m.group] = [];
      byGroup[m.group].push({ ...m, idx });
    });

    Object.keys(byGroup).forEach((gName) => {
      const section = document.createElement("div");
      section.className = "match-group";
      section.innerHTML = `<h3>${gName}</h3>`;
      byGroup[gName].forEach((m) => {
        const played = m.homeScore !== null && m.awayScore !== null;
        const card = document.createElement("div");
        card.className = "match-card" + (played ? " played" : "");
        card.innerHTML = `
          <span class="team-name home">${esc(m.home)}</span>
          <input type="number" min="0" max="99" data-idx="${m.idx}" data-side="home" value="${m.homeScore !== null ? m.homeScore : ""}">
          <span class="vs">vs</span>
          <input type="number" min="0" max="99" data-idx="${m.idx}" data-side="away" value="${m.awayScore !== null ? m.awayScore : ""}">
          <span class="team-name away">${esc(m.away)}</span>
        `;
        section.appendChild(card);
      });
      matchesContainer.appendChild(section);
    });

    // Score input listeners
    matchesContainer.querySelectorAll("input[type=number]").forEach((inp) => {
      inp.addEventListener("change", onGroupScoreChange);
    });
  }

  function onGroupScoreChange(e) {
    const idx = parseInt(e.target.getAttribute("data-idx"), 10);
    const side = e.target.getAttribute("data-side");
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) {
      val = null;
      e.target.value = "";
    } else if (val > 99) {
      val = 99;
      e.target.value = 99;
    }
    if (side === "home") state.matches[idx].homeScore = val;
    else state.matches[idx].awayScore = val;
    save();
    renderStandings();
    checkGroupPhaseComplete();

    // Update played styling on card
    const card = e.target.closest(".match-card");
    const m = state.matches[idx];
    if (m.homeScore !== null && m.awayScore !== null) {
      card.classList.add("played");
    } else {
      card.classList.remove("played");
    }
  }

  // ========== STANDINGS ==========
  function renderStandings() {
    standingsContainer.innerHTML = "";
    if (!state.tournamentStarted) {
      standingsContainer.innerHTML = "<p class='info-text'>Genera el torneo para ver las tablas.</p>";
      return;
    }

    const qualifyPerGroup = calcQualifiedPerGroup();

    state.groups.forEach((g) => {
      const table = buildStandings(g);
      const div = document.createElement("div");
      div.className = "standings-group";
      div.innerHTML = `<h3>${g.name}</h3>`;
      const tbl = document.createElement("table");
      tbl.className = "standings-table";
      tbl.innerHTML = `
        <thead><tr>
          <th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
        </tr></thead>
        <tbody>${table.map((r, ri) => `
          <tr class="${ri < qualifyPerGroup ? "qualified" : ""}">
            <td>${esc(r.team)}</td><td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td>
            <td>${r.gf}</td><td>${r.gc}</td><td>${r.gd}</td><td><strong>${r.pts}</strong></td>
          </tr>`).join("")}
        </tbody>`;
      div.appendChild(tbl);
      standingsContainer.appendChild(div);
    });
  }

  function buildStandings(group) {
    const stats = {};
    group.teams.forEach((t) => {
      stats[t] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, gc: 0, gd: 0, pts: 0 };
    });
    state.matches
      .filter((m) => m.group === group.name && m.homeScore !== null && m.awayScore !== null)
      .forEach((m) => {
        const h = stats[m.home];
        const a = stats[m.away];
        h.played++;
        a.played++;
        h.gf += m.homeScore;
        h.gc += m.awayScore;
        a.gf += m.awayScore;
        a.gc += m.homeScore;
        if (m.homeScore > m.awayScore) {
          h.won++;
          h.pts += 3;
          a.lost++;
        } else if (m.homeScore < m.awayScore) {
          a.won++;
          a.pts += 3;
          h.lost++;
        } else {
          h.drawn++;
          a.drawn++;
          h.pts += 1;
          a.pts += 1;
        }
      });
    Object.values(stats).forEach((s) => (s.gd = s.gf - s.gc));
    // Sort by: 1) Points (desc), 2) Goal difference (desc), 3) Goals scored (desc)
    return Object.values(stats).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  function calcQualifiedPerGroup() {
    const numGroups = state.groups.length;
    // We want a power of 2 for the knockout: 2, 4, 8, 16
    const totalTeams = state.teams.length;
    let targetKnockout = 2;
    while (targetKnockout * 2 <= totalTeams && targetKnockout < 16) {
      targetKnockout *= 2;
    }
    // At least 1 per group, but also ensure we reach targetKnockout
    return Math.max(1, Math.ceil(targetKnockout / numGroups));
  }

  // ========== CHECK GROUP PHASE COMPLETE ==========
  function checkGroupPhaseComplete() {
    if (state.knockoutStarted) return;
    const allPlayed = state.matches.every((m) => m.homeScore !== null && m.awayScore !== null);
    if (allPlayed && state.matches.length > 0) {
      knockoutMessage.textContent = "¡Fase de grupos completada! Generando eliminatorias...";
      generateKnockout();
    } else {
      knockoutMessage.textContent = "Completa todos los partidos de grupo para generar las eliminatorias.";
    }
  }

  // ========== KNOCKOUT ==========
  function generateKnockout() {
    if (state.knockoutStarted) return;

    const qualified = getQualifiedTeams();
    // Make it a power of 2
    let size = 2;
    while (size < qualified.length) size *= 2;
    // Trim if more qualified than needed
    const teams = qualified.slice(0, size);

    const shuffledTeams = shuffle([...teams]);
    const firstRound = [];
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      firstRound.push({
        home: shuffledTeams[i],
        away: shuffledTeams[i + 1],
        homeScore: null,
        awayScore: null,
      });
    }

    state.knockout = [firstRound];
    state.knockoutStarted = true;
    save();
    renderKnockout();
    activateSection("knockout-section");
  }

  function getQualifiedTeams() {
    const perGroup = calcQualifiedPerGroup();
    const qualified = [];
    state.groups.forEach((g) => {
      const table = buildStandings(g);
      for (let i = 0; i < Math.min(perGroup, table.length); i++) {
        qualified.push(table[i].team);
      }
    });
    return qualified;
  }

  function getRoundName(totalRounds, roundIndex) {
    const remaining = totalRounds - roundIndex;
    if (remaining === 1) return "Final";
    if (remaining === 2) return "Semifinales";
    if (remaining === 3) return "Cuartos de Final";
    if (remaining === 4) return "Octavos de Final";
    return `Ronda ${roundIndex + 1}`;
  }

  function renderKnockout() {
    bracketContainer.innerHTML = "";
    championBanner.classList.add("hidden");

    if (!state.knockoutStarted) {
      if (state.tournamentStarted) {
        knockoutMessage.textContent = "Completa todos los partidos de grupo para generar las eliminatorias.";
      } else {
        knockoutMessage.textContent = "Genera el torneo primero.";
      }
      return;
    }

    knockoutMessage.textContent = "";

    const totalRounds = Math.ceil(Math.log2(state.knockout[0].length * 2));
    const roundsDiv = document.createElement("div");
    roundsDiv.className = "bracket-rounds";

    state.knockout.forEach((round, ri) => {
      const col = document.createElement("div");
      col.className = "bracket-round";
      const roundName = getRoundName(totalRounds, ri);
      col.innerHTML = `<h4>${roundName}</h4>`;

      round.forEach((m, mi) => {
        const decided = m.homeScore !== null && m.awayScore !== null && m.homeScore !== m.awayScore;
        const matchDiv = document.createElement("div");
        matchDiv.className = "bracket-match" + (decided ? " decided" : "");

        const homeWinner = decided && m.homeScore > m.awayScore;
        const awayWinner = decided && m.awayScore > m.homeScore;

        matchDiv.innerHTML = `
          <div class="bracket-team ${homeWinner ? "winner" : ""}">
            <span>${m.home ? esc(m.home) : '<span class="tbd">Por definir</span>'}</span>
            ${m.home && m.away ? `<input type="number" min="0" max="99" data-round="${ri}" data-match="${mi}" data-side="home" value="${m.homeScore !== null ? m.homeScore : ""}">` : ""}
          </div>
          <div class="bracket-team ${awayWinner ? "winner" : ""}">
            <span>${m.away ? esc(m.away) : '<span class="tbd">Por definir</span>'}</span>
            ${m.home && m.away ? `<input type="number" min="0" max="99" data-round="${ri}" data-match="${mi}" data-side="away" value="${m.awayScore !== null ? m.awayScore : ""}">` : ""}
          </div>
        `;
        col.appendChild(matchDiv);
      });

      roundsDiv.appendChild(col);
    });

    bracketContainer.appendChild(roundsDiv);

    // Attach listeners
    bracketContainer.querySelectorAll("input[type=number]").forEach((inp) => {
      inp.addEventListener("change", onKnockoutScoreChange);
    });

    // Check champion
    const lastRound = state.knockout[state.knockout.length - 1];
    if (lastRound.length === 1) {
      const final = lastRound[0];
      if (final.homeScore !== null && final.awayScore !== null && final.homeScore !== final.awayScore) {
        const champion = final.homeScore > final.awayScore ? final.home : final.away;
        championBanner.textContent = `🏆 ¡Campeón: ${champion}! 🏆`;
        championBanner.classList.remove("hidden");
      }
    }
  }

  function onKnockoutScoreChange(e) {
    const ri = parseInt(e.target.getAttribute("data-round"), 10);
    const mi = parseInt(e.target.getAttribute("data-match"), 10);
    const side = e.target.getAttribute("data-side");
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) {
      val = null;
      e.target.value = "";
    } else if (val > 99) {
      val = 99;
      e.target.value = 99;
    }

    const match = state.knockout[ri][mi];
    if (side === "home") match.homeScore = val;
    else match.awayScore = val;

    // Warn about ties in knockout (draws not allowed)
    if (match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore) {
      knockoutMessage.textContent = "⚠️ Los empates no están permitidos en eliminatorias. Cambia el marcador para definir un ganador.";
    } else {
      knockoutMessage.textContent = "";
    }

    // Advance winner to next round
    advanceKnockout();
    save();
    renderKnockout();
  }

  function advanceKnockout() {
    for (let ri = 0; ri < state.knockout.length; ri++) {
      const round = state.knockout[ri];
      const allDecided = round.every(
        (m) => m.homeScore !== null && m.awayScore !== null && m.homeScore !== m.awayScore
      );
      if (allDecided && round.length > 1) {
        // Need next round — ensure even number of matches for proper pairing
        if (round.length % 2 !== 0) break;
        if (ri + 1 >= state.knockout.length) {
          // Create next round from winners
          const nextRound = [];
          for (let i = 0; i + 1 < round.length; i += 2) {
            const w1 = round[i].homeScore > round[i].awayScore ? round[i].home : round[i].away;
            const w2 = round[i + 1].homeScore > round[i + 1].awayScore ? round[i + 1].home : round[i + 1].away;
            nextRound.push({ home: w1, away: w2, homeScore: null, awayScore: null });
          }
          state.knockout.push(nextRound);
        } else {
          // Update existing next round with current winners
          const nextRound = state.knockout[ri + 1];
          for (let i = 0; i + 1 < round.length; i += 2) {
            const mi = Math.floor(i / 2);
            const w1 = round[i].homeScore > round[i].awayScore ? round[i].home : round[i].away;
            const w2 = round[i + 1].homeScore > round[i + 1].awayScore ? round[i + 1].home : round[i + 1].away;
            if (nextRound[mi]) {
              // If the teams changed, reset scores
              if (nextRound[mi].home !== w1 || nextRound[mi].away !== w2) {
                nextRound[mi].home = w1;
                nextRound[mi].away = w2;
                nextRound[mi].homeScore = null;
                nextRound[mi].awayScore = null;
                // Also clear subsequent rounds
                clearSubsequentRounds(ri + 1);
              }
            }
          }
        }
      } else if (allDecided && round.length === 1) {
        // Final decided — champion is known, nothing more to do.
        // Remove any rounds beyond this
        state.knockout.length = ri + 1;
      }
    }
  }

  function clearSubsequentRounds(fromRound) {
    // Remove all rounds after fromRound
    state.knockout.length = fromRound + 1;
  }

  // ========== RESET ==========
  function resetTournament() {
    if (!confirm("¿Estás seguro de que deseas reiniciar todo el torneo?")) return;
    state = {
      teams: [],
      groups: [],
      matches: [],
      knockout: [],
      tournamentStarted: false,
      knockoutStarted: false,
    };
    save();
    renderAll();
    activateSection("teams-section");
  }

  // ========== HELPERS ==========
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function activateSection(id) {
    $$(".nav-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-section") === id);
    });
    $$(".section").forEach((s) => {
      s.classList.toggle("active", s.id === id);
    });
  }

  // ========== PERSISTENCE ==========
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // localStorage might not be available
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  // ========== INIT ==========
  renderAll();
  if (state.tournamentStarted) {
    checkGroupPhaseComplete();
  }
})();
