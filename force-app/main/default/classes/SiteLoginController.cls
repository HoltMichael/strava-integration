/**
 * An apex page controller that exposes the site login functionality
 */
global without sharing class SiteLoginController {
    global String username {get; set;}
    global String password {get; set;}
    public string code { get; set; }

    global PageReference login() {
        String startUrl = System.currentPageReference().getParameters().get('startURL');
        return Site.login(username, password, startUrl);
    }

    //Executes after authorisation from strava redirects to the associated VF page.
    //Grabs the code from the URL provided by Strava
	public PageReference redirect(){
        System.debug('Running');
        code = ApexPages.currentPage().getParameters().get('code');
        StravaIntegrationHandler.GetAccessToken(code);
        System.debug(code);
        return null;
    }
    
   	global SiteLoginController () {}
}