const colorValue = document.querySelector('#colorValue')
const colorPreview = document.querySelector('.colorPreview')
const colorInput = document.querySelector('#color')
const opacityInput = document.querySelector('#opacity')
const limitInput = document.querySelector('#limit')
const limiterPreview = document.querySelectorAll('.limitMarker')

function setBackground() {
  let color = localStorage.background;
  let opacity = localStorage.opacity;

  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  document.body.style.background = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Update text previews
setInterval(() => {
    try {
        setBackground()
        colorValue.textContent = localStorage.background
        colorPreview.style.background = localStorage.background
    } catch(e) {}
}, 100)

// Set values from localStorage
if (localStorage) {
    setBackground()
    try {
        colorInput.value = localStorage.background;
        opacityInput.value = localStorage.opacity;
        limitInput.value = localStorage.maxPastes;
        document.getElementById(localStorage.maxPastes).style.opacity = 1
    } catch(e) {}
}

limitInput.addEventListener('input', (e) => {
    localStorage.maxPastes = e.target.value
    for (let i = 0; i < limiterPreview.length; i++) limiterPreview[i].style.opacity = 0
    document.getElementById(localStorage.maxPastes).style.opacity = 1
})

colorInput.addEventListener('input', (e) => localStorage.background = e.target.value)
opacityInput.addEventListener('input', (e) => localStorage.opacity = e.target.value)