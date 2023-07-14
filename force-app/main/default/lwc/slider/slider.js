import { LightningElement, wire } from 'lwc';


import { publish, subscribe, MessageContext } from 'lightning/messageService';
import STRAVA_DETAILS from '@salesforce/messageChannel/stravaDetails__c';

export default class Slider extends LightningElement {
    subscription = null;
    @wire(MessageContext) messageContext;
    allDetails;

    max = 0;
    min = 1000000000000;

    minVal;
    maxVal;

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    // Encapsulate logic for Lightning message service subscribe and unsubsubscribe
    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            STRAVA_DETAILS,
            (message) => {
                if(message.type == 'All'){
                    this.handleStravaDetails(message);
                }
            }
        );
    }

    // Handler for message received by component
    handleStravaDetails(message) {
        this.allDetails = message.activities;
        message.activities.forEach(element => {
            if(element.distance > this.max){
                this.max = element.distance;
            }
            if(element.distance < this.min){
                this.min = element.distance;
            }

        });

        this.minVal = parseFloat(this.min);
        this.maxVal = parseFloat(this.max);
    }

    handleSlider(event){
        if(!this.minVal){
            this.minVal = (this.maxVal + this.minVal) /2;
        }
        if(!this.maxVal){
            this.maxVal = (this.maxVal + this.minVal) /2;
        }

        var sliderType = event.target.dataset.name;

        if(sliderType == 'max'){
            this.maxVal = parseFloat(event.target.value);
        }else{
            this.minVal = parseFloat(event.target.value);
        }

        if(sliderType == 'max' && (parseFloat(this.minVal) > parseFloat(this.maxVal))){
            this.minVal = this.maxVal;
        }else if(sliderType == 'min' && (parseFloat(this.maxVal) < parseFloat(this.minVal))){
            this.maxVal = this.minVal;
        }
    
        this.publishChange();
    }

    publishChange(){
        var filteredActivities = [];
        this.allDetails.forEach(element => {
            if(element.distance <= this.maxVal && element.distance >= this.minVal){
                filteredActivities.push(element);
            }
        });

        var payload = {activities: filteredActivities, type: 'Filtered'};
        publish(this.messageContext, STRAVA_DETAILS, payload);

    }


}