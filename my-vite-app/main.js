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
document.getElementById("likeButton").addEventListener("click", toggleLikeCurrentPokemon);
document.getElementById("showFavoritesButton").addEventListener("click", showFavorites);

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

    // Update like button text based on whether this Pokémon is liked
    updateLikeButton();

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
    document.getElementById("favoritesContainer").innerHTML = ""; // Clear favorites when loading new Pokémon

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

  const effect = move.effect_entries.find(entry => entry.language.name === "en");
  const description = effect ? effect.short_effect : "No description";

  return {
    description,
    accuracy: move.accuracy,
    damage_class: move.damage_class.name
  };
}

function displayAdditionalSprites(data) {
  const container = document.getElementById("pokemonSprites");
  container.innerHTML = "";

  for (const key in data.sprites) {
    const val = data.sprites[key];
    if (val && typeof val === "string" && val.endsWith(".png")) {
      const img = document.createElement("img");
      img.src = val;
      img.alt = key;
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.margin = "5px";
      container.appendChild(img);
    }
  }
}

async function fetchEvolutionDetails(speciesUrl) {
  const res = await fetch(speciesUrl);
  const speciesData = await res.json();

  if (!speciesData.evolution_chain) {
    document.getElementById("pokemonEvolution").innerHTML = "<p>No evolution data.</p>";
    return;
  }

  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  const evoContainer = document.getElementById("pokemonEvolution");
  evoContainer.innerHTML = "<h3>Evolution Chain:</h3>";

  function extractEvolutions(chain) {
    const evoChain = [];
    let current = chain;

    do {
      evoChain.push(current.species.name);
      current = current.evolves_to[0];
    } while (current && current.hasOwnProperty("evolves_to"));

    return evoChain;
  }

  const evolutions = extractEvolutions(evoData.chain);
  evolutions.forEach(pokemon => {
    const p = document.createElement("p");
    p.textContent = capitalizeFirstLetter(pokemon);
    evoContainer.appendChild(p);
  });
}

async function showPokemonInfo(data) {
  const infoContainer = document.getElementById("pokemonInfo");
  infoContainer.innerHTML = `
    <h3>${capitalizeFirstLetter(data.name)}</h3>
    <p>Height: ${data.height / 10} m</p>
    <p>Weight: ${data.weight / 10} kg</p>
    <p>Types: ${data.types.map(t => t.type.name).join(", ")}</p>
  `;
}

async function showGameVersions(id) {
  // Placeholder if you want to add game version info
}

function getFavorites() {
  const favs = localStorage.getItem("pokemonFavorites");
  return favs ? JSON.parse(favs) : [];
}

function saveFavorites(favs) {
  localStorage.setItem("pokemonFavorites", JSON.stringify(favs));
}

function updateLikeButton() {
  if (!currentPokemonData) return;
  const favs = getFavorites();
  const isFav = favs.includes(currentPokemonData.name);
  document.getElementById("likeButton").textContent = isFav ? "Unlike 💔" : "Like ❤️";
}

function toggleLikeCurrentPokemon() {
  if (!currentPokemonData) return alert("No Pokémon loaded.");

  const favs = getFavorites();
  const name = currentPokemonData.name;
  const index = favs.indexOf(name);

  if (index === -1) {
    favs.push(name);
  } else {
    favs.splice(index, 1);
  }

  saveFavorites(favs);
  updateLikeButton();
}

async function showFavorites() {
  const favs = getFavorites();
  const container = document.getElementById("favoritesContainer");
  container.innerHTML = "<h3>Your Favorite Pokémon:</h3>";

  if (favs.length === 0) {
    container.innerHTML += "<p>You have no favorite Pokémon yet.</p>";
    return;
  }

  const promises = favs.map(name => fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(res => res.json()));
  const favoritesData = await Promise.all(promises);

  favoritesData.forEach(pokemon => {
    const div = document.createElement("div");
    div.style.display = "inline-block";
    div.style.margin = "10px";
    div.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = pokemon.sprites.front_default;
    img.alt = pokemon.name;
    img.style.width = "80px";
    img.style.height = "80px";
    img.style.borderRadius = "50%";
    img.onclick = async () => {
      document.getElementById("pokemonName").value = pokemon.name;
      await fetchData();
      container.innerHTML = ""; // Hide favorites after selecting one
    };

    const label = document.createElement("div");
    label.textContent = capitalizeFirstLetter(pokemon.name);

    div.appendChild(img);
    div.appendChild(label);
    container.appendChild(div);
  });
}
