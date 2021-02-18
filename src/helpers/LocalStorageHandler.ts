/**
 * handle different myAutoComplete's search history in window.localshorage.
 */

class LocalStorageHandler {
    private store: any = window.localStorage
    private title: string

    constructor(title: string) {
        this.title = title || `random_ns_${Math.random().toString(36).substring(5)}`
    }

    initObject(obj: { [appIndex: string]: number | string }) {
        this.store.setItem(this.title, JSON.stringify(obj))
    }

    getAll() {
        return JSON.parse(this.store.getItem(this.title))
    }

    update(id: string, timestamp: number) {
        const data: any = this.getAll()
        if (data.hasOwnProperty(id)) {
            data[id] = timestamp
        }
        this.store.setItem(this.title, JSON.stringify(data))
    }

    clear() {
        this.store.removeItem(this.title)
    }
}

export default LocalStorageHandler
