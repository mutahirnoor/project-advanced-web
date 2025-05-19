
---

## ⚙️ How It Works

### `index.html`

- Contains the main layout:
  - A **search bar** button.
  - Generation buttons (Gen 1 to Gen 9) created dynamically.
  - A `pokeContainer` where Pokémon cards are displayed.
  - A `pokeModal` that shows detailed info about a clicked Pokémon.

### `style.css`

- Defines responsive styles and dark theme.
- Styles the Pokémon cards, modal popups, generation buttons, and layout sections.
- Uses variables and gradients for consistent and attractive UI.

### `script.js`

#### 🔁 1. **Initial Setup**
- Defines constants like `pokeContainer`, `pokeModal`, and color mappings (`typeColors`).
- Dynamically generates generation buttons (Gen 1–9).

#### 🔍 2. **Searching Pokémon**
- The search bar listens for `input` events and filters the displayed Pokémon cards in real-time based on the user's query.

#### 🎲 3. **Random Team Generator**
- `generateRandomTeam()` picks 6 random Pokémon from the full list and fetches their data for display.

#### 📅 4. **Load Pokémon by Generation**
- `getGeneration(gen)` is called when a generation button is clicked.
- Fetches all Pokémon from that generation via `https://pokeapi.co/api/v2/generation/${gen}`.
- Clears the container and loads new cards using `createPokeCard()`.

#### 🧱 5. **Creating a Pokémon Card**
- `createPokeCard(pokemon)` builds a card with the Pokémon’s image, name, ID, and types.
- Adds an event listener to open the modal when clicked.

#### 🧬 6. **Displaying Pokémon Details**
- `showPokeDetails(pokemon)` is triggered when a card is clicked.
- Fetches:
  - Species data for flavor text and evolution chain.
  - Evolution chain using a recursive `getEvolutionChain()` function.
  - Learnable moves using `getPokemonMoves()` and `getMoveDetails()`.

- Populates the modal with:
  - Image, types, stats, description, evolution chain, and move list.

---

## 🧠 Key Functions Explained

- `capitalizeFirstLetter(string)`: Makes names look nicer.
- `getPokemonId(url)`: Extracts Pokémon ID from API [URL](https://pokeapi.co/).
- `getEvolutionChain(chain, evoList)`: Recursively gathers Pokémon names in the evolution chain.
- `getPokemonMoves(pokemon)`: Filters and fetches details of level-up moves.

---

## 🚀 How to Run

1. Download or clone the repository.
2. Open `index.html` in any modern browser.
3. Click a generation button to load Pokémon, search for one, or generate a random team!

---

## ✅ Features Checklist

- [x] Browse by generation
- [x] Real-time search
- [x] Pokémon detail modal
- [x] Evolution chain and moves
- [x] Responsive design and styling

---

## 📌 Notes

- Uses native JS (no frameworks) and the free [PokéAPI](https://pokeapi.co/).
- Caches some Pokémon data to reduce API calls and improve speed.

---


## 🧑‍💻 Author

mutahirnoor((https://github.com/mutahirnoor))


