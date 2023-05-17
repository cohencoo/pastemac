const colorValue = document.querySelector("#colorValue")
const colorPreview = document.querySelector(".colorPreview")
const colorInput = document.querySelector("#color")
const limitInput = document.querySelector("#limit")
const limitPreview = document.querySelector(".limitPreview")

function setBackground() {
    let color = localStorage.background

    let r = parseInt(color.slice(1, 3), 16)
    let g = parseInt(color.slice(3, 5), 16)
    let b = parseInt(color.slice(5, 7), 16)

    document.body.style.background = `rgb(${r}, ${g}, ${b}`
}

if (localStorage) {
    setBackground()
    try {
        colorInput.value = localStorage.background
        colorValue.textContent = localStorage.background
        colorPreview.style.background = localStorage.background
        limitInput.value = localStorage.maxPastes
        limitPreview.textContent = localStorage.maxPastes
    } catch (e) {}
}

colorInput.addEventListener("input", (e) => {
    localStorage.background = e.target.value
    colorValue.textContent = e.target.value
    colorPreview.style.background = e.target.value
    setBackground()
})
limitInput.addEventListener("input", (e) => {
    localStorage.maxPastes = e.target.value
    limitPreview.textContent = e.target.value
})
