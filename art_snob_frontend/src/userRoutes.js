import React, {useState, useContext} from "react";
import { Link } from "@reach/router";
import { logIn, store } from "./store.js"
import firebase from "firebase/app"
import "firebase/auth" 
import { auth, defaultAnalytics } from "./firebase.js";
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Button from '@material-ui/core/Button';
import { navigate } from "@reach/router"
import { useCookies } from 'react-cookie';



export const SignIn = () => {
  const globalState = useContext(store);
  const { state, dispatch } = globalState;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

      const onChangeHandler = (event) => {
          const {id, value} = event.currentTarget;

          if(id === 'userEmail') {
              setEmail(value);
          }
          else if(id === 'userPassword'){
            setPassword(value);
          }
      };

      const [cookies, setCookie, removeCookie] = useCookies(['fbToken']);

    const signInWithEmailAndPasswordHandler = async (event, email, password, setCookie) => {
        event.preventDefault();
        try {
        const userInfo = await auth.signInWithEmailAndPassword(email, password)
        
        if ('user' in userInfo) {
          const token = await userInfo.user.getIdToken()
          
          setCookie('fbToken', token, { path: '/', maxAge: 3600*24})

          const sess = await logIn(userInfo.user.email, state.sessionId, state, dispatch, token)
          navigate('/walls')
        }
        }
        catch (error) { 
          setError(error.message)
          console.error("Error signing in with password and email", error);
        }
    };
  
    const googleSignInNavigate = async () => {
        // const googleInfo = signInWithGoogle();
        // var provider = new auth.GoogleAuthProvider();
        var provider = new firebase.auth.GoogleAuthProvider();

        try {
          const {user} = await auth.signInWithPopup(provider)
          
          if (user) {
            const token = await user.getIdToken()
          
            setCookie('fbToken', token, { path: '/', maxAge: 3600*24})

            logIn(user.email, state.sessionId, state, dispatch, token)
            navigate('/walls')
          }
        }
        catch(error) {
          // Handle Errors here.
          setError(error.message)
        }

      }

  return (
    <div className="flex-user-container">
      <Typography variant='h5' align='center'>Sign In</Typography>
        {error !== null && <Typography variant='body1' align="center">{error}</Typography>}
        <form className="user-inputs">
        <FormControl variant="outlined">
            <InputLabel htmlFor="userEmail">Email</InputLabel>
            <OutlinedInput id="userEmail" value={email} autoComplete="username" type="email" onChange={(event) => onChangeHandler(event)} label="Email" />
        </FormControl>
        <FormControl variant="outlined">
            <InputLabel htmlFor="userPassword">Password</InputLabel>
            <OutlinedInput id="userPassword" autoComplete="current-password" value={password} type="password" onChange={(event) => onChangeHandler(event)} label="Password" />
        </FormControl>
        <Button variant="contained" onClick = {(event) => {signInWithEmailAndPasswordHandler(event, email, password, setCookie)}}>Sign In</Button>
        </form>
        <Typography variant='subtitle1' align='center' style={{padding: "10px"}}>or</Typography>
        <div className='sign-in-post-menu'>
            <Button variant="contained" color='secondary' onClick={googleSignInNavigate}>Sign in with Google</Button>
            <div>
            <Typography variant='body1' paragraph={true}>Don't have an account?{" "}</Typography>
            <Link to="/signup" className="text-blue-500 hover:text-blue-600">
            Sign up here
            </Link>{" "}
            <br />{" "}
            <Link to = "/passwordreset" className="text-blue-500 hover:text-blue-600">
            Forgot Password?
            </Link>
            </div>
      </div>
    </div>
  );
};


