 var infobarTutorial = document.getElementById("progess_bar");

 if (infobarTutorial){
 window.onload = tutorialPageLoad()
 }

$(document).ready(function(){
  $('.your-class').slick({
    "appendArrows": false,
    "draggable": true,
    "swipe": true,
    "zIndex": 9999999
  });
});


 function loginSignOut(){

     firebase.auth().signOut();

     document.getElementById('menu-log-in').classList.toggle('show');
     document.getElementById('menu-log-out').classList.toggle('show');

     buttonSignIn = document.getElementById('sign-in');
     buttonSignOut = document.getElementById('sign-out');

     if (buttonSignOut) {
        buttonSignOut.classList.toggle('show');
        buttonSignIn.classList.toggle('show');
     };

     location.reload();

   }

function nextTutorial() {
    document.getElementById("welcome").classList.toggle("hidden");
    document.getElementById("teach_heart").classList.toggle("hidden");

}

function clickTutorial() {
    document.getElementById("teach_heart").classList.toggle("hidden");
    document.getElementById("teach_recos").classList.toggle("hidden");

}

function favsTutorial() {
    document.getElementById("teach_recos").classList.toggle("hidden");
    document.getElementById("teach_favs").classList.toggle("hidden");

}

function hideTutorial() {
    document.getElementById("infobar_tutorial").classList.toggle("hidden");

}

function colorLikes(intLike){

    var dict = {1: "one", 2: "two", 3: "three", 4: "four"};

    for (i = 1; i <= intLike; i++){

        progress = document.getElementById(dict[i]+'_progress');

        if (progress){

            if (progress.style.background!='#283747') {
            progress.style.color='white'
            progress.style.background='#283747'
            }
        }
    }

    if(intLike >= 4){return true;}
    else{return false;}

}

function tutorialPageLoad(){
   likes = $.cookie("likes")
   if (likes){

       if (parseInt(likes) < 4) {
        colorLikes(parseInt(likes))
        }
        else {
        whiteProgress("one");
        whiteProgress("two");
        whiteProgress("three");
        whiteProgress("four");
        finalTutorialBar();
        }
   }
}


function whiteProgress(val){
        progress = document.getElementById(val+'_progress');
            if (progress){
            progress.style.color='white'
            progress.style.background='white'
            }
}

function finalTutorialBar(){

    tut = document.getElementById('infobar_tutorial');
    tut.style.display = 'none'

    bar_text = document.getElementById('progess_bar');
    bar_text.style.height = 70 + 'px';
    bar_text.style.top = 70 + 'px';

    new_text = document.getElementById('one_progress');
    new_text.style.color = '#283747'
    new_text.innerHTML = "<b>Click here</b> for your recommendations";
    new_text.style.width = "100%";
    new_text.style.lineHeight = 70+'px';
    new_text.style.height = 70 + 'px';
    new_text.style.borderTop = 'solid';
    new_text.style.borderTopWidth = 1 + 'px';
    new_text.onclick = onboardComplete;
    new_text.style.cursor = 'pointer';

}

function clearTutorial(){

    setTimeout(function() {whiteProgress("one");}, 2500);
    setTimeout(function() {whiteProgress("two");}, 2000);
    setTimeout(function() {whiteProgress("three");}, 1500);
    setTimeout(function() {whiteProgress("four");}, 1000);

    setTimeout(finalTutorialBar, 3000);

    }

function onboardComplete()
{

    $.ajax({
        url: "/onboarded",
        type: "POST",
        data: {},
        success: function(response){

        // clear the snapback cache to ensure that a new index is loaded after onboarding
        sessionStorage.removeItem('pageCache');
        window.location.replace('/')

        },
        error: function(){
              // do action
        }
    });

}


function likeImage(img) 
{
   if(img.src.match(/heart_soft/)) img.src = "/static/heart.png";
   else img.src = "/static/heart_soft.png";

   //increment the number of liked posts
   likes = $.cookie("likes")

   if (!likes){
        $.cookie("likes", "1");
        likes = 1
   }
   else {
        likes = parseInt(likes);
        likes++;
        $.cookie("likes", likes.toString());
    }

    tutComplete = colorLikes(likes);

    if (tutComplete){

        clearTutorial()

    }
  
    $.ajax({
        url: "/like",
        type: "POST",
        data: { img: $(img).attr('class') },
        success: function(response){

        //console.log($(img).attr('class'))
        // write the dirty heart only if we're not in the index page
        //$( "img[id^=heart_]" ).each(function( index ) {
        //    snapbackCache.markDirty($( this ).attr('id'));
        //});

        },
        error: function(){
              // do action
        }
    });
       
}


