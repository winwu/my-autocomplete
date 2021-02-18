import utils from './helpers/Utils.js'
import LocalStorageHandler from './helpers/LocalStorageHandler.js'
import Item from './Item.js'

class MyAutoComplete {
    private requestUrl: string = ''
    private storeNameSpace: string
    private searchBar: HTMLElement | null
    private searchInput: HTMLInputElement | undefined
    private listContainer: HTMLElement = document.createElement('div')
    private lists: any[] = []
    private total: number = 0 // @TODO

    private _store: any // @TODO
    private _current: number = -1
    private _timerForInput: number = 0
    private _timerForKeyDown: number = 0

    constructor(options: { requestUrl: string; searchBar: any; storeNameSpace: string }) {
        this.listContainer.className = 'list_container'

        /** _setUpOptions */
        // validate
        if (!options.requestUrl) {
            throw new Error('option requestUrl should not be empty')
        }
        if (!options.storeNameSpace) {
            throw new Error('option storeNameSpace should not be empty')
        }
        if (!options.searchBar) {
            throw new Error('option searchBar should not be empty')
        }
        if (options.searchBar.getElementsByTagName('input').length <= 0) {
            throw new Error('please provide <input> in searchBar container')
        }

        this.requestUrl = options.requestUrl
        this.storeNameSpace = options.storeNameSpace || `random_ns_${Math.random().toString(36).substring(5)}`
        this.searchBar = options.searchBar
        if (this.searchBar) {
            this.searchInput = this.searchBar.getElementsByTagName('input')[0] || null
            this.searchInput.insertAdjacentHTML('afterend', this.listContainer.outerHTML)
            this.listContainer = this.searchBar.getElementsByClassName('list_container')[0] as HTMLElement
        }

        this.fetchAppList()
            .then((r) => r.json())
            .then((data) => {
                if (data && data.items) {
                    const newList: any[] = []
                    data.items.map((item: any) => {
                        // turn object to Item instance.
                        newList.push(new Item(item))
                    })
                    this.lists = newList
                    this.total = this.lists.length
                    this.initLocalstorage()
                    this.listContainer.innerHTML = this.renderItemList(this.lists)
                    this.start()
                } else {
                    throw new Error('response format does not match')
                }
            })
    }

    initLocalstorage() {
        /*
         * create an object in localstorage for record search history.
         *
         * if localstorage have record, get timestamp from localstorage, else create an Object in localstorage.
         */
        this._store = new LocalStorageHandler(this.storeNameSpace)
        const initToLs: any = {}
        const dataFormLs = this._store.getAll()
        if (this.lists) {
            this.lists.map((app) => {
                if (dataFormLs && dataFormLs.hasOwnProperty(app.id)) {
                    app.ts = dataFormLs[app.id]
                } else {
                    app.ts = 0
                }
                initToLs[app.id] = app.ts
            })
        }
        this._store.initObject(initToLs)
    }

    fetchAppList(): Promise<Response> {
        return fetch(this.requestUrl)
    }

    renderItemList(list: any[]) {
        // before render, should sort by timestamp.
        list = utils.sortAryByKey(list, 'ts')

        if (list.length) {
            return `<ul role="menu">
                ${list
                    .map((item) => {
                        return item.render()
                    })
                    .join('')}
            </ul>`
        }
        return `<ul class="ul_no_data">
            <li>Sorry, now is no results.</li>
        </ul>`
    }

    start() {
        window.addEventListener('click', this.clickOutSideHandler.bind(this), false)

        if (this.searchInput) {
            this.searchInput.addEventListener('focus', this.inputFocusHandler.bind(this), false)

            this.searchInput.addEventListener('blur', this.inputBlurHandler.bind(this), false)

            this.searchInput.addEventListener('input', this.inputChangeHandler.bind(this), false)

            this.searchInput.addEventListener('keydown', this.inputKeyDownHandler.bind(this), false)
        }

        this.listContainer.addEventListener('mousedown', this.listMouseDownHandler.bind(this), false)

        this.listContainer.addEventListener('keydown', this.resultKeyDownHandler.bind(this), false)
    }

    clickOutSideHandler(e: { target: any }) {
        if (this.searchBar?.contains(e.target)) {
            // click inside.
        } else {
            // Clicked outside the box, should close ul
            this.searchInput?.blur()
            utils.removeClass(this.searchBar?.querySelector('ul'), 'active')
        }
    }

    inputFocusHandler() {
        utils.addClass(this.searchBar?.querySelector('ul'), 'active')
    }

    inputBlurHandler() {
        utils.removeClass(this.searchBar?.querySelector('ul'), 'active')
    }

    inputChangeHandler(e: { target: any }) {
        const val = e.target.value
        // debunce event trigger
        window.clearTimeout(this._timerForInput)
        this._timerForInput = window.setTimeout(() => {
            this.filterLists(val)
            this.reRender()
            // key ul open
            utils.addClass(this.listContainer.querySelector('ul'), 'active')
        }, 300)
    }

