let spotifyGenres = []
const genreContainer = document.getElementById('genre-container') // Add this line
const form = document.getElementById('userForm')

// Store form data
let formData = {
  theme: '',
  genres: []
}

async function fetchGenres() {
  try {
    const response = await fetch("http://localhost:8000/api/genre")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const genres = await response.json()
    spotifyGenres = genres

    // Call renderGenres after data is loaded
    renderGenres(spotifyGenres, genreContainer)  // Add container reference

  } catch (error) {
    console.error('Error fetching genres:', error)
  }
}

function renderGenres(genres, target) {
  // Clear existing content
  target.innerHTML = ''

  // Check if genres is an array
  if (!Array.isArray(genres)) {
    console.error('Genres is not an array:', genres)
    return
  }

  // Sort genres alphabetically
  const sortedGenres = [...genres].sort()

  // Create and append elements
  sortedGenres.forEach((genre) => {
    const label = document.createElement('label')
    label.style.margin = '2px'
    label.className = 'genre-label'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.value = genre
    checkbox.id = `genre-${genre}`
    checkbox.name = "genre"

    // Create span for text
    const text = document.createElement('span')
    text.className = 'genre-text'
    text.textContent = genre.replace('-', ' ')

    // Add event listener to handle selection
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        formData.genres = [...(formData.genres || [])] // Ensure it's an array
        formData.genres.push(genre)
      } else {
        formData.genres = formData.genres.filter(g => g !== genre)
      }
      console.log('Selected genres:', formData.genres)
    })

    label.appendChild(checkbox)
    label.appendChild(text)
    target.appendChild(label)
  })
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}:${seconds.padStart(2, '0')}`
}

function renderPlaylist(recs) {
  const playlistContainer = document.getElementById('playlist-container')
  playlistContainer.innerHTML = '' // Clear existing content

  recs.forEach((rec, i) => {
    const trackElement = document.createElement('div')
    trackElement.className = 'track-element'

    // Track number
    const numberDiv = document.createElement('div')
    numberDiv.className = 'track-number'
    numberDiv.textContent = (i + 1).toString().padStart(2, '0')

    // Track info container
    const infoDiv = document.createElement('div')
    infoDiv.className = 'track-info'

    // Track name with link
    const nameDiv = document.createElement('p')
    nameDiv.className = 'track-name'
    const nameLink = document.createElement('a')
    nameLink.href = rec.url
    nameLink.className = 'track-link'
    nameLink.target = '_blank'
    nameLink.textContent = rec.name
    nameDiv.appendChild(nameLink)

    // Artists
    const artistsDiv = document.createElement('p')
    artistsDiv.className = 'track-artists'
    const artistLinks = rec.artists.map(artist => {
      return `<a href="${artist.url}" class="track-link" target="_blank">${artist.name}</a>`
    })
    artistsDiv.innerHTML = artistLinks.join(', ')

    // Duration
    const durationDiv = document.createElement('div')
    durationDiv.className = 'track-duration'
    durationDiv.textContent = formatDuration(rec.duration)

    // Assemble all elements
    infoDiv.appendChild(nameDiv)
    infoDiv.appendChild(artistsDiv)
    trackElement.appendChild(numberDiv)
    trackElement.appendChild(infoDiv)
    trackElement.appendChild(durationDiv)

    playlistContainer.appendChild(trackElement)
  })
}



fetchGenres()

// Update formData when input changes
document.getElementById('name').addEventListener('input', function (e) {
  formData.theme = e.target.value
})

// Handle form submission
form.addEventListener('submit', async function (e) {
  e.preventDefault()
  try {
    // Show loading state
    const button = form.querySelector('button')
    const originalText = button.textContent
    button.textContent = 'Generating...'
    button.disabled = true

    const recommendations = await generatePlaylist(formData)
    renderPlaylist(recommendations.playlist)
    // Reset button state
    button.textContent = originalText
    button.disabled = false

    // Optional: Clear form
    form.reset()
    formData = { theme: '', genre: [] }

  } catch (error) {
    console.error('Error:', error)
    document.getElementById('nameError').textContent = 'An error occurred. Please try again.'
  }
})

// Example async function - replace with your actual implementation
async function generatePlaylist(data) {
  // Simulate API call
  console.log('Generating playlist with data:', data)

  // Simulate delay
  const response = await fetch("http://localhost:8000/api/generate", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)  // Convert formData to JSON string
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const recs = await response.json()
  const processedRecs = recs['data'].map((song) => {
    return {
      artists: song['artists'].map((artist) => { return { name: artist['name'], url: artist['url'] } }),
      name: song['name'],
      url: song['url'],
      duration: song['duration']
    }
  })
  return {
    success: true,
    playlist: processedRecs
  }
}

