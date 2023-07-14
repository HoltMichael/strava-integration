import { LightningElement, track, wire } from 'lwc';
import getUserCreds from '@salesforce/apex/StravaIntegrationHandler.getUserCreds'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { getRecord} from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NICKNAME_FIELD from '@salesforce/schema/User.CommunityNickname';

//Required for showing the map
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import LEAFLET from '@salesforce/resourceUrl/Leaflet';;

//Required for passing data to other components on the page
import STRAVA_DETAILS from '@salesforce/messageChannel/stravaDetails__c';
import { publish,subscribe, MessageContext } from 'lightning/messageService';



const authUrl = 'https://www.strava.com/oauth/token';

export default class Strava extends LightningElement {

    @track results;
    @track loaded = false;
    @track authorised = false;
    @track name = '';

    @wire(getRecord, {recordId: USER_ID, fields: [NICKNAME_FIELD]}) 
    wireuser({error,data}) {
        if (data) {
            this.name = data.fields.CommunityNickname.value;
        }
    }

    @wire(MessageContext) messageContext;

    renderedCallback() {
        this.template.querySelector('.mapper').style.height = `${this.height}px`;
    }

    get title(){
        return this.name + ': Your last 30 activities';
    }

    connectedCallback(){
        this.subscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            STRAVA_DETAILS,
            (message) => {
                console.log(message);
                if(message.type == 'Filtered'){
                    //this.draw(message.activities);
                }
            }
        );
    }

    draw(data) {
        console.log('Drawing');
        Promise.all([
            loadStyle(this, LEAFLET + '/leaflet/leaflet.css'),
            loadScript(this, LEAFLET + '/leaflet/leaflet.js'),
            loadScript(this, LEAFLET + '/leaflet/polyline.js')
        ]).then(() => {
            let container = this.template.querySelector(".mapper");
            //let container = this.template.querySelector('div');
            let position = [51.9231987, 0.9836457];
            if(container != null){
                container._leaflet_id = null;
            }
            let map = L.map(container, { scrollWheelZoom: false }).setView(position, 13);
    
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            var coordinates;
            if(data){
                data.forEach(element => {
                    console.log('hello');
                    console.log(element.map.summary_polyline);
                    if(element.map.summary_polyline){
                        coordinates = L.Polyline.fromEncoded(element.map.summary_polyline).getLatLngs();
        
                        var lineColour = 'Green';
                        if(element.type == 'Walk'){
                            lineColour = 'Yellow';
                        }else if(element.type == 'Ride'){
                            lineColour = 'Blue';
                        }else if(element.type == 'Swim'){
                            lineColour = 'Red';
                        }
        
                        if(coordinates){
                            L.polyline(
                                coordinates,
                                {
                                    color: lineColour,
                                    weight:5,
                                    opacity:.7,
                                    lineJoin:'round'
                                }
                            ).addTo(map)
                        }
                    }
                    map.setView(coordinates[0], 13);
                });
            }
        });
       
    }

    get isReady(){
        return this.loaded && this.authorised;
    }

    @wire(getUserCreds)
    getUserCreds({error, data}){
        if(data){
            console.log(data.Refresh__c);
            this.reAuthorise(data.Refresh__c)
            this.authorised = true;
        }else if(error){
            console.log(error);
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
    
    
    getActivities(authorisation){
        if(this.authorised){
            const activitiesUrl = 'https://www.strava.com/api/v3/athlete/activities?per_page=199&access_token=' + authorisation.access_token;
            fetch(activitiesUrl)
                .then((result) => this.results = result.json())
                .then((data) =>{
                    console.log('Raw Strava Data');
                    console.log(data);
                    this.results = data;
                    console.log('Strava Data Stored');
                    console.log(this.results);
                    
                    const activities = {activities: this.results, type: 'All'};

                    publish(this.messageContext,STRAVA_DETAILS, activities);
                    Promise.all([
                        loadStyle(this, LEAFLET + '/leaflet/leaflet.css'),
                        loadScript(this, LEAFLET + '/leaflet/leaflet.js'),
                        loadScript(this, LEAFLET + '/leaflet/polyline.js')
                    ]).then(() => {
                        this.draw(null);
                    })
                    
                })
        }   
    }

    reAuthorise(refresh){
        fetch(authUrl, {
            method: 'post',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: '62539',
                client_secret: 'b3d4f0cec54fa3a11aa9cdbee7208fa7a47ee3c3',
                refresh_token: refresh,
                grant_type: 'refresh_token'
            })
        }).then(result => result.json())
            .then(res => this.getActivities(res))
    }
}