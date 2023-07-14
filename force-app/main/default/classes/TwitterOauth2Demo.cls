public with sharing class TwitterOauth2Demo {
    /*
      This class is created for authentication demo with Twitter and get latest tweet from Salesforce.
      Author : Om Prakash
      CreatedDate : 24/03/2018
     */

    private String consumerKey = 'Consumer_KEY'; //From Twitter App > Application Settings > Consumer Key (API Key)
    private String consumerSecret = 'Consumer_secret '; // From Twitter App > Application Settings  > Consumer Secret (API Secret)
    public String generatedToken {set; get;}
    public String twitterTimelineResponse {set; get;}
    public String errorMessage {set; get;}
    
    // Method for get access Token from twitter. 
    public void getTokenFromTwitter() {
        try{
            String consumerKeyEncoded = EncodingUtil.urlEncode(consumerKey, 'UTF-8');
            String consumerSecretEncoded = EncodingUtil.urlEncode(consumerSecret, 'UTF-8');
            String ketTokenCombined = consumerKeyEncoded + ':' + consumerSecretEncoded;
            HttpRequest objReq = new HttpRequest();
            objReq.setEndpoint('https://api.twitter.com/oauth2/token');
            objReq.setMethod('POST');
            String authHeadParam = 'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(ketTokenCombined));
            objReq.setHeader('Authorization', authHeadParam);
            objReq.setBody('grant_type=client_credentials');
            Http objHttp = new Http();
            HTTPResponse objRes = objHttp.send(objReq);
            System.debug('----response :'+ objRes.getBody());
            JSONParser objParse = JSON.createParser(objRes.getBody());
            while (objParse.nextToken() != null) 
            {
                if (objParse.getCurrentToken() == JSONToken.FIELD_NAME && objParse.getText() == 'access_token')
                {
                    objParse.nextToken();
                    generatedToken = objParse.getText();
                }
            }
         }
         catch(Exception ex)
         {  errorMessage = ex.getMessage();
            System.debug('Exception :' + ex.getMessage());
         }
    }
    // Returns the most recent Tweets from https://twitter.com/salesforce
    public void getTweetTimelines() {
        getTokenFromTwitter(); // Generate new access token before calling bellow API
        if(generatedToken == null ) {
            twitterTimelineResponse = 'Error while generating token, so unable to get messages. Check your debug log.';
            return;
        }
        try{
            HttpRequest objReq = new HttpRequest();
            objReq.setEndpoint('https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=salesforce');
            objReq.setMethod('GET');
            objReq.setHeader('Authorization', 'Bearer ' + generatedToken);
            Http objHttp = new Http();
            HTTPResponse objRes = objHttp.send(objReq);
            twitterTimelineResponse = objRes.getBody();
            if(String.isBlank(twitterTimelineResponse)){
                twitterTimelineResponse = objRes.toString();
            }
            System.debug('----response :'+ twitterTimelineResponse);
            // Put Your JSON Parsing Logic Here for twitterTimelineResponse
         }
         catch(Exception ex)
         {  errorMessage = ex.getMessage();
            System.debug('Exception :' + ex.getMessage());
         }
    }  
 }