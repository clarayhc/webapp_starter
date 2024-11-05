let artStyles = []
const styleContainer = document.getElementById('style-container')
const form = document.getElementById('userForm')

// Store form data
let formData = {
    theme: '',
    styles: []
}

async function fetchStyles() {
    try {
        const response = await fetch("http://localhost:8000/api/styles")
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const styles = await response.json()
        artStyles = styles
        renderStyles(artStyles, styleContainer)
    } catch (error) {
        console.error('Error fetching styles:', error)
    }
}

function renderStyles(styles, target) {
    target.innerHTML = ''
    if (!Array.isArray(styles)) return

    styles.sort().forEach(style => {
        const label = document.createElement('label')
        label.className = 'style-label'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.value = style
        checkbox.name = "style"

        const text = document.createElement('span')
        text.className = 'style-text'
        text.textContent = style.replace('-', ' ')

        checkbox.addEventListener('change', e => {
            if (e.target.checked) {
                formData.styles.push(style)
            } else {
                formData.styles = formData.styles.filter(s => s !== style)
            }
        })

        label.appendChild(checkbox)
        label.appendChild(text)
        target.appendChild(label)
    })
}

function renderInspirations(inspirations) {
    const container = document.getElementById('inspiration-container')
    container.innerHTML = ''

    inspirations.forEach((insp, i) => {
        const element = document.createElement('div')
        element.className = 'inspiration-element'
        element.innerHTML = `<div class="inspiration-number">${i + 1}</div>
                             <div class="inspiration-info">
                                 <p class="inspiration-name">${insp.name}</p>
                                 <p class="inspiration-styles">${insp.styles.join(', ')}</p>
                             </div>`
        container.appendChild(element)
    })
}

form.addEventListener('submit', async function (e) {
    e.preventDefault()
    const button = form.querySelector('button')
    button.disabled = true
    button.textContent = 'Generating...'

    try {
        const response = await fetch("http://localhost:8000/api/generateInspiration", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Error generating inspiration')

        const data = await response.json()
        renderInspir
