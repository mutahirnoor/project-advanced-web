let currentPokemonData = null;
let allPokemonNames = [];

const typeColors = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD"
};

const generationLimits = {
  1: [1, 151], 2: [152, 251], 3: [252, 386],
  4: [387, 493], 5: [494, 649], 6: [650, 721],
  7: [722, 809], 8: [810, 905], 9: [906, 1010]
};

document.getElementById("fetchButton").addEventListener("click", fetchData);

document.getElementById("pokemonName").addEventListener("input", () => {
  const input = document.getElementById("pokemonName").value.toLowerCase();
  const suggestionBox = document.getElementById("suggestions");
  suggestionBox.innerHTML = "";

  if (!input || input.length < 1) return;
  const matches = allPokemonNames.filter(name => name.startsWith(input)).slice(0, 10);
  matches.forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.addEventListener("click", () => {
      document.getElementById("pokemonName").value = name;
      suggestionBox.innerHTML = "";
    });
    suggestionBox.appendChild(div);
  });
});

async function loadAllPokemonNames() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
  const data = await response.json();
  allPokemonNames = data.results.map(p => p.name);
}
loadAllPokemonNames();
createGenerationButtons();

function createGenerationButtons() {
  const container = document.getElementById("generationButtons");
  for (let gen = 1; gen <= 9; gen++) {
    const btn = document.createElement("button");
    btn.textContent = `Gen ${gen}`;
    btn.style.margin = "5px";
    btn.onclick = () => loadGeneration(gen);
    container.appendChild(btn);
  }
}

async function loadGeneration(gen) {
  const [start, end] = generationLimits[gen];
  document.getElementById("pokemonSprites").innerHTML = "Loading...";
  const promises = [];
  for (let i = start; i <= end; i++) {
    promises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json()));
  }

  const data = await Promise.all(promises);
  const spriteContainer = document.getElementById("pokemonSprites");
  spriteContainer.innerHTML = "";

  data.forEach(pokemon => {
    if (pokemon.sprites.front_default) {
      const div = document.createElement("div");
      div.style.display = "inline-block";
      div.style.margin = "10px";

      const img = document.createElement("img");
      img.src = pokemon.sprites.front_default;
      img.alt = pokemon.name;
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.borderRadius = "50%";
      img.style.cursor = "pointer";
      img.onclick = async () => {
        document.getElementById("pokemonName").value = pokemon.name;
        await fetchData();
      };

      const label = document.createElement("div");
      label.innerText = capitalizeFirstLetter(pokemon.name);

      div.appendChild(img);
      div.appendChild(label);
      spriteContainer.appendChild(div);
    }
  });
}

