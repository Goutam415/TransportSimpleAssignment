import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'TransportSimple';
  public locations: FormGroup;
  private graph;
  private xPadding:number = 30;
  private yPadding:number = 30;
  public data = { values: [] };

  constructor() {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.locations = new FormGroup({
      locations: new FormArray([this.createLocation()])
    });
  }

  createLocation(): FormGroup {
    return new FormGroup({
      pickupLocation: new FormControl('', [Validators.required]),
      dropoffLocation: new FormControl('', [Validators.required])
    });
  }

  addLocation() {
    (this.locations.get('locations') as FormArray).push(this.createLocation());
  }

  deleteLocation(indexAt) {
    (this.locations.get('locations') as FormArray).removeAt(indexAt);
  }

  computeLineDesign() {
    this.graph = document.getElementById('graph');
    var c = this.graph.getContext('2d');
    c.clearRect(0, 0, this.graph.width, this.graph.height);
    this.data.values.length = 0;

    let locations = this.locations.getRawValue();
    locations = locations['locations'];

    console.log('locations : ', locations);

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

    c.lineWidth = 2;
    c.strokeStyle = '#ffffff00';
    c.font = 'italic 8pt sans-serif';
    c.textAlign = "center";

    c.beginPath();
    c.moveTo(this.xPadding, 0);
    c.lineTo(this.xPadding, this.graph.height - this.yPadding);
    c.lineTo(this.graph.width, this.graph.height - this.yPadding);
    c.stroke();

    for(var i = 0; i < this.data.values.length; i ++) {
      c.fillText(this.data.values[i].X, this.getXPixel(i), this.graph.height - this.yPadding + 20);
    }
    
    for(var i = 1; i < this.data.values.length; i ++) {
        c.beginPath();
        c.strokeStyle = this.data.values[i]['Y'] === 1 ? '#5B5696' : 
        (
          (this.data.values[i - 1]['Y'] < this.data.values[i]['Y']) ? '#FFF9E5' : 
          (
            (this.data.values[i - 1]['Y'] > this.data.values[i]['Y']) ? '#D1D1D2' : '#D7D7D7'
          )
        );

        if (this.data.values[i]['isDiscontinuedTrip']) {
          c.strokeStyle = '#C5D5E2';
        
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
    // c.stroke();

    c.fillStyle = '#333';
 
    for(var i = 0; i < this.data.values.length; i ++) { 
        c.beginPath();
        c.arc(this.getXPixel(i), this.getYPixel(this.data.values[i].Y), 4, 0, Math.PI * 2, true);
        c.fill();
    }
  }

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
  
  getXPixel(val) {
    return ((this.graph.width - this.xPadding) / this.data.values.length) * val + (this.xPadding * 1.5);
  }
  
  getYPixel(val) {
    return this.graph.height - (((this.graph.height - this.yPadding) / this.getMaxY()) * val) - this.yPadding;
  }
}
