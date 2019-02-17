import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public locations: FormGroup;
  private graph;
  private xPadding:number = 30;
  private yPadding:number = 30;
  public data = { values: [] };

  constructor() {}

  /**
   * Angular life cycle starts here.
   */
  ngOnInit() {
    this.initForm();
  }

  /**
   * Initializing the form to get the pickup and dropoff location details.
   */
  initForm() {
    this.locations = new FormGroup({
      locations: new FormArray([this.createRoute()])
    });
  }

  /**
   * Add new route will create the form control to accept pickupLocation and dropoffLocation.
   */
  createRoute(): FormGroup {
    return new FormGroup({
      pickupLocation: new FormControl('', [Validators.required]),
      dropoffLocation: new FormControl('', [Validators.required])
    });
  }

  /**
   * It will add a new form control to accept new pickupLocation and dropoffLocation
   */
  addRoute() {
    (this.locations.get('locations') as FormArray).push(this.createRoute());
  }

  /**
   * It will delete an existing form control at a specific index.
   * @param indexAt: This variable will hold the index of the requested route to delete.
   */
  deleteRoute(indexAt) {
    (this.locations.get('locations') as FormArray).removeAt(indexAt);
  }

  /**
   * Function to compute the locations and drawing the horizontal 
   * line along the X - axis.
   */
  computeLineDesign() {
    this.graph = document.getElementById('graph');
    var c = this.graph.getContext('2d');
    
    // Clearing the canvas to avoid the overlapping of old values on the line.
    c.clearRect(0, 0, this.graph.width, this.graph.height);
    // Resetting the data values information to accept updated information
    this.data.values.length = 0;

    // Getting the location form as a raw value with updated information to make computation life easy.
    let locations = this.locations.getRawValue();
    locations = locations['locations'];

    /**
     * Doing computation to convert the entered information into required form and also performing the
     * conditional operations and taking the Xand Y axis values to meet level 1 and level 2 line requirement.
     */
    for (let locationIndex = 0; locationIndex < locations.length; locationIndex++) {
      this.data.values.push({
        X: locations[locationIndex]['pickupLocation'].substring(0, 3) + " - " +
        locations[locationIndex]['dropoffLocation'].substring(0, 3),

        Y: (locations[locationIndex + 1] !== undefined) ? 
          (
            (
              (locations[locationIndex]['dropoffLocation'] === locations[locationIndex + 1]['dropoffLocation']) &&
              (locations[locationIndex]['pickupLocation'] === locations[locationIndex + 1]['pickupLocation'])
            ) ? 2
            :
            (
              (
                (locationIndex > 0) &&
                (locations[locationIndex]['dropoffLocation'] === locations[locationIndex - 1]['dropoffLocation']) &&
                (locations[locationIndex]['pickupLocation'] === locations[locationIndex - 1]['pickupLocation'])
              ) ? 2
              :
              (
                (
                  (locations[locationIndex]['dropoffLocation'] !== locations[locationIndex + 1]['pickupLocation']) &&
                  (locations[locationIndex]['dropoffLocation'] === locations[locationIndex + 1]['dropoffLocation'])
                ) ? 3
                :
                1
              )
            )
          )
          :
          (
            locationIndex > 0 ? 
            (
              (
                (locations[locationIndex]['dropoffLocation'] === locations[locationIndex - 1]['dropoffLocation']) &&
                (locations[locationIndex]['pickupLocation'] === locations[locationIndex - 1]['pickupLocation'])
              ) ? 2
              :
              (
                (
                  (locations[locationIndex]['pickupLocation'] !== locations[locationIndex - 1]['dropoffLocation']) &&
                  (locations[locationIndex]['dropoffLocation'] === locations[locationIndex - 1]['dropoffLocation'])
                ) ? 3
                :
                1
              )
            )
            :
          1)
      });
    }

    // Making small adjustments here to get line result correctly.
    if (this.data.values.length !== 1) {
      for (let dataValuesIndex = 0; dataValuesIndex < this.data.values.length; dataValuesIndex++) {
        if (this.data.values[dataValuesIndex]['Y'] === 3) {
          this.data.values[dataValuesIndex]['Y'] = 1;
          if (this.data.values[dataValuesIndex + 1]) {
            this.data.values[dataValuesIndex + 1]['isDiscontinuedTrip'] = true;
          }
        }
      }
    }

    // Line drawing starts here.
    c.lineWidth = 2;
    c.strokeStyle = '#ffffff00';
    c.font = 'italic 8pt sans-serif';
    c.textAlign = "center";

    // Draw the axises
    c.beginPath();
    c.moveTo(this.xPadding, 0);
    c.lineTo(this.xPadding, this.graph.height - this.yPadding);
    c.lineTo(this.graph.width, this.graph.height - this.yPadding);
    c.stroke();

    // Draw the X value texts
    for(var i = 0; i < this.data.values.length; i ++) {
      c.fillText(this.data.values[i].X, this.getXPixel(i), this.graph.height - this.yPadding + 20);
    }
    
    // Draw the line
    for(var i = 1; i < this.data.values.length; i ++) {
        c.beginPath();
        c.strokeStyle = this.data.values[i]['Y'] === 1 ? '#5B5696' : 
        (
          (this.data.values[i - 1]['Y'] < this.data.values[i]['Y']) ? '#FF8C00' : 
          (
            (this.data.values[i - 1]['Y'] > this.data.values[i]['Y']) ? '#D1D1D2' : '#D7D7D7'
          )
        );

        if (this.data.values[i]['isDiscontinuedTrip']) {
          c.strokeStyle = '#2AAFF5';
        
          var headlen = 10;   // length of head in pixels
          var angle = Math.atan2(
            this.getYPixel(this.data.values[i].Y) - this.getYPixel(this.data.values[i - 1].Y),
            this.getXPixel(i)-this.getXPixel(i - 1));
            c.moveTo(this.getXPixel(i), this.getYPixel(this.data.values[i].Y));
            c.lineTo(this.getXPixel(i), this.getYPixel(this.data.values[i].Y));
            c.lineTo(this.getXPixel(i)-headlen*Math.cos(angle-Math.PI/6),this.getYPixel(this.data.values[i].Y)-headlen*Math.sin(angle-Math.PI/6));
            c.moveTo(this.getXPixel(i), this.getYPixel(this.data.values[i].Y));
            c.lineTo(this.getXPixel(i)-headlen*Math.cos(angle+Math.PI/6),this.getYPixel(this.data.values[i].Y)-headlen*Math.sin(angle+Math.PI/6));
        }
        c.moveTo(this.getXPixel(i-1), this.getYPixel(this.data.values[i-1].Y));
        c.lineTo(this.getXPixel(i), this.getYPixel(this.data.values[i].Y));
        c.stroke();
    }

    c.fillStyle = '#333';
 
    // Draw the Dots
    for(var i = 0; i < this.data.values.length; i ++) { 
        c.beginPath();
        c.arc(this.getXPixel(i), this.getYPixel(this.data.values[i].Y), 4, 0, Math.PI * 2, true);
        c.fill();
    }
  }

  /**
   * Returns the max Y value in our data list
   */
  getMaxY() {
    var max = 0;
     
    for(var i = 0; i < this.data.values.length; i ++) {
        if(this.data.values[i].Y > max) {
            max = this.data.values[i].Y;
        }
    }
     
    max += 10 - max % 10;
    return max;
  }
  
  /**
   * // Return the x pixel for a graph point.
   * @param val : This holds the index of the 'x' value in the data array.
   */
  getXPixel(val) {
    return ((this.graph.width - this.xPadding) / this.data.values.length) * val + (this.xPadding * 1.5);
  }
  

  /**
   * Return the y pixel for a graph point
   * @param val : This holds the index of the 'y' value in the data array.
   */
  getYPixel(val) {
    return this.graph.height - (((this.graph.height - this.yPadding) / this.getMaxY()) * val) - this.yPadding;
  }
}