async function fetchData() {
  try {
    const name = document.getElementById("pokemonName").value.toLowerCase();
    if (!name) return alert("Please enter a Pokémon name.");

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!response.ok) throw new Error("Pokémon not found.");

    const data = await response.json();
    currentPokemonData = data;

    const imgElement = document.getElementById("pokemonSprite");
    imgElement.src = data.sprites.front_default;
    imgElement.style.display = "block";
    imgElement.onclick = async () => {
      showPokemonDetails(data);
      await fetchAllMoves(data.name);
      await showPokemonInfo(data);
    };

    const spriteContainer = document.getElementById("pokemonSprites");
    spriteContainer.innerHTML = "";
    displayAdditionalSprites(data);

    document.getElementById("pokemonStats").innerHTML = "";
    document.getElementById("pokemonMoves").innerHTML = "";
    document.getElementById("pokemonEvolution").innerHTML = "";
    document.getElementById("pokemonInfo").innerHTML = "";

    showPokemonDetails(data);
    await fetchEvolutionDetails(data.species.url);
    await fetchAllMoves(name);
    await showPokemonInfo(data);
    await showGameVersions(data.id);
  } catch (err) {
    console.error(err);
    document.getElementById("pokemonStats").innerHTML = "<p style='color:red;'>Pokémon not found.</p>";
    document.getElementById("pokemonSprite").style.display = "none";
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function showPokemonDetails(data) {
  const statsElement = document.getElementById("pokemonStats");
  statsElement.innerHTML = "<h3>Stats:</h3>";
  data.stats.forEach(stat => {
    statsElement.innerHTML += `<p><strong>${capitalizeFirstLetter(stat.stat.name)}:</strong> ${stat.base_stat}</p>`;
  });
}

async function fetchAllMoves(name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  const data = await res.json();

  let allMoves = [];
  for (const move of data.moves) {
    move.version_group_details.forEach(version => {
      if (version.move_learn_method.name === 'level-up') {
        allMoves.push({ move: move.move.name, level: version.level_learned_at });
      }
    });
  }

  allMoves = allMoves.filter((v, i, a) => i === a.findIndex(t => t.move === v.move && t.level === v.level));
  allMoves.sort((a, b) => a.level - b.level);
  await displayMovesTable(allMoves);
}

async function displayMovesTable(moves) {
  const container = document.getElementById("pokemonMoves");
  let html = "<h3>Moves:</h3><table border='1'><thead><tr><th>Move</th><th>Level</th><th>Accuracy</th><th>Class</th><th>Description</th></tr></thead><tbody>";

  for (const move of moves) {
    const { description, accuracy, damage_class } = await fetchMoveDescription(move.move);
    html += `<tr>
      <td>${capitalizeFirstLetter(move.move)}</td>
      <td>${move.level}</td>
      <td>${accuracy !== null ? accuracy + "%" : "—"}</td>
      <td>${capitalizeFirstLetter(damage_class)}</td>
      <td>${description}</td>
    </tr>`;
  }

  html += "</tbody></table>";
  container.innerHTML = html;
}

async function fetchMoveDescription(moveName) {
  const res = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
  const move = await res.json();

  const effect = move.effect_entries.find(e => e.language.name === "en");
  return {
    description: effect?.effect || "No description available",
    accuracy: move.accuracy,
    damage_class: move.damage_class?.name || "unknown"
  };
}

async function fetchEvolutionDetails(speciesUrl) {
  const species = await fetch(speciesUrl).then(res => res.json());
  const evoChain = await fetch(species.evolution_chain.url).then(res => res.json());
  displayEvolutionChain(evoChain.chain);
}

async function displayEvolutionChain(chain) {
  const container = document.getElementById("pokemonEvolution");
  container.innerHTML = "<h3>Evolution Chain:</h3>";

  const scrollWrapper = document.createElement("div");
  scrollWrapper.style.overflowX = "auto";
  scrollWrapper.style.whiteSpace = "nowrap";
  scrollWrapper.style.padding = "10px";

  const html = await buildEvolutionHTML(chain);
  scrollWrapper.innerHTML = html;
  container.appendChild(scrollWrapper);
}

async function buildEvolutionHTML(chain) {
  const id = getPokemonId(chain.species.url);
  const name = capitalizeFirstLetter(chain.species.name);
  const img = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" onclick="fetchDataById(${id})" style="cursor:pointer;">`;

  let html = `<div style="display: flex; flex-direction: column; align-items: center; margin: 10px;">`;
  html += `<div>${img}<br>${name}</div>`;

  if (chain.evolves_to.length > 0) {
    html += `<div style="display: flex;">`;
    for (const evo of chain.evolves_to) {
      const condition = evo.evolution_details[0];
      let triggerText = "";
      if (condition) {
        if (condition.min_level) {
          triggerText = `Level ${condition.min_level}`;
        } else if (condition.item) {
          triggerText = `Use ${capitalizeFirstLetter(condition.item.name.replace(/-/g, " "))}`;
        }
      }

      const next = await buildEvolutionHTML(evo);
      html += `<div style="margin: 0 10px; text-align: center;">
        ↓<br><small>${triggerText}</small><br>${next}
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

function getPokemonId(url) {
  return url.split("/")[6];
}

async function showPokemonInfo(data) {
  const container = document.getElementById("pokemonInfo");
  const species = await fetch(data.species.url).then(res => res.json());
  const flavor = species.flavor_text_entries.find(e => e.language.name === "en");

  const types = data.types.map(t => {
    const color = typeColors[t.type.name] || "#777";
    return `<span style="background:${color}; color:white; padding:4px 8px; border-radius:8px; margin-right:4px;">${capitalizeFirstLetter(t.type.name)}</span>`;
  }).join(" ");

  const abilities = data.abilities.map(a => capitalizeFirstLetter(a.ability.name)).join(", ");
  container.innerHTML = `
    <h3>${capitalizeFirstLetter(data.name)}</h3>
    <h3>Types:</h3><p>${types}</p>
    <h3>Abilities:</h3><p>${abilities}</p>
    <h3>Description:</h3><p>${flavor ? flavor.flavor_text.replace(/\f/g, " ") : "No description found."}</p>
  `;
}

function displayAdditionalSprites(data) {
  const container = document.getElementById("pokemonSprites");
  const sprites = [
    { label: "Front", sprite: data.sprites.front_default },
    { label: "Back", sprite: data.sprites.back_default },
    { label: "Shiny Front", sprite: data.sprites.front_shiny },
    { label: "Shiny Back", sprite: data.sprites.back_shiny }
  ];

  sprites.forEach(s => {
    if (s.sprite) {
      const div = document.createElement("div");
      div.style.margin = "10px";

      const img = document.createElement("img");
      img.src = s.sprite;
      img.alt = s.label;
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.borderRadius = "50%";
      img.style.cursor = "pointer";
      img.onclick = async () => {
        await fetchDataById(getPokemonId(data.species.url));
      };

      const label = document.createElement("div");
      label.textContent = s.label;

      div.appendChild(img);
      div.appendChild(label);
      container.appendChild(div);
    }
  });
}

async function fetchDataById(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  currentPokemonData = data;
  document.getElementById("pokemonName").value = data.name;
  await fetchData();
}

async function showGameVersions(pokemonId) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`);
  const data = await response.json();

  const versions = new Set();
  data.forEach(location => {
    location.version_details.forEach(detail => {
      versions.add(detail.version.name);
    });
  });

  const beautify = (str) =>
    str.replace(/-/g, ' ')
       .split(' ')
       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
       .join(' ');

  const versionList = Array.from(versions).sort().map(beautify);
  const container = document.getElementById("pokemonInfo");

  const toggleId = "gameVersionsToggle";
  const listId = "gameVersionsList";

  let html = `<h3>Appears In Games:</h3>`;

  if (versionList.length > 0) {
    html += `
      <button id="${toggleId}" style="margin-bottom:5px;">Show Games</button>
      <div id="${listId}" style="display:none;">
        <ul style="list-style: disc; padding-left: 20px;">
          ${versionList.map(game => `<li>${game}</li>`).join("")}
        </ul>
      </div>
    `;
  } else {
    html += `<p>Not found in any game via encounters.</p>`;
  }

  container.innerHTML += html;

  const toggleBtn = document.getElementById(toggleId);
  const listDiv = document.getElementById(listId);

  if (toggleBtn && listDiv) {
    toggleBtn.addEventListener("click", () => {
      const isVisible = listDiv.style.display === "block";
      listDiv.style.display = isVisible ? "none" : "block";
      toggleBtn.textContent = isVisible ? "Show Games" : "Hide Games";
    });
  }
}
