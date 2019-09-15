import { LightningElement, api, track } from 'lwc';

export default class Wizard extends LightningElement {

    // #region public API properties
    @api variant = 'base';
    @api previousLabel = 'Previous';
    @api nextLabel = 'Next';
    @api finishLabel = 'Finish';
    @api header = '';
    @api get currentStep(){
        return this._currentStep;
    }

    set currentStep(value) {
        this.setAttribute('current-step', value);
        this._currentStep = value;
        this.setActiveStep();
    }

    // #endregion

    // #region Tracked Properties
    @track _steps = [];    
    @track _currentStep = null;
    @track _hasError = false;
    @track _errorMessages = '';
    @track _actions = [];

    // #endregion

    // #region Non-tracked Properties
    _isInit = false;
    _stepIndexesByName = {};
    _progressIndicatorType = 'base';
    _progressIndicatorVariant = 'base';

    get _isFirst() {
        return this._stepIndexesByName[this._currentStep] === 0;
    }

    get _nextLabel() {
        return this._stepIndexesByName[this._currentStep] === (this._steps.length - 1)?
            this.finishLabel    
            :this.nextLabel;
    }
    //#endregion

    // #region LWC Licecycle Callbacks

    connectedCallback() {
        // 1 - Initialization
        this.init();
    }

    errorCallback(error, stack) {
        this._hasError = true;
        this._errorMessages = error + ' ' + stack;
    }

    // #endregion

    // #region Private Methods

    /**
     * Initializes the component
     */
    init() {
        if(this._isInit) {
            return;
        }

        this._isInit = true;

        switch(this.variant) {
            case 'base-shaded':
                this._progressIndicatorVariant = 'shaded';
                this._progressIndicatorType = 'base';
                break;
            case 'path':
                this._progressIndicatorVariant = 'base';
                this._progressIndicatorType = 'path';
                break;
            default:
                this._progressIndicatorVariant = 'base';
                this._progressIndicatorType = 'base';      
        }
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
        this._steps.push(event.detail);
        this._stepIndexesByName[event.detail.name] = this._steps.length -1;
        
        if(!this._currentStep || this._currentStep === event.detail.name) {
            this._currentStep = event.detail.name;
            this.setActiveStep();
        }
    }
    /**
    * Register the wizard custom actions defined in its markup. An action could be global, or apply only to user-defined steps.
    * 
    * @param {CustomEvent} event
    * @param {Object} event.detail
    * @param {String|String[]} event.detail.for Defines a list of steps on which this action will be available
    * @param {Object} event.detail.methods WizardAction Private API
    * @param {Fuction} event.detail.methods.setActive Enables the action for its use in the current step. See c-wizard-action for details
    */
    registerAction(event) {
        this._actions.push(event.detail);
        this.setActiveActions();
    }

    /**
     * Moves to the next step, if available, and executes the customer-defined beforeChange hook of the current step.
     * If the beforeChange promise is resolve with a falsy value, the wizard stops at current step.
     * If the wizard is in its final step, dispatch the complete event.
     */
    async nextStep() {
        var currentStepIndex = this._stepIndexesByName[this._currentStep];

        this._hasError = !(await this.beforeChange(this._steps[currentStepIndex]));        
        
        if(!this._hasError) {
            let nextStep = this._steps[currentStepIndex + 1];
                
            if(nextStep) {
                this.setActiveStep(nextStep.name);
            } else {
                this.dispatchEvent(new CustomEvent('complete'));
            }
        }
    }

    /**
     * Moves to the previous step, if available. 
     */
    previousStep() {
        var currentStepIndex = this._stepIndexesByName[this._currentStep];

        if(currentStepIndex > 0) {
            let previousStep = this._steps[currentStepIndex - 1];
            
            this.setActiveStep(previousStep.name);
        }
    }

    /**
     * Sets the wizard current step
     * 
     * @param {String} stepName Current Step name 
     */
    setActiveStep(stepName) {
        var self = this;

        if(stepName) {
            this.dispatchEvent(new CustomEvent('change', {
                detail:{
                    oldStep: self._currentStep,
                    currentStep: stepName
                }
            }));

            self._currentStep = stepName;
        }

        self.setActiveActions();
        self._steps.forEach(step => {
            step.methods.setActive(step.name === self._currentStep);
        });
    }

    setActiveActions() {
        var self = this;

        self._actions.forEach(function(action) {
            if(typeof action.forStep === 'string') {
                action.methods.setActive(
                    action.forStep === self._currentStep || action.forStep === ''
                );
            } else if(action.forStep && typeof(action.forStep.has) === 'function'){
                action.methods.setActive(
                    action.forStep.has(self._currentStep)
                );
            } else {
                action.methods.setActive(true);
            }
        })
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
            if(!step.beforeChange) {
                return resolve(true);
            }

            return resolve(step.beforeChange());
        });
    }

    // #endregion
}