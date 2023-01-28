const { ipcRenderer } = require('electron');
const renew = () => fetch('paste').then(e => e.text()).then(e => update(e.split("<NEXTPASTE>")))
let renderOnce = true

if (!localStorage.background) localStorage.background = '#222222'
if (!localStorage.opacity) localStorage.opacity = 100
if (!localStorage.maxPastes) localStorage.maxPastes = 300

ipcRenderer.on('renew', () => renew())

if (renderOnce) {
    renew()
    renderOnce = false
}

function setBackground() {
    let color = localStorage.background;
    let opacity = localStorage.opacity;
  
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
  
    document.body.style.background = `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}; setBackground()

setInterval(() => setBackground(), 400)

function update(cache) {
    let searching = document.getElementById('search')
    document.getElementById('clipboard').innerHTML = null
    cache = cache.reverse().slice(0, localStorage.maxPastes);
    document.getElementById("amount").textContent = cache.length - 1 + " results";
    if (searching.value) {
        cache = cache.filter(e => e.toLowerCase().includes(searching.value.toLowerCase()))
        document.getElementById("amount").textContent = cache.length + " results";
        cache.forEach(pasted => {
            pasted = pasted.split("<PASTERECORD>");
            if (!pasted[0] || !pasted[1]) return // [0]: text. [1]: time stamp.
            
            var e = document.createElement('div')
            var field = document.createElement('textarea')
            var info = document.createElement('div')
            var wc = document.createElement('div')
    
            e.appendChild(field)
            e.appendChild(info)
            e.appendChild(wc)
            
            info.className = 'info'
            wc.className = 'wc'
            wc.innerHTML += `${pasted[0].length} characters`
            info.innerHTML += `${pasted[1]}`
    
            field.innerHTML = pasted[0]
            if (pasted[0].length > 100) field.style.fontSize = "10px";
            field.setAttribute('spellcheck', false)
            field.setAttribute('onclick', `this.select(); document.execCommand("copy"); this.blur()`)
            document.getElementById('clipboard').appendChild(e)
        })
    }
    else cache.forEach(pasted => {
        pasted = pasted.split("<PASTERECORD>");
        if (!pasted[0] || !pasted[1]) return // [0]: text. [1]: time stamp.
        
        var e = document.createElement('div')
        var field = document.createElement('textarea')
        var info = document.createElement('div')
        var wc = document.createElement('div')

        e.appendChild(field)
        e.appendChild(info)
        e.appendChild(wc)
        
        info.className = 'info'
        wc.className = 'wc'
        wc.innerHTML += `${pasted[0].length} characters`
        info.innerHTML += `${pasted[1]}`

        field.innerHTML = pasted[0]
        if (pasted[0].length > 100) field.style.fontSize = "10px";
        field.setAttribute('spellcheck', false)
        field.setAttribute('onclick', `this.select(); document.execCommand("copy"); this.blur()`)
        document.getElementById('clipboard').appendChild(e)
    });
}