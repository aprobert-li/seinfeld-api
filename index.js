const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Load data from JSON files
let characters = [];
let episodes = [];
let quotes = [];

function loadData() {
  try {
    characters = JSON.parse(fs.readFileSync(path.join(__dirname, 'characters.json'), 'utf8'));
    episodes = JSON.parse(fs.readFileSync(path.join(__dirname, 'episodes.json'), 'utf8'));
    quotes = JSON.parse(fs.readFileSync(path.join(__dirname, 'quotes.json'), 'utf8'));
    
    console.log('✅ Data loaded successfully');
    console.log(`📊 Loaded: ${characters.length} characters, ${episodes.length} episodes, ${quotes.length} quotes`);
  } catch (error) {
    console.error('❌ Error loading data files:', error.message);
    console.log('📋 Make sure these JSON files exist in the same directory:');
    console.log('   - characters.json');
    console.log('   - episodes.json');
    console.log('   - quotes.json');
    process.exit(1);
  }
}

// Helper functions
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, message, statusCode = 404) {
  sendJSON(res, { error: message }, statusCode);
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function filterByQuery(array, query) {
  if (!query) return array;
  
  return array.filter(item => {
    return Object.values(item).some(value => 
      value.toString().toLowerCase().includes(query.toLowerCase())
    );
  });
}

// Route handlers
function handleCharacters(req, res, pathParts, query) {
  if (pathParts.length === 2) {
    // GET /api/characters
    const filtered = filterByQuery(characters, query.search);
    sendJSON(res, { 
      total: filtered.length,
      characters: filtered 
    });
  } else if (pathParts.length === 3 && pathParts[2] === 'random') {
    // GET /api/characters/random
    sendJSON(res, getRandomItem(characters));
  } else if (pathParts.length === 3) {
    // GET /api/characters/:id
    const id = parseInt(pathParts[2]);
    const character = characters.find(c => c.id === id);
    
    if (character) {
      // Include related quotes
      const characterQuotes = quotes.filter(q => 
        q.character.toLowerCase().includes(character.name.toLowerCase())
      );
      sendJSON(res, { ...character, quotes: characterQuotes });
    } else {
      sendError(res, 'Character not found');
    }
  } else {
    sendError(res, 'Invalid characters endpoint');
  }
}

function handleEpisodes(req, res, pathParts, query) {
  if (pathParts.length === 2) {
    // GET /api/episodes
    let filtered = episodes;
    
    if (query.season) {
      filtered = filtered.filter(ep => ep.season === parseInt(query.season));
    }
    
    filtered = filterByQuery(filtered, query.search);
    
    sendJSON(res, { 
      total: filtered.length,
      episodes: filtered 
    });
  } else if (pathParts.length === 3 && pathParts[2] === 'random') {
    // GET /api/episodes/random
    sendJSON(res, getRandomItem(episodes));
  } else if (pathParts.length === 3) {
    // GET /api/episodes/:id
    const id = parseInt(pathParts[2]);
    const episode = episodes.find(ep => ep.id === id);
    
    if (episode) {
      sendJSON(res, episode);
    } else {
      sendError(res, 'Episode not found');
    }
  } else {
    sendError(res, 'Invalid episodes endpoint');
  }
}

function handleQuotes(req, res, pathParts, query) {
  if (pathParts.length === 2) {
    // GET /api/quotes
    let filtered = quotes;
    
    if (query.character) {
      filtered = filtered.filter(q => 
        q.character.toLowerCase().includes(query.character.toLowerCase())
      );
    }
    
    filtered = filterByQuery(filtered, query.search);
    
    sendJSON(res, { 
      total: filtered.length,
      quotes: filtered 
    });
  } else if (pathParts.length === 3 && pathParts[2] === 'random') {
    // GET /api/quotes/random
    sendJSON(res, getRandomItem(quotes));
  } else if (pathParts.length === 3) {
    // GET /api/quotes/:id
    const id = parseInt(pathParts[2]);
    const quote = quotes.find(q => q.id === id);
    
    if (quote) {
      sendJSON(res, quote);
    } else {
      sendError(res, 'Quote not found');
    }
  } else {
    sendError(res, 'Invalid quotes endpoint');
  }
}

function handleStats(req, res) {
  const stats = {
    totalCharacters: characters.length,
    totalEpisodes: episodes.length,
    totalQuotes: quotes.length,
    seasons: Math.max(...episodes.map(ep => ep.season)),
    apiVersion: '1.0.0'
  };
  
  sendJSON(res, stats);
}

function handleCatchphrases(req, res, pathParts, query) {
  if (pathParts.length === 2) {
    // GET /api/catchphrases
    const filtered = filterByQuery(catchphrases, query.search);
    sendJSON(res, { 
      total: filtered.length,
      catchphrases: filtered 
    });
  } else if (pathParts.length === 3 && pathParts[2] === 'random') {
    // GET /api/catchphrases/random
    sendJSON(res, getRandomItem(catchphrases));
  } else if (pathParts.length === 3) {
    // GET /api/catchphrases/:id
    const id = parseInt(pathParts[2]);
    const phrase = catchphrases.find(p => p.id === id);
    
    if (phrase) {
      sendJSON(res, phrase);
    } else {
      sendError(res, 'Catchphrase not found');
    }
  } else {
    sendError(res, 'Invalid catchphrases endpoint');
  }
}

// Main request handler
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split('/').filter(part => part);
  const query = parsedUrl.query;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Only handle GET requests
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405);
    return;
  }

  // Root endpoint - API documentation
  if (pathParts.length === 0) {
    const documentation = {
      message: "Welcome to the Seinfeld API!",
      version: "1.0.0",
      endpoints: {
        characters: {
          "GET /api/characters": "Get all characters",
          "GET /api/characters/:id": "Get character by ID",
          "GET /api/characters/random": "Get random character",
          "Query params": "?search=term"
        },
        episodes: {
          "GET /api/episodes": "Get all episodes",
          "GET /api/episodes/:id": "Get episode by ID", 
          "GET /api/episodes/random": "Get random episode",
          "Query params": "?season=1&search=term"
        },
        quotes: {
          "GET /api/quotes": "Get all quotes",
          "GET /api/quotes/:id": "Get quote by ID",
          "GET /api/quotes/random": "Get random quote",
          "Query params": "?character=name&search=term"
        },
        stats: {
          "GET /api/stats": "Get API statistics"
        }
      },
      examples: [
        "/api/characters",
        "/api/episodes?season=5",
        "/api/quotes/random",
        "/api/quotes?character=george"
      ]
    };
    
    sendJSON(res, documentation);
    return;
  }

  // API routes
  if (pathParts[0] === 'api') {
    if (pathParts.length < 2) {
      sendError(res, 'Invalid API endpoint', 400);
      return;
    }

    const endpoint = pathParts[1];

    switch (endpoint) {
      case 'characters':
        handleCharacters(req, res, pathParts, query);
        break;
      case 'episodes':
        handleEpisodes(req, res, pathParts, query);
        break;
      case 'quotes':
        handleQuotes(req, res, pathParts, query);
        break;
      case 'stats':
        handleStats(req, res);
        break;
      default:
        sendError(res, 'Endpoint not found');
    }
  } else {
    sendError(res, 'Not found');
  }
}

// Create and start server
const PORT = process.env.PORT || 3000;

// Load data before starting server
loadData();

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`🥨 Seinfeld API server running on port ${PORT}`);
  console.log(`📖 Documentation available at http://localhost:${PORT}`);
  console.log(`🎭 Try: http://localhost:${PORT}/api/characters`);
});