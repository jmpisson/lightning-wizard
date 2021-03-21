public with sharing class ApexValidationWizardController 
{

    @AuraEnabled
    public static Id saveAccount(Account newAccount)
    {
        try 
        {
            insert newAccount;

            return newAccount.Id;
        } 
        catch (Exception error) 
        {
            throw new AuraHandledException(error.getMessage());
        }
    }

    @AuraEnabled
    public static void validateName(String accountName)
    {
        try 
        {
            if(!Pattern.matches('[A-z].*', accountName))
            {
                throw new ApexValidationWizardControllerException('The Account Name should only contain characters.');
            }
        } 
        catch (Exception error) 
        {
            throw new AuraHandledException(error.getMessage());
        }
    }
    
    private class ApexValidationWizardControllerException extends Exception {}
}