function externalLink(link)
{
    // get the element with the modified link (if it exists)
    cj_link = document.getElementById('cj_generated_link').href;

    console.log(cj_link)

    // do an ajax call to log this to the database
    $.ajax({
            url: "/logexternal",
            type: "POST",
            data: { link: cj_link },
            success: function(response){

            },
            error: function(){
                  // do action
            }
        });

    window.open(link, '_blank');
}

function viewProfile(a)
{
  window.location.href = '/profile';
}


function backToFeed()
{
history.back();
}


function openNavBar()
{
navbar = document.getElementsByClassName("wrapper")[0];
navbar.classList.toggle("opennavbar");

}


function searchBar()
{

// hide all the elements which the search bar will overshadow
title_holder = document.getElementsByClassName("title_holder")[0];
search_holder = document.getElementsByClassName("search_holder")[0];
isearch_holder = document.getElementsByClassName("inline_search")[0];
search_icon = document.getElementById("search_icon");
title_holder.classList.toggle("hidden");
search_holder.classList.toggle("hidden");
isearch_holder.classList.toggle("hidden");

// make the icon an x to cancel the search bar
if(search_icon.src.match(/black-search/)) search_icon.src = "/static/black-x-icon.png";
   else search_icon.src = "/static/black-search-500.png";

}


(function($) {

	skel.breakpoints({
		xlarge:	'(max-width: 1680px)',
		large:	'(max-width: 1280px)',
		medium:	'(max-width: 980px)',
		small:	'(max-width: 736px)',
		xsmall:	'(max-width: 480px)'
	});

	$(function() {
    $("#search-text").autocomplete({
        source:function(request, response) {
            $.getJSON("/autocomplete",{
                q: request.term, // in flask, "q" will be the argument to look for using request.args
            }, function(data) {
                response(data.matching_results); // matching_results from jsonify
            });
        },
        minLength: 1,
        select: function(event, ui) {
            console.log(ui.item.value); // not in your question, but might help later
        },
        appendTo: "#search_autocomplete"

    });
    });

	$(function() {

		var	$window = $(window),
			$body = $('body'),
			$header = $('#header'),
			$footer = $('#footer');

		// Disable animations/transitions until the page has loaded.
			$body.addClass('is-loading');

			$window.on('load', function() {
				window.setTimeout(function() {
					$body.removeClass('is-loading');
				}, 100);
			});

		// Fix: Placeholder polyfill.
			$('form').placeholder();

		// Prioritize "important" elements on medium.
			skel.on('+medium -medium', function() {
				$.prioritize(
					'.important\\28 medium\\29',
					skel.breakpoint('medium').active
				);
			});

		// Header (not logged in going away)
			$header.each( function() {

				var t 		= jQuery(this),
					button 	= t.find('.button');

					this_header = t[0];
                    menubar = document.getElementsByClassName("menubar hidden")[0];
                    searchbar = document.getElementsByClassName("menubar searchbar hidden")[0];
                    title_holder = document.getElementsByClassName("title_holder hidden")[0];
                    smalltitle = document.getElementsByClassName("smalltitle hidden")[0];
                    search_holder = document.getElementsByClassName("search_holder hidden")[0];
                    signup_holder = document.getElementsByClassName("signup_holder hidden")[0];
                    registration = document.getElementsByClassName("registration hidden")[0];
                    content = document.getElementsByClassName("content")[0];
                    tut_popup = document.getElementById('heart_popup');

				button.click(function(e) {

				    this_header.classList.add("hide");
				    menubar.classList.remove('hidden');
                    searchbar.classList.remove('hidden');
                    title_holder.classList.remove('hidden');
                    smalltitle.classList.remove('hidden');
                    search_holder.classList.remove('hidden');
                    signup_holder.classList.remove('hidden');
                    registration.classList.remove('hidden');
                    tut_popup.style.display = 'inline-block';
                    content.style.display = 'none'

					if ( t.hasClass('preview') ) {
						return true;
					} else {
						e.preventDefault();
					}

				});

			});


		// Footer.
			$footer.each( function() {

				var t 		= jQuery(this),
					inner 	= t.find('.inner'),
					button 	= t.find('.info');

				button.click(function(e) {
					t.toggleClass('show');
					e.preventDefault();
				});

			});

	});

})(jQuery);

function loginWindow(){

    openNavBar();
    document.getElementById("login_popup").classList.toggle("show");

}

function loginWindowNoNav(){

    document.getElementById("login_popup").classList.toggle("show");

}


function cancelWindow(){

    document.getElementById("login_popup").classList.toggle("show");
    openNavBar();

}

function closeWelcomeWindow(){

    document.getElementById("welcome_popup").classList.toggle("show");


}