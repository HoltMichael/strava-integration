import { LightningElement, wire, track } from 'lwc';

//Required for passing data to other components on the page
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import STRAVA_DETAILS from '@salesforce/messageChannel/stravaDetails__c';


export default class ActivityTable extends LightningElement {
    @track showColumnSelector = false;
    @track activities = [];
    @track sortBy='elapsed_time';
    @track sortDirection='asc';

    columns = [
        { label: 'Id', fieldName: 'id', sortable: 'true'},
        { label: 'Type', fieldName: 'type', sortable: 'true'},
        { label: 'Start Time', fieldName: 'start_date_local', type: 'date', sortable: 'true'},
        { label: 'Name', fieldName: 'name', sortable: 'true'},
        { label: 'Elevation High', fieldName: 'elev_high', sortable: 'true' },
        { label: 'Elevation Low', fieldName: 'elev_low', sortable: 'true'},
        { label: 'Total Elevation Gain', fieldName: 'total_elevation_gain', sortable: 'true'},
        { label: 'Suffer Score', fieldName: 'suffer_score', sortable: 'true'},
        { label: 'Max Speed', fieldName: 'max_speed', sortable: 'true'},
        { label: 'Average Speed', fieldName: 'average_speed', sortable: 'true' },
        { label: 'Distance (km)', fieldName: 'distance', sortable: 'true' },
        { label: 'Time', fieldName: 'elapsed_time', sortable: 'true' }
    ];
    
    @wire(MessageContext) messageContext;

    handleShowColumnSelector(){
        this.showColumnSelector = true;
    }

    handleCloseModals(){
        this.showColumnSelector = false;
    }
    
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    // Encapsulate logic for Lightning message service subscribe and unsubsubscribe
    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            STRAVA_DETAILS,
            (message) => this.populateDataTable(message.activities)
        );
    }

    populateDataTable(activities){
        let acts = JSON.parse(JSON.stringify(activities));
        acts.forEach(element => {
            element.elapsed_time = element.elapsed_time/60;
            element.distance = element.distance/1000;
            //tempAct.elapsed_time = element.elapsed_time / 60;
            //this.activities.push(tempAct);
        });
        this.activities = acts;
    }

    updateColumnSorting(event){
        let fieldName = event.detail.fieldName;
        let sortDirection = event.detail.sortDirection;
        //assign the values
        this.sortBy = fieldName;
        this.sortDirection = sortDirection;
        //call the custom sort method.
        this.sortData(fieldName, sortDirection);
    }

    sortData(fieldName, sortDirection) {
        let sortResult = Object.assign([], this.activities);
        this.activities = sortResult.sort(function(a,b){
            if(a[fieldName] < b[fieldName]){
                return sortDirection === 'asc' ? -1 : 1;
            }
            else if(a[fieldName] > b[fieldName]){
                return sortDirection === 'asc' ? 1 : -1;
            }
            else{
                return 0;
            }
        })
    }
}