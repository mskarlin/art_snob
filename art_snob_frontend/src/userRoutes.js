import React, {useState} from "react";
import { Link } from "@reach/router";
import { signInWithGoogle, auth } from "./firebase.js";
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Button from '@material-ui/core/Button';


export const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

      const onChangeHandler = (event) => {
          const {name, value} = event.currentTarget;

          if(name === 'userEmail') {
              setEmail(value);
          }
          else if(name === 'userPassword'){
            setPassword(value);
          }
      };

    const signInWithEmailAndPasswordHandler = (event, email, password) => {
        event.preventDefault();
        auth.signInWithEmailAndPassword(email, password).catch(error => {
          setError("Error signing in with password and email!");
          console.error("Error signing in with password and email", error);
        });
      };


  return (
    <div className="flex-user-container">
      <Typography variant='h5' align='center'>Sign In</Typography>
        {error !== null && <Typography variant='body1' align="center">{error}</Typography>}
        <form className="user-inputs">
        <FormControl variant="outlined">
            <InputLabel htmlFor="userEmail">Email</InputLabel>
            <OutlinedInput id="userEmail" value={email} type="email" onChange={(event) => onChangeHandler(event)} label="Email" />
        </FormControl>
        <FormControl variant="outlined">
            <InputLabel htmlFor="userPassword">Password</InputLabel>
            <OutlinedInput id="userPassword" value={password} type="password" onChange={(event) => onChangeHandler(event)} label="Password" />
        </FormControl>
        <Button variant="contained" onClick = {(event) => {signInWithEmailAndPasswordHandler(event, email, password)}}>Sign In</Button>
        </form>
        <Typography variant='subtitle1' align='center' style={{padding: "10px"}}>or</Typography>
        <div className='sign-in-post-menu'>
            <Button variant="contained" color='secondary' onClick={signInWithGoogle}>Sign in with Google</Button>
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

    const onChangeHandler = event => {
      const { id, value } = event.currentTarget;
      if (id === "userEmail") {
        setEmail(value);
      } else if (id === "userPassword") {
        setPassword(value);
      }
    };
    
    const createUserWithEmailAndPasswordHandler = async (event, email, password) => {
        event.preventDefault();
        try{
          const {user} = await auth.createUserWithEmailAndPassword(email, password);
        }
        catch(error){
          setError(error.code)
        //   setError('Error Signing up with email and password');
        }
    
        setEmail("");
        setPassword("");
      };

    return (
        <div className="flex-user-container">
        <Typography variant='h5' align='center'>Sign Up</Typography>
        {error !== null && <Typography variant='body1' align="center">{error}</Typography>}
        <form className="user-inputs">
        <FormControl variant="outlined">
            <InputLabel htmlFor="userEmail">Email</InputLabel>
            <OutlinedInput id="userEmail" value={email} type="email" onChange={(event) => onChangeHandler(event)} label="Email" />
        </FormControl>
        <FormControl variant="outlined">
            <InputLabel htmlFor="userPassword">Password</InputLabel>
            <OutlinedInput id="userPassword" value={password} type="password" onChange={(event) => onChangeHandler(event)} label="Password" />
        </FormControl>
        <Button variant="contained" onClick = {(event) => {createUserWithEmailAndPasswordHandler(event, email, password)}}>Sign Up</Button>
        </form>
        <Typography variant='subtitle1' align='center' style={{padding: "10px"}}>or</Typography>
        <div className='sign-in-post-menu'>
            <Button variant="contained" color='secondary' onClick={signInWithGoogle}>Sign up with Google</Button>
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
