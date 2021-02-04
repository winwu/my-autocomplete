class LocalStorageHandler {
	/*
	 * LocalStorageHandler Class
	 * for handle different myAutoComplete's search history in window.localshorage.
	 * @constructor
	 * @param {String} - a name as key to store data in localstorage.
	 */

	private _ls: any;
	private _namespace: string;

	constructor(itemNameSpace: string) {
		this._ls = window.localStorage;
		this._namespace = itemNameSpace || `random_ns_${Math.random().toString(36).substring(5)}`;
	}

	/*
     * @param {Object} - object save in localstorage.
	 */
	initObject(obj: any) {
		this._ls.setItem(this._namespace, JSON.stringify(obj));
	}

	/*
     * @return {Object} - return Object in this._namespace
	 */
	getAll() {
		return JSON.parse(this._ls.getItem(this._namespace));
	}

	/*
	 * Update specific id's timestamp(ts)
	 */
	update(id: string, ts: string) {
		// update ts for app which be hit.
		const data: any = this.getAll();
		if (data.hasOwnProperty(id)) {
			data[id] = ts;
		}
		this._ls.setItem(this._namespace, JSON.stringify(data));
	}

	clear() {
		this._ls.removeItem(this._namespace);
	}
}

export default LocalStorageHandler;