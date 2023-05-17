const { ipcRenderer } = require("electron")
let renderOnce = true

const renew = () =>
    fetch("paste")
        .then((e) => e.json())
        .then((e) => update(e))

ipcRenderer.on("renew", () => renew())

function getReadableDuration(dateString) {
    const now = Date.now()
    const timestamp = parseInt(dateString)
    const elapsed = now - timestamp

    const seconds = Math.floor(elapsed / 1000)
    if (seconds < 60) {
        if (seconds < 1) return "Just now"
        return `${seconds}s ago`
    }

    const minutes = Math.floor(elapsed / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    if (hours < 24) return `${hours}hr ago`

    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24))
    return `${days}d ago`
}

if (!localStorage.background) localStorage.background = "#00151f"
if (!localStorage.maxPastes) localStorage.maxPastes = 300

if (renderOnce) {
    renew()
    renderOnce = false
}

function setBackground() {
    let color = localStorage.background

    let r = parseInt(color.slice(1, 3), 16)
    let g = parseInt(color.slice(3, 5), 16)
    let b = parseInt(color.slice(5, 7), 16)

    document.body.style.background = `rgb(${r}, ${g}, ${b}`
}
setBackground()
setInterval(() => setBackground(), 400)

function update(clipboard) {
    const query = document.getElementById("search")
    // const searchByTime = document.getElementById("default-time-filter")
    // const searchByDate = document.getElementById("default-date-filter")

    document.getElementById("clipboard").innerHTML = null
    document.getElementById("total-pastes").innerHTML = Object.keys(clipboard).length
    Object.keys(clipboard)
        .reverse()
        .slice(0, localStorage.maxPastes)
        .filter((e) =>
            query.value ? clipboard[e].text.toLowerCase().includes(query.value.toLowerCase()) : true
        )
        .forEach((pasted) => {
            const data = clipboard[pasted]
            const div = document.createElement("div")
            div.className = "pasted"
            div.innerHTML = `
                <textarea id=${
                    data.id
                } spellcheck="false" onclick="this.select(); document.execCommand('copy'); this.blur(); ipcRenderer.sendSync('done')"></textarea>

                <div class="details">
                    <div class="flex">
                        <div>${data.text.length} bytes</div>
                        <div style="margin: 0 6px">•</div>
                        <div>${getReadableDuration(data.time)}</div>
                    </div>
                    <div class="flex">
                        <div id=${"date-" + data.id} class="more">
                            <svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; height: 100%; width: 100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </div>
                        <div id=${"more-" + data.id} class="more">
                            <svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; height: 100%; width: 100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        </div>
                        <div id=${"delete-" + data.id} class="delete">
                            <svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; height: 100%; width: 100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </div>
                    </div>
                </div>
            `

            document.getElementById("clipboard").appendChild(div)
            document.getElementById(data.id).value = data.text
            document.getElementById("delete-" + data.id).onclick = () => {
                ipcRenderer.sendSync("delete", data.id)
            }
            document.getElementById("date-" + data.id).onclick = () => {
                alert(new Date(data.time).toLocaleString("en-US", { hour12: true }))
            }
            document.getElementById("more-" + data.id).onclick = () => {
                Menu.open(
                    {
                        title: new Date(data.time).toLocaleString("en-US", { hour12: true }),
                        content: `
                        Raw text content. Click to edit.
                        <code contenteditable="true" id="editable-${data.id}"></code>
        `,
                    },
                    false
                )
                setTimeout(() => {
                    document.getElementById("editable-" + data.id).innerText = data.text
                    document.getElementById("editable-" + data.id).focus()
                }, 100)
            }
        })
}
