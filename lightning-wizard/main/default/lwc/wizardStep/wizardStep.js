import { LightningElement, api, track } from 'lwc';

export default class WizardStep extends LightningElement {
    // #region public API properties
    @api name;
    @api label;
    @api beforeChange = function() { return true; }
    @api hidePreviousButton = false;
    @api hideNextButton = false;

    @track _isActive = false;
    @api get isActive() {
        return this._isActive;
    }
    set isActive(value) {
        this._isActive = value;

        if(value) {
            this.setAttribute('is-active', true);
            this.setAttribute('aria-hidden', false);
            this.classList.add('slds-show');
            this.classList.remove('slds-hide');
        } else {
            this.removeAttribute('is-active');
            this.setAttribute('aria-hidden', true);
            this.classList.remove('slds-show');
            this.classList.add('slds-hide');
        }
    }

    // #endregion

    // #region Tracked Properties
    @track isInit = false;
    // #endregion

    // #region Private Properties

    labels = {
        next: 'Next',
        previous: 'Previous',
        finish: 'Finish'
    }

    @track isLast = false;
    @track isFirst = false;

    get shouldHidePreviousButton() {
        return this.isFirst || this.hidePreviousButton? true:false;
    }

    get nextLabel() {
        return this.isLast? this.labels.finish:this.labels.next;
    }
    
    // #endregion

    // #region LWC Lifecycle Hooks

    connectedCallback() {
        this.dispatchEvent(new CustomEvent('stepregistered', {
            bubbles: true,
            detail: {
                name: this.name,
                label: this.label,
                methods: {
                    setActive: this.setActive.bind(this),
                    config: this.config.bind(this),
                    beforeChange: typeof this.beforeChange === 'function'? this.beforeChange.bind(this):null
                }
             }
        }));
    }

    disconnectedCallback() {
        if(typeof this.unregister === 'function') {
            this.unregister(this.name);
        }
    }

    // #endregion

    // #region Private API

    setActive(isActive) {
        this.isActive = isActive;
    }

    config(props) {
        this.isFirst = props.isFirst;
        this.isLast = props.isLast;
        
        if(!this.isInit) {
            this.labels = props.labels;
            this.move = props.callbacks.move;
            this.unregister = props.callbacks.unregister;
            this.isInit = true;
        }
    }

    nextStep() {
        if(typeof this.move === 'function') {
            this.move('next');
        }
    }

    previousStep() {
        if(typeof this.move === 'function') {
            this.move('previous');
        }
    }

    move = null;
    unregister = null;

    // #endregion
}