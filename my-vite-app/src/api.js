const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

console.log("API key:",API_KEY)



async function fetchPopularMovies() {
  try {
    console.log("Fetching movies...");

   
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`;
    console.log("URL being requested:", url);

    const res = await fetch(url);

    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

   history
    console.log("Fetched data:", data);

    
    displayMovies(data.results);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    document.getElementById('movie-container').innerHTML = '<p>Error loading movies.</p>';
  }
}
