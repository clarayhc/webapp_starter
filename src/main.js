// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"

// Import the createExitSignal function from the JS+OAI shared library
import { createExitSignal, staticServer } from "./shared/server.ts"
import { getGenre, getTrackRecommendation } from "./shared/spotify.ts"
import { millisToMinutesAndSeconds } from "./utils.js"
import { promptGPT } from './shared/openai.ts'

// Create an instance of the Application and Router classes
const app = new Application()
const router = new Router()
const genre = await getGenre()
app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    // Handle preflight requests
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200
        return
    }

    await next()
})
// Configure a cutom route
// This function will run when "/api/test" is requested
router.get("/api/genre", async (ctx) => {
    console.log("Requested Genre List")

    ctx.response.body = genre
})

router.post("/api/generate", async (ctx) => {
    console.log("Requested playlist generate")
    try {
        // Get the request body
        const body = ctx.request.body()

        if (body.type === "json") {
            const value = await body.value
            console.log("Received data:", value)

            // Process the data here
            const playlist = await createWedding(value['theme'], value['genres'])

            ctx.response.body = {
                success: true,
                message: "Playlist generated successfully",
                data: playlist
            }
        } else {
            ctx.response.status = 400
            ctx.response.body = {
                success: false,
                message: "Request must be JSON"
            }
        }
    } catch (error) {
        console.error("Error processing request:", error)
        ctx.response.status = 500
        ctx.response.body = {
            success: false,
            message: "Internal server error"
        }
    }
})

// Tell the app to use the router
app.use(router.routes())
app.use(router.allowedMethods())

// Try serving undefined routes with static files
app.use(staticServer)

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000")
await app.listen({ port: 8000, signal: createExitSignal() })

async function createWedding(themeInput, genresInput) {
    //For Spotify Recommendation, you need to input spotify genres.

    // Using Select for theme
    const theme = themeInput

    // Using Select for genre
    const genre = genresInput

    // Prompt GPT for music track recommendations
    const genreResponse = await promptGPT(
        `Given a wedding playlist theme of "${theme}" and genre "${genre}", generate Spotify API recommendation parameters.
        Return a JSON object with track recommendations parameters. Focus on the most relevant parameters for this theme.
        Requirements:
        - Limit to 10 tracks
        - Include seed_genres (required)
        - Add appropriate min/max/target values for relevant audio features
        - All values should be between 0 and 1 for audio features (except tempo and key)
        - Only include parameters that make sense for the theme
    
        Example format:
        {
            "limit": 10,
            "seed_genres": ["genre1", "genre2"],
            "target_danceability": 0.7,
            "min_energy": 0.5,
            "max_energy": 0.8
        }`,
        {
            temperature: 1,
            response_format: { type: "json_object" }
        }
    )

    const request = JSON.parse(genreResponse)
    const recs = await fetchRecommendation(request, genre)
    return recs
}

/**
 * @param {RecommendationRequest} request
 * @param {string[]} genres
 */
async function fetchRecommendation(request, genres) {
    request.seed_genres = genres
    const response = await getTrackRecommendation(request)
    const tracks = response['tracks']
    const processedTracks = tracks.map((track) => {
        const artists = track['artists'].map((artist) => {
            return {
                id: artist['id'],
                name: artist['name'],
                url: artist['external_urls']['spotify'],
            }
        })
        return {
            id: track['id'],
            name: track['name'],
            artists: artists,
            popularity: track['popularity'],
            url: track['external_urls']['spotify'],
            duration: track['duration_ms'],
        }
    })
    return processedTracks
}