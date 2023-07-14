import { LightningElement, wire } from 'lwc';
import GenerateAuthUrl from '@salesforce/apex/StravaIntegrationHandler.GenerateAuthUrl'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { NavigationMixin } from 'lightning/navigation';


export default class Authentication extends NavigationMixin(LightningElement)  {
    authUrl;
    
    @wire(GenerateAuthUrl)
    generateAuthUrl({error, data}){
        if(data){
            this.authUrl = data;
        }else if(error){
            this.showToast(error, 'error', 'error');
        }
    }

    showToast(msg, title, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: msg,
            variant : variant
        });
        this.dispatchEvent(event);
    }

    /*handleLogin() {
        console.log(this.authUrl);
        this[NavigationMixin.Navigate]({
            "type": "standard__webPage",
            "attributes": {
                url: this.authUrl
            }
        });
    }*/

}