public with sharing class StravaAuthController {
    
    public string code { get; set; }

    //Executes after authorisation from strava redirects to the associated VF page.
    //Grabs the code from the URL provided by Strava
	public PageReference redirect(){
        code = ApexPages.currentPage().getParameters().get('code');
        StravaIntegrationHandler.GetAccessToken(code);
        System.debug(code);
        return null;
    }
}