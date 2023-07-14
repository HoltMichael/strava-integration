public without sharing class StravaIntegrationHandler {

    @AuraEnabled(cacheable=true)
    public static User_Auth__mdt getUserCreds(){
        try {
            String currentUser = UserInfo.getUserId();
            
            List<User_Auth__mdt> userCreds = [SELECT Access__c, Refresh__c, Strava_User__c FROM User_Auth__mdt WHERE Salesforce_User__c=:currentUser];
            
            System.debug(userCreds);
            if(userCreds.size() > 0 ){
                return userCreds[0];
            }else{
                return null;
            }
            
        } catch (Exception e) {
            System.debug(e);
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    
    @AuraEnabled(cacheable=true)
    public static String GenerateAuthUrl(){

        id userId = userInfo.getUserId();
        User u = [SELECT id, Profile.Name FROM User WHERE id =: userId];
        String authURL = 'https://www.strava.com/oauth/authorize?';
        List<String> urlParams = new List<String>{ authURL };
        urlParams.add('client_id=62539');
        urlParams.add('redirect_uri=https://mhstrava-developer-edition.um7.force.com/apex/stravaAuthHelper');
        urlParams.add('response_type=code');
        urlParams.add('scope=activity:read_all');
		return String.join(urlParams, '&');
    }

    public static void GetAccessToken(String code){
        System.debug('1');
        HttpRequest req = new HttpRequest();
        req.setMethod('POST');
        req.setEndpoint('https://www.strava.com/oauth/token');
        
        API_Connection__mdt conn = [SELECT Client_ID__c, Client_Secret__c FROM API_Connection__mdt WHERE DeveloperName='Strava'];
        System.debug('2');
        List<String> urlParams = new List<String>();
        urlParams.add('client_id=' + conn.Client_ID__c);
        urlParams.add('client_secret=' + conn.Client_Secret__c);
        urlParams.add('code=' + code);
        urlParams.add('grant_type=authorization_code');
        req.setBody(String.join(urlParams, '&'));
        System.debug('3');
        Http api = new Http();
        HttpResponse res = api.send(req);
        System.debug('res');
        System.debug(res);
        if(res.getStatusCode() == 200){
            addUserAuth(res);
        }
    }
    
    public static void addUserAuth(System.HttpResponse res){
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
        Map<String, Object> athleteMap = (Map<String, Object>)responseMap.get('athlete');

        String accTkn = (String)responseMap.get('access_token');
        String refTkn = (String)responseMap.get('refresh_token');
        String user = athleteMap.get('id') + '';
        
        Metadata.CustomMetadata mdt =  new Metadata.CustomMetadata();
        mdt.fullName = 'User_Auth__mdt.User'+user;
        mdt.label = user;
        
        Metadata.CustomMetadataValue uField = new Metadata.CustomMetadataValue();
        uField.field = 'Strava_User__c';
        uField.value = user;
        mdt.values.add(uField);
        
        Metadata.CustomMetadataValue accField = new Metadata.CustomMetadataValue();
        accField.field = 'Access__c';
        accField.value = accTkn;
        mdt.values.add(accField);
        
        Metadata.CustomMetadataValue refField = new Metadata.CustomMetadataValue();
        refField.field = 'Refresh__c';
        refField.value = refTkn;
        mdt.values.add(refField);

        Metadata.CustomMetadataValue sfField = new Metadata.CustomMetadataValue();
        sfField.field = 'Salesforce_User__c';
        sfField.value = userInfo.getUserId();
        mdt.values.add(sfField);

        

        Metadata.DeployContainer mdContainer = new Metadata.DeployContainer();
        mdContainer.addMetadata(mdt);
        System.debug('4');
        CustomMetadataCallback callback = new CustomMetadataCallback();
        Id jobId = Metadata.Operations.enqueueDeployment(mdContainer, callback);
        System.debug('5');
    }
}