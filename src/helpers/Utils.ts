const Utils = {
    sortAryByKey: (ary: number[], key: string) => {
        return ary.sort((a: any, b: any) => {
            if (a[key] < b[key]) {
                return 1;
            }
            if (a[key] > b[key]) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
    },
    hasClass: (elem: any, compareClassName: string) => {
        if (elem.className && elem.className !== '') {
            return elem.className.split(' ').indexOf(compareClassName) > -1;
        } else {
            return false;
        }
    },
    escapeHtml: (str: string) => {
        const excapeMap: { [excapeText: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return String(str).replace(/[&<>"'`=\/]/g, (s) => {
            return excapeMap[s];
        });
    },
    addClass: (el: any, classNameToAdd: string) => {
        el.className += ' ' + classNameToAdd;
    },
    removeClass: (el: any, classNameToRemove: string) => {
        let elClass = ' ' + el.className + ' ';
        while (elClass.indexOf(' ' + classNameToRemove + ' ') !== -1) {
            elClass = elClass.replace(' ' + classNameToRemove + ' ', '');
        }
        el.className = elClass;
    }
};

export default Utils;