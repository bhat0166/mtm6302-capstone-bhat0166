// Get references to the HTML elements we need to interact with
const pokemonContainer = document.getElementById("pokemon-container");
const loadMoreButton = document.getElementById("load-more");
const allPokemonLink = document.getElementById("all-pokemon");
const uncaughtPokemonLink = document.getElementById("uncaught-pokemon");
const pokemonDetailsContainer = document.getElementById("pokemon-details");

// Show the caught Pokemon from local storage
const caughtPokemon = JSON.parse(localStorage.getItem("caughtPokemon")) || [];
let offset = 0;
let allPokemon = [];

// Load the initial set of Pokemon
document.addEventListener("DOMContentLoaded", () => {
  loadPokemon();
});

// Load more Pokemon
loadMoreButton.addEventListener("click", () => {
  loadPokemon();
});

// Display all Pokemon when the "All Pokemon" link is clicked
allPokemonLink.addEventListener("click", (e) => {
  e.preventDefault();
  displayPokemon(allPokemon);
});

// Display only uncaught Pokemon when the "Uncaught Pokemon" link is clicked
uncaughtPokemonLink.addEventListener("click", (e) => {
  e.preventDefault();
  const uncaught = allPokemon.filter(
    (pokemon) => !caughtPokemon.includes(parseUrl(pokemon.url))
  );
  displayPokemon(uncaught);
});

// Fetch and display Pokemon from the API
function loadPokemon() {
  fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=20`)
    .then((response) => response.json())
    .then((data) => {
      allPokemon = allPokemon.concat(data.results);
      displayPokemon(data.results);
      offset += 20; // Increment the offset for the next batch of Pokemon
    })
    .catch((error) => console.error("Error fetching data:", error));
}

// Display a list of Pokemon in the container
function displayPokemon(pokemonList) {
  pokemonContainer.innerHTML = ""; // Clear the current list
  pokemonList.forEach((pokemon) => {
    const pokemonId = parseUrl(pokemon.url);
    fetch(pokemon.url)
      .then((response) => response.json())
      .then((pokemonData) => {
        const typeColor = getTypeColor(pokemonData.types[0].type.name);
        const pokemonCard = document.createElement("div");
        pokemonCard.classList.add("crd");
        pokemonCard.style.backgroundColor = typeColor;
        pokemonCard.innerHTML = `
          <img class="poki" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="${
          pokemon.name
        }">
          <div>${pokemon.name}</div>
          <button class="catch-btn button">${
            caughtPokemon.includes(pokemonId) ? "Release" : "Catch"
          }</button>
        `;
        // Handle the click event for the catch/release button
        pokemonCard
          .querySelector(".catch-btn")
          .addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering the display details event
            toggleCaughtPokemon(pokemonId, pokemonCard);
          });
        // Handle the click event for the Pokemon card to display details
        pokemonCard.addEventListener("click", () => {
          displayPokemonDetails(pokemonData);
        });
        pokemonContainer.appendChild(pokemonCard);
      })
      .catch((error) => console.error("Error fetching pokemon data:", error));
  });
}

// Extract the ID from the Pokemon URL
function parseUrl(url) {
  return url.split("/").filter(Boolean).pop();
}

// Get the color associated with a Pokemon type
function getTypeColor(type) {
  const typeColors = {
    grass: "#78C850",
    fire: "#F08030",
    water: "#6890F0",
    bug: "#A8B820",
    normal: "#A8A878",
    poison: "#A040A0",
    electric: "#F8D030",
    ground: "#E0C068",
    fairy: "#EE99AC",
    fighting: "#C03028",
    psychic: "#F85888",
    rock: "#B8A038",
    ghost: "#705898",
    ice: "#98D8D8",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    flying: "#A890F0",
  };
  return typeColors[type] || "#A8A878";
}

// Display the details of a selected Pokemon
function displayPokemonDetails(pokemon) {
  pokemonDetailsContainer.innerHTML = ""; // Clear any existing details

  fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}/`)
    .then((response) => response.json())
    .then((speciesData) => {
      const evolutionChainUrl = speciesData.evolution_chain.url;

      fetch(evolutionChainUrl)
        .then((response) => response.json())
        .then((evolutionData) => {
          const evolutions = getEvolutions(evolutionData.chain);

          const detailsContainer = document.createElement("div");
          detailsContainer.classList.add("evolution-container");
          detailsContainer.innerHTML = `
            <h2>Evolution chart</h2>
            <div class="pokemon-evolution">
              ${evolutions
                .map(
                  (evo) => `
                  <div>
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png" alt="${evo.name}">
                    <br>${evo.name}
                  </div>
                `
                )
                .join("")}
            </div>
            <div class="pokemon-desc">
              <div>Height: ${pokemon.height / 10} m<br>Weight: ${
            pokemon.weight / 10
          } kg</div>
              <div>${
                speciesData.flavor_text_entries.find(
                  (entry) => entry.language.name === "en"
                ).flavor_text
              }</div>
              <div>Category: ${
                speciesData.genera.find((genus) => genus.language.name === "en")
                  .genus
              }<br>Gender: Male / Female</div>
            </div>
          `;
          pokemonDetailsContainer.appendChild(detailsContainer);
        })
        .catch((error) =>
          console.error("Error fetching evolution data:", error)
        );
    })
    .catch((error) => console.error("Error fetching Pokémon details:", error));
}

// Get the evolution chain of a Pokemon
function getEvolutions(chain) {
  const evolutions = [];
  let current = chain;

  while (current) {
    const id = parseUrl(current.species.url);
    evolutions.push({ name: current.species.name, id });
    current = current.evolves_to[0];
  }

  return evolutions;
}

// Toggle a Pokemon's caught status and update local storage
function toggleCaughtPokemon(pokemonId, card) {
  const index = caughtPokemon.indexOf(pokemonId);
  if (index > -1) {
    caughtPokemon.splice(index, 1); // Remove Pokemon from caught list
    card.querySelector(".catch-btn").textContent = "Catch";
  } else {
    caughtPokemon.push(pokemonId); // Add Pokemon to caught list
    card.querySelector(".catch-btn").textContent = "Release";
  }
  localStorage.setItem("caughtPokemon", JSON.stringify(caughtPokemon));
}
