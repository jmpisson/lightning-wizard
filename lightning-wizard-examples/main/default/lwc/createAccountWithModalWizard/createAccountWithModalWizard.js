import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';


export default class CreateAccountWithModalWizard extends NavigationMixin(LightningElement) {


    /**
     * Shows/Hides the modal from the first step
     * @author jmpisson
     */
    @track
    isModalShown = false;

    /**
     * Takes the filled form and creates a new Account Record 
     * @author jmpisson
     */
    saveAccount() {
        // 0 - Define the fields object and the current record to save
        const fields = {};
        const accountRecord = { apiName: ACCOUNT_OBJECT.objectApiName, fields };

        // 1 - Get current form inputs
        let inputs = this.template.querySelectorAll('lightning-input');

        // 2 - Loop the input list and get every input value and assign it to the desired field
        //     The field name is set on every input dataset as the attribute "field"
        inputs.forEach(input => {
            fields[input.dataset.fieldName] = input.value;
        });

        // 3 - Create the account using Lightning UI Record API 
        //     and show a toast message with the result
        createRecord(accountRecord).then(account => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `Account created, the Id is ${account.id}`,
                    variant: 'success',
                }),
            );

            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: account.id,
                    objectApiName: 'Account',
                    actionName: 'view'

                }
            });
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error',
                })
            );
        });
    }

    /**
     * Opens the modal
     * 
     * @author jmpisson
     */
    openModal() {
        this.isModalShown = true;
    }

    /**
     * Opens the modal
     * 
     * @author jmpisson
     */
    closeModal() {
        this.isModalShown = false;
    }

    /**
     * Validates the form and goes to the next step
     * 
     * @author jmpisson
     */
    next() {
        if(this.validate()) {
            this.template.querySelector('c-wizard').currentStep = 'step-2';
        }

        this.closeModal();
    }


    /**
     * Validates the form, checking for lightning-input errors and
     * controlling that wizard should advance to the next step
     * 
     * @author jmpisson
     */
    validate() {
        // 1 - Takes all the inputs from the step - "this" is bind to wizard-step component
        const allValid = [...this.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);

        // 2 - Returns true/false; if the validation were asynchronous, it should return a Promise instead
        return allValid;
    }
}