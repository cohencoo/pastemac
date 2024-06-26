var $CONTAINER, $POPUP
var menus = []
const Menu = {
    closeBtn:
        '<button style="margin-bottom: 0; color: var(--subtext); font-weight: 500; background: var(--shade-3)" onclick="Menu.close()">Cancel</button>',
    close: function () {
        try {
            $CONTAINER.style.opacity = "0%"
            $POPUP.style.opacity = "0%"
            $POPUP.style.transform = "translate(-50%, 80%)"
            // $CONTAINER.remove(); $POPUP.remove()
            try {
                document.getElementById(menus[menus.length - 1][0]).remove()
                document.getElementById(menus[menus.length - 1][1]).remove()
            } catch (err) {}
        } catch (err) {}
    },
    open: function (data, actions = true, close = true) {
        Menu.close()
        const [title, content, cid, pid] = [
            data.title,
            data.content,
            Date.now(),
            Date.now() + 10000,
        ]
        menus.push([cid, pid])
        $CONTAINER = document.createElement("div")
        $POPUP = document.createElement("div")
        $CONTAINER.className = "menu-container"
        $POPUP.className = "menu-popup"
        $CONTAINER.id = cid
        $POPUP.id = pid

        if (close == true) $CONTAINER.onclick = () => this.close()
        setTimeout(() => {
            $CONTAINER.style.opacity = "100%"
            $POPUP.style.opacity = "100%"
            $POPUP.style.transform = "translate(-50%, -50%)"
        }, 100)
        let head = `<h2>${title}</h2>`
        !title ? (head = null) : null
        $POPUP.innerHTML = `${head}<p>${content}</p>${
            actions == true && close == true ? this.closeBtn : ""
        }`
        document.body.appendChild($POPUP)
        document.body.appendChild($CONTAINER)
    },
}
