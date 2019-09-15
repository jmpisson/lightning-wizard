import { LightningElement, api, track } from 'lwc';

export default class WizardStep extends LightningElement {
    @api name;
    @api label;
    @api beforeChange = function() { return true; }
    @track isActive = false;

    _actions = [];
    @track _isInit = false;

    connectedCallback() {
        this.dispatchEvent(new CustomEvent('stepregistered', {
            bubbles: true,
            detail: {
                name: this.name,
                label: this.label,
                methods: {
                    setActive: this.setActive.bind(this),
                    beforeChange: typeof this.beforeChange === 'function'? this.beforeChange.bind(this):null
                }
             }
        }));
    }

    setActive(isActive) {
        this.isActive = isActive;
    }
}