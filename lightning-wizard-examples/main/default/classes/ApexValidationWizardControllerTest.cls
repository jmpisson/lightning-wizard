@isTest
private class ApexValidationWizardControllerTest 
{
    @isTest
    static void test_saveAccount_OK()
    {
        // When
        Account testAccount = new Account( Name = 'Test');

        // Test
        Test.startTest();

        ApexValidationWizardController.saveAccount(testAccount);

        Test.stoptest();

        // Then
        List<Account> accounts = [SELECT Id, Name FROM Account LIMIT 1];

        System.assertEquals(false, accounts.isEmpty());
        System.assertEquals('Test', accounts[0].Name);
    }

    @isTest
    static void test_saveAccount_null()
    {
        // When
        Account testAccount = null;

        // Test
        Test.startTest();

        AuraHandledException testedError;

        try
        {
            ApexValidationWizardController.saveAccount(testAccount);
        }
        catch(AuraHandledException error)
        {
            testedError = error;
        }

        Test.stoptest();

        // Then
        List<Account> accounts = [SELECT Id, Name FROM Account LIMIT 1];

        System.assertEquals(true, accounts.isEmpty());
        System.assertNotEquals(null, testedError);
    }

    @isTest
    static void test_validateName_OK()
    {
        // Test
        Test.startTest();

        AuraHandledException testedError;

        try
        {
            ApexValidationWizardController.validateName('Test');
        }
        catch(AuraHandledException error)
        {
            testedError = error;
        }
        
        Test.stoptest();

        // Then
        System.assertEquals(null, testedError);
    }

    @isTest
    static void test_validateName_NOK()
    {
        Test.startTest();

        AuraHandledException testedError;

        try
        {
            ApexValidationWizardController.validateName('012');
        }
        catch(AuraHandledException error)
        {
            testedError = error;
        }
        

        Test.stoptest();

        // Then
        System.assertNotEquals(null, testedError);
    }
}
