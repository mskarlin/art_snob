// jQuery

var $container = jQuery('.grid');


// initialize

$(document).ready(function() {

    $container.masonry({
    columnWidth: '.grid-sizer',
    itemSelector: '.grid-item',
    gutter: '.gutter-sizer',
    percentPosition: true

    });


    var msnry = $container.data('masonry');


    var snapbackCache = SnapbackCache({
      bodySelector: "#cached_feed",
      //refreshItems: function (dirtyThings) {
          // need to do an ajax call here
        //}
      });

    jQuery(document).on("click", "#cached_feed a", function (e) {
     snapbackCache.cachePage();

    });

    jQuery(document).on("snapback-cache:loaded", function(e) {
        // reset the layout incase it got messed up after loading
        msnry.layout();
        });


   $container.imagesLoaded().progress( function() {
      $container.masonry('layout');

    });



    $('.grid').infiniteScroll({
      // options
      path: '/index{{#}}',
      outlayer: msnry,
      append: '.grid-item',
      history: 'none',
      button: '.view-more-button',
      scrollThreshold: false

    });



});