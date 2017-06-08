/*jslint browser: true*/
/*global $, jQuery, alert*/
var $map = $('#map');
var map;
var latitude = 40.7413549;
var longitude = -73.9980244;
$(".cross").hide();
$(".menu").hide();
$(".hamburger").click(function () {
    'use strict';
    $(".menu").slideToggle("slow", function () {
        $(".hamburger").hide();
        $(".cross").show();
    });
});

$(".cross").click(function () {
    'use strict';
    $(".menu").slideToggle("slow", function () {
        $(".cross").hide();
        $(".hamburger").show();
    });
});
//Path of the pin obtain from: http://map-icons.com/
var SQUARE_PIN = 'M22-48h-44v43h16l6 5 6-5h16z';
var SQUARE = 'M-24-48h48v48h-48z';
//Blue Water Map Style obtain from https://snazzymaps.com/style/25/blue-water
var map_style = [
        {
            "featureType": "administrative",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#444444"
                }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [
                {
                    "color": "#f2f2f2"
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "road",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -100
                },
                {
                    "lightness": 45
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [
                {
                    "color": "#46bcec"
                },
                {
                    "visibility": "on"
                }
            ]
        }
    ];

var list_of_markers = [];
var defaultIcon;
var highlightedIcon;
var largeInfowindow;

//Restuarant Object
function Restuarant(name, lat, long) {
    'use strict';
    this.name = name;
    this.tribeca = {lat: lat, lng: long};
}

// The AJAX calls uses Zomato's API to load restuarants.
var zomatoURL = 'https://developers.zomato.com/api/v2.1/search?count=100&lat=' + latitude + '&lon=' + longitude;
var list_of_restaurants = [];

console.log(list_of_restaurants);
$.ajax({
    type: 'GET',
    url: zomatoURL,
    headers: {"user-key" : "e79b76b95e744d81cb670edeed25cc40"},
    success: function (response) {
        'use strict';
        console.log(response);
        var restuarants = response.restaurants;
        for (var i = 0; i < restuarants.length; i++) {
        var restaurant = new Restuarant(
          restuarants[i].restaurant.name,
          Number(restuarants[i].restaurant.location.latitude),
          Number(restuarants[i].restaurant.location.longitude)
        );
        //console.log(restaurant);
        list_of_restaurants.push(restaurant);
        };
        for (i = 0; i < list_of_restaurants.length; i++) {
        var marker = new google.maps.Marker({
          position: list_of_restaurants[i].tribeca,
          map: map,
          draggable:true,
          icon: defaultIcon,
          title:list_of_restaurants[i].name,
          animation: google.maps.Animation.DROP
        });
        //Adding Listeners to the marker
        marker.addListener('click', function(clicks) {
            toggleBounce(this);
            populateInfoWindow(this, largeInfowindow);
        });
        marker.addListener('mouseover', function() {
          this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
          this.setIcon(defaultIcon);
        });
        list_of_markers.push(marker);
        }
        //console.log(list_of_restaurants);
        //Knockout Model Framework
        var RestuarantListModel = function () {
            this.restaurant = ko.observableArray(list_of_restaurants); // Initial items
            this.currentSelected = ko.observable();
            this.restaurantToFind = ko.observable("");
            //This handles when an item is selected from the menu.
            this.selectItem = function (that, r) {
              //that.currentSelected(r.name);
              console.log("Item Clicked!");
              console.log(r.name);
              $( ".menu" ).slideToggle( "slow", function() {
                $( ".cross" ).hide();
                $( ".hamburger" ).show();
              });
              function findMarker(marker) {
                return marker.title === r.name;
              }
              var marker = list_of_markers.find(findMarker);
              toggleBounce(marker);
              populateInfoWindow(marker, largeInfowindow);
            }
            //Filter items in the menu
            var self = this;
            this.filteredData = ko.computed(function() {
              console.log("It's working!");
              var filter = self.restaurantToFind().toLowerCase();

              if (!filter) {
                return self.restaurant();
              } else {
                return ko.utils.arrayFilter(self.restaurant(), function(item) {
                  return item.name.toLowerCase().indexOf(filter) > -1;
                });
              }
            });
        };
        ko.applyBindings(new RestuarantListModel());
    },
    //Error Handling.
    error: function (request, status, error) {
        alert(request.responseText);

    }
});


//Function makes icon for the marker
function makeMarkerIcon(icon_path, icon_color) {
  return {
    path: icon_path,
    fillColor: icon_color,
    fillOpacity: .85,
    strokeColor: '',
    strokeWeight: 0
  };
}

//This function adds the jumping animation for the marker when clicked.
function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title + '</div>');
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}

//Initialize Google Maps API and map, defaultIcon, highlightedIcon, and largeInfowindow.
function initMap() {
  console.log("Building Map.");
  //Load Map
  map = new google.maps.Map($map[0], {
    center: {lat: latitude, lng: longitude},
    zoom: 13,
    styles: map_style
  });
  //Default Style for the marker icon.
  defaultIcon = makeMarkerIcon(SQUARE_PIN,'#00CCBB');
  //New Style for the marker icon when mouse is on top.
  highlightedIcon = makeMarkerIcon(SQUARE,'#FFFF00');
  //infowindow
  largeInfowindow = new google.maps.InfoWindow();

};
