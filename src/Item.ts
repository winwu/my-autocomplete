import Utils from './helpers/Utils.js'

class Item {
    private id: string
    private name: string
    private visible?: boolean
    private logo?: string | null
    private ts: number

    constructor(item: any) {
        if (!item.id) {
            throw new Error('missing id attribute')
        }

        if (!item.name) {
            throw new Error('missing name attribute')
        }

        this.id = item.id
        this.name = item.name
        this.logo = item?.logo ?? null
        this.visible = item?.visible ?? false
        this.ts = item?.ts ?? 0
    }

    render() {
        const isShow = this.visible || false
        const isInHistroy: boolean = this.ts && this.ts > 0 ? true : false

        if (isShow === false) {
            return ''
        }
        return `<li role="menuitem">
                <div class="app_item ${isInHistroy ? 'is_in_history' : ''}" data-id="${Utils.escapeHtml(this.id)}">
                <div class="app_item_left">
                    ${this.logo ? '<img src="' + Utils.escapeHtml(this.logo) + '" alt="' + this.name + '"/>' : ''}
                </div>
                <div class="app_item_right">
                    <span class="app_title">${this.name ? Utils.escapeHtml(this.name) : 'NO DATA'}</span>
                    ${
                        isInHistroy
                            ? '<i class="remove" data-id="' +
                              Utils.escapeHtml(this.id) +
                              '" title="remove from history">Remove</i>'
                            : ''
                    }
                </div>
                </div>
            </li>`
    }
}

export default Item
