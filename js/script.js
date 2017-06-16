/*jslint browser: true*/
/*global $, jQuery, alert*/
/*jshint esversion: 6 */
var $map = $('.map');
var map;
var currentMarker;
var latitude = 40.7413549;
var longitude = -73.9980244;
var callAjax = true;
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

var listOfMarkers = [];
var defaultIcon;
var highlightedIcon;
var largeInfowindow;

//Restuarant Object
function Restuarant(name, lat, long, cuisines, rating) {
    'use strict';
    this.name = name;
    this.tribeca = {lat: lat, lng: long};
    this.cuisines = cuisines;
    this.rating = rating;
}

// The AJAX calls uses Zomato's API to load restuarants.
var zomatoURL = 'https://developers.zomato.com/api/v2.1/search?count=100&lat=' + latitude + '&lon=' + longitude;
var listOfRestaurants = [];

console.log(listOfRestaurants);
$.ajax({
    type: 'GET',
    url: zomatoURL,
    headers: {"user-key" : "e79b76b95e744d81cb670edeed25cc40"},
    success: function (response) {
        'use strict';
        try {
        console.log(response);
        var restuarants = response.restaurants;
        for (let i = 0; i < restuarants.length; i++) {
            var restaurant = new Restuarant(
              restuarants[i].restaurant.name,
              Number(restuarants[i].restaurant.location.latitude),
              Number(restuarants[i].restaurant.location.longitude),
              restuarants[i].restaurant.cuisines,
              restuarants[i].restaurant.user_rating.rating_text
            );
            //console.log(restaurant);
            listOfRestaurants.push(restaurant);
          }
          for (let i = 0; i < listOfRestaurants.length; i++) {
            var marker = new google.maps.Marker({
              position: listOfRestaurants[i].tribeca,
              map: map,
              draggable:true,
              icon: defaultIcon,
              title:listOfRestaurants[i].name,
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
            listOfMarkers.push(marker);
          }
          currentMarker = listOfMarkers[0];
          //console.log(listOfRestaurants);
          //Knockout Model Framework
          var RestuarantListModel = function () {
              this.restaurant = ko.observableArray(listOfRestaurants); // Initial items
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
                var marker = listOfMarkers.find(findMarker);
                toggleBounce(marker);
                populateInfoWindow(marker, largeInfowindow);
              };
              //Filter items in the menu
              var self = this;
              this.filteredData = ko.computed(function() {
                console.log("It's working!");
                var filter = self.restaurantToFind().toLowerCase();
                var filteredRestaurant;
                if (!filter) {
                  filteredRestaurant = self.restaurant();
                  for(var i = 0; i < listOfMarkers.length; i++) {
                    listOfMarkers[i].setVisible(true);
                  }
                  return filteredRestaurant;
                } else {
                  filteredRestaurant = ko.utils.arrayFilter(self.restaurant(), function(item) {
                    return item.name.toLowerCase().indexOf(filter) > -1;
                  });
                  for(let i = 0; i < listOfMarkers.length; i++) {
                    listOfMarkers[i].setVisible(false);
                  }
                  for(let i = 0; i < filteredRestaurant.length; i++) {
                    function findMarker(marker) {
                      return marker.title === filteredRestaurant[i].name;
                    }
                    var marker = listOfMarkers.find(findMarker);
                    marker.setVisible(true);
                  }
                  return filteredRestaurant;
                }
              });
          };
          ko.applyBindings(new RestuarantListModel());
        } catch(e) {
          ajaxFailed();
        }
      },
      error: function(jqXHR, extStatus, errorThrown) {
        ajaxFailed();
      }
});

function ajaxFailed() {
  $('.cross').hide();
  $('.hamburger').hide();
  $('header').append("<div>Failed to Restuarants.</div>");
  var marker = new google.maps.Marker({
    position: {lat: latitude, lng: longitude},
    map: map,
    draggable:false,
    icon: defaultIcon,
    title: "Failed to load Restuarants. Please check the browser console.",
    animation: google.maps.Animation.DROP
  });
  populateInfoWindow(marker, largeInfowindow);
  listOfMarkers.push(marker);
  alert('Failed to load Restuarants: See Browser Console for Details!');
}

//Function makes icon for the marker
function makeMarkerIcon(icon_path, icon_color) {
  return {
    path: icon_path,
    fillColor: icon_color,
    fillOpacity: 0.85,
    strokeColor: '',
    strokeWeight: 0
  };
}

//This function adds the jumping animation for the marker when clicked.
function toggleBounce(marker) {
  if(marker !== currentMarker && currentMarker != null) {
    currentMarker.setAnimation(null);
    currentMarker = marker;
  }
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
   function findRestaurant(restaurant) {
      return marker.title === restaurant.name;
   }
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    var restaurant = listOfRestaurants.find(findRestaurant);
    if(restaurant != null) {
      infowindow.setContent('<div>' + restaurant.name + '</div><br/><div>Cuisines: ' + restaurant.cuisines + '</div><br/><div> Rating: '+ restaurant.rating +'</div>');
    } else {
      infowindow.setContent('<div>' + marker.title + '</div>');
    }
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}

//Initialize Google Maps API and map, defaultIcon, highlightedIcon, and largeInfowindow.
function initMap() {
  //Load Map
  console.log("Building Map.");
  map = new google.maps.Map($map[0], {
    center: {lat: latitude, lng: longitude},
    zoom: 17,
    styles: map_style
  });
  //Default Style for the marker icon.
  defaultIcon = makeMarkerIcon(SQUARE_PIN,'#00CCBB');
  //New Style for the marker icon when mouse is on top.
  highlightedIcon = makeMarkerIcon(SQUARE,'#FFFF00');
  //infowindow
  largeInfowindow = new google.maps.InfoWindow();

}

function gm_authFailure() {
  alert('Failed to call Google Map API: See Browser Console for Detail');
}

function failed() {
  alert('Failed to call Google Map API: See Browser Console for Detail');
}
