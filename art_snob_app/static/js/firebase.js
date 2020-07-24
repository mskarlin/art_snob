// firebase user auth functinos
// window.addEventListener('load', function () {
//   document.getElementById('menu-log-out').onclick = function () {
//     firebase.auth().signOut();
//     document.getElementById('menu-log-in').classList.toggle('show');
//     document.getElementById('menu-log-out').classList.toggle('show');
//   };
//   });

  // FirebaseUI config.
  var uiConfig = {
    signInSuccessUrl: '/profile',
    signInOptions: [
      // Comment out any lines corresponding to providers you did not check in
      // the Firebase console.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      //firebase.auth.GithubAuthProvider.PROVIDER_ID,
      //firebase.auth.PhoneAuthProvider.PROVIDER_ID

    ],
    // Terms of service url.
    tosUrl: '/tos'
  };

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in, so display the "sign out" button and login info.
      login = document.getElementById('menu-log-in');
      logout = document.getElementById('menu-log-out');

      if (login) {
      if (login.classList.contains('show')){

        login.classList.toggle('show');
        logout.classList.toggle('show');

      };
      };

      buttonSignIn = document.getElementById('sign-in');
      buttonSignOut = document.getElementById('sign-out');

      if (buttonSignOut) {
      if (buttonSignOut.classList.contains('hide')){

        buttonSignIn.classList.toggle('hide');
        buttonSignOut.classList.toggle('hide');

      };
      };


      console.log(`Signed in as ${user.displayName} (${user.email})`);

      user.getIdToken().then(function (token) {
        // Add the token to the browser's cookies. The server will then be
        // able to verify the token against the API.
        // SECURITY NOTE: As cookies can easily be modified, only put the
        // token (which is verified server-side) in a cookie; do not add other
        // user information.
        document.cookie = "token=" + token;
      });
    } else {
      // User is signed out.
      // Initialize the FirebaseUI Widget using Firebase.
      let ui = firebaseui.auth.AuthUI.getInstance();
        if (!ui) {
            ui = new firebaseui.auth.AuthUI(firebase.auth());
         }

      // Show the Firebase login button.
      login = document.getElementById('menu-log-in');
      logout = document.getElementById('menu-log-out');

      if (logout) {

      if (logout.classList.contains('show')){

        login.classList.toggle('show');
        logout.classList.toggle('show');

      };

      };

      buttonSignIn = document.getElementById('sign-in');
      buttonSignOut = document.getElementById('sign-out');

      if (buttonSignIn) {
      if (buttonSignIn.classList.contains('hide')){

        buttonSignIn.classList.toggle('hide');
        buttonSignOut.classList.toggle('hide');

      };
      };

      ui.start('#firebaseui-auth-container', uiConfig);
      // Update the login state indicators.

      // Clear the token cookie.
      document.cookie = "token=";
    }
  }, function (error) {
    console.log(error);
    alert('Unable to log in: ' + error)
  });