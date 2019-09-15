import { LightningElement, api, track } from 'lwc';

export default class WizardAction extends LightningElement {
    @api forStep = '';
    @api label = '';
    @track isActive = false;

    connectedCallback() {
        this.dispatchEvent(new CustomEvent('actionregistered', {
            bubbles: true,
            detail: {
                forStep: this.forStep,
                guid: this.guid,
                methods: {
                    setActive: this.setActive.bind(this)
                }
             }
        }));
    }

    setActive(isActive) {
        this.isActive = isActive;
    }
}