    listMouseDownHandler(e: any) {
        e.stopPropagation()
        // safari need to  uese composedPath.
        const path = e.path || (e.composedPath && e.composedPath())

        let targetCode = null
        let targetEle = null
        let id = null

        for (const index in path) {
            if (path[index]) {
                if (utils.hasClass(path[index], 'remove')) {
                    targetCode = 'REMOVE'
                    targetEle = path[index]
                    break
                }
                if (utils.hasClass(path[index], 'app_item')) {
                    targetCode = 'APP_ITEM'
                    targetEle = path[index]
                    break
                }
            }
        }

        if (!targetCode || !targetEle) {
            return
        }

        id = targetEle.getAttribute('data-id')

        if (!id) {
            throw new Error('can not capture data-id attribute')
        }

        switch (targetCode) {
            case 'REMOVE':
                // prevent ul to be closed.
                e.preventDefault()

                const item = this.findItemInLists(id)
                if (item) {
                    const ts = 0
                    this._store.update(id, ts)
                    item.ts = ts
                    this.reRender()

                    // keep ul still open.
                    this.searchInput?.blur()
                    this.searchInput?.focus()
                    return
                }
                break
            case 'APP_ITEM':
                this.itemOnHit(id, (app: { name: any }) => {
                    // append new string to input.
                    if (this.searchInput) {
                        this.searchInput.value = app.name
                    }

                    // reset all as visible
                    this.lists.map((app2) => {
                        app2.visible = true
                    })

                    this.reRender()
                })
                break
            default:
                break
        }
    }

    resultKeyDownHandler(e: any) {
        e.preventDefault()
        e.stopPropagation()

        const lis = this.listContainer?.querySelector('ul')?.getElementsByTagName('li')
        // let totalLisCount = [...e.target.parentElement.children].length;
        const totalLisCount = lis?.length ?? 0
        const code = e.keyCode ? +e.keyCode : +e.which

        switch (code) {
            case 38: // up
                if (this._current > 0) {
                    this._current--
                } else if (this._current === 0) {
                    this._current = totalLisCount - 1
                } else {
                    this._current = -1
                }
                break
            case 40: // down
                if (this._current < totalLisCount - 1) {
                    this._current++
                } else {
                    this._current = 0
                }
                break
            case 13: // Enter
                if (e.target.querySelector('.app_item')) {
                    const id = e.target.querySelector('.app_item').getAttribute('data-id')

                    if (!id) {
                        return
                    }

                    // update current index
                    this._current = 0

                    this.itemOnHit(id, (app: any) => {
                        // append new string to input.
                        if (this.searchInput) {
                            this.searchInput.value = app.name
                        }
                        /*
                         * set focus for  Safari keeps the placeholder visible
                         * via: https://stackoverflow.com/questions/40593734/when-changing-the-value-of-a-field-with-javascript-safari-keeps-the-placeholder
                         */
                        this.searchInput?.focus()
                        // keep next time focus in input will open lists.
                        this.searchInput?.blur()

                        // reset all as visible
                        this.lists.map((app2) => {
                            app2.visible = true
                        })

                        this.reRender()
                    })
                }
                break
            case 27:
                // esc
                this.searchInput?.blur()
                utils.removeClass(this.listContainer.querySelector('ul'), 'active')
                break
            default:
                break
        }

        if (lis) {
            for (let i = 0; i < totalLisCount; i++) {
                if (this._current === i) {
                    lis[i].tabIndex = 0
                    lis[i].focus()
                } else {
                    lis[i].removeAttribute('tabindex')
                }
            }
        }
    }

    inputKeyDownHandler(e: { keyCode: string | number; which: string | number }) {
        const code = e.keyCode ? +e.keyCode : +e.which
        // debunce event trigger
        window.clearTimeout(this._timerForKeyDown)

        this._timerForKeyDown = window.setTimeout(() => {
            const ul = this.listContainer.querySelector('ul')

            if (ul) {
                let nextFocus = null
                switch (code) {
                    case 38: // up
                        nextFocus = ul.getElementsByTagName('li')[ul.getElementsByTagName('li').length - 1]
                        break
                    case 40: // down
                        nextFocus = ul.getElementsByTagName('li')[0]
                        break
                    case 27: // esc
                        this.searchInput?.blur()
                        break
                    default:
                        break
                }
                if (nextFocus) {
                    this.searchInput?.blur()
                    this._current = 0
                    utils.addClass(ul, 'active')

                    nextFocus.tabIndex = 0
                    nextFocus.focus()
                }
            }
        }, 100)
    }

    filterLists(val: string) {
        // trim empty string and lowercase
        const compareString = val.replace(/\s+/g, '').toLocaleLowerCase()

        this.lists.map((item) => {
            if (compareString === null || compareString === '') {
                // no need filter, show all item.
                item.visible = true
            } else {
                const name = item.name.toLocaleLowerCase()
                item.visible = name.includes(compareString)
            }
        })
    }

    reRender() {
        this.listContainer.innerHTML = this.renderItemList(this.lists)
    }

    findItemInLists(id: string) {
        /*
         * find item in lists by id
         * @return {Object}
         */
        let item = null
        if (this.lists && id) {
            item = this.lists.find((app) => '' + app.id === '' + id)
        }
        return item
    }

    itemOnHit(id: string, cb: null | Function) {
        /*
         * action to be when item be hit (by ckick or keyboard enter)
         * @param {Object} item -  current item object.
         */
        const item = this.findItemInLists(id)
        const timeStamp = Date.now()
        if (item) {
            // both update store and original list.
            this._store.update(id, timeStamp)
            item.ts = timeStamp

            if (cb && typeof cb === 'function') {
                cb.apply(this, [item])
            }
        }
    }
}

// exports.default = MyAutoComplete;
export default MyAutoComplete