export const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    const onChangeHandler = event => {
      const { id, value } = event.currentTarget;
      if (id === "userEmail") {
        setEmail(value);
      } else if (id === "userPassword") {
        setPassword(value);
      }
    };

    const [cookies, setCookie, removeCookie] = useCookies(['fbToken']);

    
    const createUserWithEmailAndPasswordHandler = async (event, email, password, setCookie) => {
        event.preventDefault();
        try{
          const {user} = await auth.createUserWithEmailAndPassword(email, password);
          
          if (user) {
            const token = await user.getIdToken()
          
            setCookie('fbToken', token, { path: '/', maxAge: 3600*24})

            logIn(user.email, state.sessionId, state, dispatch, token)
            navigate('/walls')
          }
        
        }
        catch(error){
          setError(error.message)
        }
    
        setEmail("");
        setPassword("");
        
      };

    const googleSignInNavigate = async () => {
      // const googleInfo = signInWithGoogle();
      // var provider = new auth.GoogleAuthProvider();
      var provider = new firebase.auth.GoogleAuthProvider();

      try {
        const {user} = await auth.signInWithPopup(provider)
        
        if (user) {
          const token = await user.getIdToken()
        
          setCookie('fbToken', token, { path: '/', maxAge: 3600*24})

          logIn(user.email, state.sessionId, state, dispatch, token)
          navigate('/walls')
        }
      }
      catch(error) {
        // Handle Errors here.
        setError(error.message)
      }

    }

    return (
        <div className="flex-user-container">
        <Typography variant='h5' align='center'>Sign Up</Typography>
        {error !== null && <Typography variant='body1' align="center">{error}</Typography>}
        <form className="user-inputs">
        <FormControl variant="outlined">
            <InputLabel htmlFor="userEmail">Email</InputLabel>
            <OutlinedInput id="userEmail" value={email} type="email" autoComplete="username" onChange={(event) => onChangeHandler(event)} label="Email" />
        </FormControl>
        <FormControl variant="outlined">
            <InputLabel htmlFor="userPassword">Password</InputLabel>
            <OutlinedInput id="userPassword" value={password} autoComplete="new-password" type="password" onChange={(event) => onChangeHandler(event)} label="Password" />
        </FormControl>
        <Button variant="contained" onClick = {(event) => {createUserWithEmailAndPasswordHandler(event, email, password, setCookie)}}>Sign Up</Button>
        </form>
        <Typography variant='subtitle1' align='center' style={{padding: "10px"}}>or</Typography>
        <div className='sign-in-post-menu'>
            <Button variant="contained" color='secondary' onClick={googleSignInNavigate}>Sign up with Google</Button>
            <div>
            <Typography variant='body1' paragraph={true}>Already have an account?{" "}</Typography>
            <Link to="/signin" className="text-blue-500 hover:text-blue-600">
            Sign in here
            </Link>{" "}
            </div>
      </div>
    </div>
    );
  };

export const PasswordReset = () => {
    const [email, setEmail] = useState("");
    const [emailHasBeenSent, setEmailHasBeenSent] = useState(false);
    const [error, setError] = useState(null);
    const onChangeHandler = event => {
      const { id, value } = event.currentTarget;
      if (id === "userEmail") {
        setEmail(value);
      }
    };
    const sendResetEmail = event => {
        event.preventDefault();
        auth
          .sendPasswordResetEmail(email)
          .then(() => {
            setEmailHasBeenSent(true);
            setTimeout(() => {setEmailHasBeenSent(false)}, 3000);
          })
          .catch(() => {
            setError("Error resetting password");
          });
      };
    return (
    <div className="flex-user-container">
        
        <Typography variant='h5' align='center'>Reset your Password</Typography>
        <form className="user-inputs">
        {emailHasBeenSent && <Typography variant='body1'>An email has been sent to you!</Typography>}
        {error !== null && <Typography variant='body1'>{error}</Typography>}
        <FormControl variant="outlined">
            <InputLabel htmlFor="userEmail">Email</InputLabel>
            <OutlinedInput id="userEmail" value={email} type="email" onChange={onChangeHandler} label="Email" placeholder="Input your email" />
        </FormControl>
        <Button variant="contained" onClick={sendResetEmail}>Send me a reset link</Button>

        </form>
        <div className='sign-in-post-menu'>
        <Link
           to ="/signin"
            className="my-2 text-blue-700 hover:text-blue-800 text-center block">
            &larr; back to sign in page
          </Link>
        </div>

      </div>
    );
  };
