import { LightningElement, api, track } from 'lwc';

export default class Wizard extends LightningElement {

    // #region public API properties
    @api variant = 'base';
    @api previousLabel = 'Previous';
    @api nextLabel = 'Next';
    @api finishLabel = 'Finish';
    @api header = '';

    @track _currentStep = null;
    @api get currentStep() {
        return this._currentStep;
    }

    set currentStep(value) {
        this.setAttribute('current-step', value);
        this._currentStep = value;
        this.setActiveStep();
    }

    // #endregion

    // #region Tracked Properties

    @track steps = {};
    @track hasError = false;
    @track errorMessages = '';
    @track flow = [];

    // #endregion

    // #region Non-tracked Properties

    isInit = false;
    progressIndicatorType = 'base';
    progressIndicatorVariant = 'base';

    //#endregion

    // #region LWC Licecycle Callbacks

    connectedCallback() {
        this.init();
    }

    errorCallback(error, stack) {
        this.hasError = true;
        this.errorMessages = error + ' ' + stack;
    }

    // #endregion

    // #region Event Handlers

    /**
     * Handles changes on the slot body, which allows to configure the internal component stated base
     * on the c-wizard-step children.
     */
    slotChange() {
        this.configSteps();
        this.setActiveStep();
    }

    /**
    * Register a wizard step defined in component template
    * 
    * @param {CustomEvent} event
    * @param {Object} event.detail
    * @param {*} event.detail.for Defines a list of steps on which this action will be available
    * @param {Object} event.detail.methods WizardAction Private API
    * @param {Fuction} event.detail.methods.setActive Marks the step as current
    */
    registerStep(event) {
        var step = event.detail;
        this.steps[event.detail.name] = step;

        step.methods.config({
            labels: {
                next: this.nextLabel,
                previous: this.previousLabel,
                finish: this.finishLabel
            },
            callbacks: {
                unregister: this.unregisterStep.bind(this),
                move: this.moveStep.bind(this)
            }
        });
    }
    // #endregion

    // #region Private Methods

    /**
     * Initializes the component, applying the global style.
     */
    init() {
        if (this.isInit) {
            return;
        }

        this.isInit = true;

        switch (this.variant) {
            case 'base-shaded':
                this.progressIndicatorVariant = 'shaded';
                this.progressIndicatorType = 'base';
                break;
            case 'path':
                this.progressIndicatorVariant = 'base';
                this.progressIndicatorType = 'path';
                break;
            default:
                this.progressIndicatorVariant = 'base';
                this.progressIndicatorType = 'base';
        }
    }

    /**
    * Unregister a wizard step defined in component template
    * 
    * @param {String} Step name
    */
    unregisterStep(stepName) {
        delete this.steps[stepName];
    }

    /**
     * Sets the wizard current step
     * 
     * @param {String} stepName Current Step name 
     */
    setActiveStep(stepName) {
        var self = this;

        if (stepName) {
            self.dispatchEvent(new CustomEvent('change', {
                detail: {
                    oldStep: self._currentStep,
                    currentStep: stepName
                }
            }));

            self._currentStep = stepName;
        }

        Object.values(self.steps).forEach(function (step) {
            step.methods.setActive(step.name === self._currentStep);
        });

    }

    /**
    * Determines the wizard flow based on component body slot
    */
    configSteps() {
        var stepComponents = this.querySelectorAll('c-wizard-step'), self = this;

        this.flow = Array.prototype.map.call(stepComponents, (step, index) => {
            self.steps[step.name].methods.config({
                isFirst: index === 0,
                isLast: index === (stepComponents.length - 1)
            })

            return self.steps[step.name];
        });

        if (!this.currentStep && this.flow) {
            this.currentStep = this.flow[0].name;
        }
    }

    /**
     * Moves to the next step, if available, and executes the customer-defined beforeChange hook of the current step.
     * If the beforeChange promise is resolve with a falsy value, the wizard stops at current step.
     * If the wizard is in its final step, dispatch the complete event.
     * 
     * @param {String} direction Direction to move to. Valid values are next/previous 
     */
    async moveStep(direction) {
        let currentStep = this.steps[this._currentStep];
        let currentStepIndex = this.flow.indexOf(currentStep);

        if (direction === 'next') {
            this.hasError = !(await this.beforeChange(this.steps[this._currentStep]));

            if (!this.hasError) {
                let newStep = this.flow[currentStepIndex + 1];

                if (newStep) {
                    this.setActiveStep(newStep.name);
                } else {
                    this.dispatchEvent(new CustomEvent('complete'));
                }
            }
        } else {
            let newStep = this.flow[currentStepIndex - 1];

            if (newStep) {
                this.setActiveStep(newStep.name);
            }
        }
    }

    /**
     * Execute flows the customer-defined beforeChange hook, fired whenever the wizard goes to the next step. 
     * The hook is not invoked when a step change is a consequence of external causes
     * 
     * @param {Object} step Step public definition, as defined on registerStep method 
     * @returns {Promise(Boolean}) If the promise is resolve with a falsy value, the wizards stops at the current step, showing an error on the steo definition
     */
    beforeChange(step) {
        return new Promise((resolve) => {
            if (!step.methods.beforeChange) {
                return resolve(true);
            }

            return resolve(step.methods.beforeChange());
        });
    }

    // #endregion
}