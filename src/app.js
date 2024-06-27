const { ipcRenderer } = require("electron")
const dateFilter = document.getElementById("datetime-local-filter")
let renderOnce = true
let pagination = 15

const renew = () =>
    fetch("paste")
        .then((e) => e.json())
        .then((e) => update(e))

ipcRenderer.on("renew", () => {
    renew()
    document.body.style.marginTop = 0
})

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

if (renderOnce) {
    renew()
    renderOnce = false
}

window.onscroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        pagination += 15
        renew()
    }
}

document.onkeydown = (e) => {
    if (e.key === "Escape") {
        if (!document.getElementById("search").value && !dateFilter.value) minimise()
        else clearFilter()
    }
    if (e.key === "Shift") {
        shift = true
        document.body.style.overflow = "hidden"
        document.querySelectorAll("textarea").forEach((e) => (e.style.overflowY = "scroll"))
    }
}
document.onkeyup = (e) => {
    if (e.key === "Shift") {
        shift = false
        document.body.style.overflow = "auto"
        document.querySelectorAll("textarea").forEach((e) => (e.style.overflowY = "hidden"))
    }
}

function clearFilter() {
    document.getElementById("search").value = ""
    dateFilter.value = ""
    renew()
}

function minimise() {
    document.body.style.marginTop = "450px"
    setTimeout(() => {
        ipcRenderer.sendSync("done")
        // document.body.style.marginTop = 0 // "10rem"
    }, 500)
}

function update(clipboard) {
    const query = document.getElementById("search")

    document.getElementById("clearFilter").style.display =
        !query.value && !dateFilter.value ? "none" : "block"

    document.getElementById("clipboard").innerHTML = null
    const results = Object.keys(clipboard)
        .reverse()
        .filter((id) => {
            const queryValue = query.value.toLowerCase()
            const dateValue = dateFilter.value

            const compareTime = dateValue
                ? new Date(clipboard[id].time) < new Date(dateValue)
                : true
            const compareText = queryValue
                ? clipboard[id].text.toLowerCase().includes(queryValue)
                : true
            return compareTime && compareText
        })

    document.getElementById("total-pastes").innerHTML = results.length

    results
        .slice(0, pagination === Infinity && results.length > 10000 ? 3000 : pagination)
        .forEach((pasted) => {
            const data = clipboard[pasted]
            const div = document.createElement("div")
            div.className = "pasted"
            div.style.backgroundImage = data.image ? `url('${data.image}')` : undefined
            div.innerHTML = `
<textarea style="opacity: ${data.image ? 0 : 1}" id=${data.id} spellcheck="false"></textarea>
                <div class="details">
                    <div class="flex">
                        <div>${data.text.length} bytes</div>
                        <div style="margin: 0 6px">•</div>
                        <div>${getReadableDuration(data.time)}</div>
                    </div>
                    <div class="flex">
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

            document.getElementById(data.id).onclick = () => {
                if (data.image) {
                    window.open(data.image, "_blank")
                    return
                }
                document.getElementById(data.id).select()
                document.execCommand("copy")
                document.getElementById(data.id).blur()
                minimise()
            }

            document.getElementById(data.id).value = data.text
            document.getElementById("delete-" + data.id).onclick = () => {
                ipcRenderer.sendSync("delete", data.id)
            }
            document.getElementById("more-" + data.id).onclick = () => {
                if (data.image) {
                    window.open(data.image, "_blank")
                    return
                }

                Menu.open(
                    {
                        title: new Date(data.time).toLocaleString("en-US", { hour12: true }),
                        content: data.image
                            ? `<div style="margin-top: 0; outline: 0" contenteditable="true">${data.image}<br><img style="width: 100%; height: 100%;" src="${data.image}" /></div>`
                            : `<code style="margin-top: 0; outline: 0" contenteditable="true" id="editable-${data.id}"></code>`,
                    },
                    false
                )
                setTimeout(() => {
                    document.getElementById("editable-" + data.id).innerText = data.text
                    document.getElementById("editable-" + data.id).focus()
                }, 100)
            }
        })

    if (
        results.slice(0, pagination === Infinity && results.length > 10000 ? 3000 : pagination)
            .length <= 12
    ) {
        const div = document.createElement("div")
        div.onclick = () => {
            pagination = Infinity
            renew()
        }
        div.innerHTML = `<center><br><br>Not expecting the right results? How about we try this again? –– <span style="color: rgb(0, 102, 255); cursor: pointer; font-weight: 600;">Click to perform Infinite search.</span></center>`
        document.getElementById("clipboard").appendChild(div)
    }
}
