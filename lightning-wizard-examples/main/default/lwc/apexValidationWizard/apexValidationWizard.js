import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import saveAccount from '@salesforce/apex/ApexValidationWizardController.saveAccount';
import validateName from '@salesforce/apex/ApexValidationWizardController.validateName';


export default class ApexValidationWizard extends NavigationMixin(LightningElement) {

    /**
     * Takes the filled form and creates a new Account Record 
     * @author jmartinezpisson
     */
    saveAccount() {
        const accountRecord = this.createAccountRecord();

        // 3 - Create the account using an Apex method
        //     and show a toast message with the result
        saveAccount({ newAccount: accountRecord }).then(accountId => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `Account created, the Id is ${accountId}`,
                    variant: 'success',
                }),
            );

            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: accountId,
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

    createAccountRecord() {
        const accountRecord = {};

        // 1 - Get current form inputs
        let inputs = this.template.querySelectorAll('lightning-input');

        // 2 - Loop the input list and get every input value and assign it to the desired field
        //     The field name is set on every input dataset as the attribute "field"
        inputs.forEach(input => {
            accountRecord[input.dataset.fieldName] = input.value;
        });

        return accountRecord;
    }

    /**
     * Validates the form, checking for lightning-input errors and
     * controlling that wizard should advance to the next step
     * 
     * @author jmartinezpisson
     */
    async validate() {
        // 1 - Takes all the inputs from the step - "this" is bind to wizard-step component
        const allValid = [...this.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.setCustomValidity('');
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);

        // 2 - Calls an Apex Validation method to validate the Account Name.
        // If the method throws an exception, shows the message on the Input
        // Stops the wizard by returninng false.
        if(allValid) {
            let accountNameInput = this.querySelector('lightning-input[data-field-name="Name"]');

            if(accountNameInput) {
                try {
                    await validateName({ accountName: accountNameInput.value });
                } catch(error) {
                    accountNameInput.setCustomValidity(error.body.message);
                    accountNameInput.reportValidity();

                    return false;
                }
            }
        }

        return allValid;
    }
}