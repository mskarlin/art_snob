import React, { useState,  useContext, useReducer, useRef, useCallback } from 'react';
import { Router, Link, navigate, useMatch } from "@reach/router"

// import logo from './logo.svg';
import { v4 as uuidv4 } from 'uuid';
import './sidebar.scss';
import './App.css';
import { CookiesProvider, useCookies } from 'react-cookie';
import { useFetch, useInfiniteScroll } from './feedHooks'
import {Rooms} from "./artComponents"
import {TasteFinder} from "./tasteFinder"
import {ArtDetail, ArtCarousel} from "./detailView"
import {RoomConfigurations} from "./roomConfiguration.js"
import {ArtBrowse} from "./artBrowse"
import {Privacy} from "./privacy.js"
import {Terms} from "./terms.js"
import { StateProvider, store, UserProvider, initialState } from './store.js';
import {SignIn, SignUp, PasswordReset} from './userRoutes.js'
import {PurchaseList} from "./purchasePage"
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { ThemeProvider, createMuiTheme, makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HelpIcon from '@material-ui/icons/Help';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import AssignmentIcon from '@material-ui/icons/Assignment';
import HomeIcon from '@material-ui/icons/Home';
import FavoriteIcon from '@material-ui/icons/Favorite';


const fontTheme = createMuiTheme({
  typography: {
    fontFamily: [
      "Noto Sans JP", 
      "sans-serif"
    ].join(','),
  },
});



function App() {
  const [loadMore, setLoadMore] = useState(false);
  
  const imgReducer = (state, action) => {
    switch (action.type) {
      case 'STACK_IMAGES':
        return { ...state, images: state.images.concat(action.images) }
      case 'FETCHING_IMAGES':
        return { ...state, fetching: action.fetching }
      default:
        return state;
    }
  }
  const [imgData, imgDispatch] = useReducer(imgReducer,{ images:[], fetching: true})


  // starting state for entire thing...
  let feedBoundaryRef = useRef(null);
  useFetch(loadMore, imgDispatch, setLoadMore);
  useInfiniteScroll(feedBoundaryRef, setLoadMore);

  return (
    <CookiesProvider>
      <UserProvider>
        <StateProvider>
        <ThemeProvider theme={fontTheme}>
        <Router>
            <AppParent path="/" imgData={imgData} feedBoundaryRef={feedBoundaryRef}>
              <SplashPage path="/" />
              <SignIn path="/signin" />
              <SignUp path="/signup" />
              <Privacy path="/privacy"/>
              <Terms path="/terms"/>
              <PasswordReset path="/passwordreset" />
              <TasteFinder path="/taste"/>
              <RoomConfigurations path="/configure/:id"/>
              <Rooms path="/rooms"/>
              <ArtBrowse path="/browse/:id"/>
              <ArtDetail path="/detail/:id"/>
              <PurchaseList path="/purchase/:id"/>
            </AppParent>
          </Router>
          </ThemeProvider>
        </StateProvider>
      </UserProvider>
    </CookiesProvider>
  )
}

function TopHeader( {imgData, feedBoundaryRef } ) {
  return (<div style={{"position": "fixed", "top": 0, "zIndex": 4}}>
            <MainHeader />
            <TopArtFeed imgData={imgData} feedBoundaryRef={feedBoundaryRef}/>
          </div>)
}


function AppParent({children, imgData, feedBoundaryRef }) {

  const globalState = useContext(store);
  const { state } = globalState;

  return (
    <div className="App">
      <main>
        <div className="view-parent">
          <TopHeader imgData={imgData} feedBoundaryRef={feedBoundaryRef}/>
          <LandingPage />
          {children}
          {<Footer/>}
        </div>
      </main>
    </div>
  )
}

function LandingPage() {
  const globalState = useContext(store);
  const { state, dispatch } = globalState;

  const baseMatch = useMatch('/')
  if (baseMatch) {
  return (
  <div style={{marginTop: "77px"}}>
  <ArtCarousel endpoints={['/random/']} showTitle={false} imgSize={'large'}/>
  <div className='welcome-banner'>
    <Typography variant="h5" align="center" style={{fontWeight: 800, paddingBottom: "15px"}}>Find art that matches your taste</Typography>
    <Button variant="contained" color="secondary" onClick={()=>{
                            const tmpRoom = {...state.blankRoom, id: uuidv4()}
                            dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: true}});
                            navigate("/taste");
                            }
                            } 
                            style={{"pointerEvents": "all"}}>
     Start the taste finder
    </Button>
  </div>
  <ArtCarousel endpoints={['/random/']} showTitle={false} imgSize={'small'}/>
  <LandingCopy/>
  </div>
  )}
  else {
    return (<></>)
  }
}

function LandingCopy() {
  return (
    <div className="landing-copy">
      <Typography variant="h6" align="center" paragraph={true} style={{ fontWeight: 600}}>
       Enliven your home with the perfect wall art
      </Typography>
      <Typography variant="body1" align="center" style={{ fontSize: "0.8rem"}}>
        We partner with the largest art print providers while providing advanced recommendation algorithms that
        find the best match for your home out of 100,000+ works.
      </Typography>
    </div>
  )
}


function Footer() {
  return (
    <div className="footer">
      <div className="footer-links">
       <Link to="terms" style={{fontFamily: `"Noto Sans JP", sans-serif`}}>Terms of Use</Link>
       <Link to="privacy" style={{fontFamily: `"Noto Sans JP", sans-serif`}}>Privacy Policy</Link>
       <Link to="about" style={{fontFamily: `"Noto Sans JP", sans-serif`}}>About Us</Link>
       </div>
       <Typography variant="body1" style={{fontFamily: `"Noto Sans JP", sans-serif`}}>ArtSnob, LLC is doing business as Deco</Typography>
    </div>
  )
}


function TopArtFeed({imgData, feedBoundaryRef, menuHide}){
const globalState = useContext(store);
const { dispatch, state } = globalState;

  const detailMatch = useMatch('/detail:id')
  const roomMatch = useMatch('/rooms')
  // const baseMatch = useMatch('/')

if (detailMatch || roomMatch )
{
return (
        <div className='art-feed'>
            <div className='carousal-spacing main-feed' style={{'width': imgData.images.length*126+15+'px'}}>
              {imgData.images.map((image, index) => {
                const { artist, images, id } = image
                return (
                  <div key={index} className='imgholder'>
                        <img
                          alt={artist}
                          data-src={'https://storage.googleapis.com/artsnob-image-scrape/'+images}
                          className="imgholder img"
                          src={'https://storage.googleapis.com/artsnob-image-scrape/'+images}
                          style={{"pointerEvents": "all"}}
                          onClick={()=>{
                            dispatch({type: 'POTENTIAL_ART', artData: null})
                            navigate('/detail/'+id)
                            }}
                        />
                  </div>
                )
              })}
              {imgData.fetching && (
              <div className='loadingbox'>
                <p>...</p>
              </div>
                )}
                <div id='feed-boundary' style={{ border: '1px solid black' }} ref={feedBoundaryRef}></div>
            </div>
          </div>
)}
else {return <div id='feed-boundary' style={{ display: 'none' }} ref={feedBoundaryRef}></div>}
}



function SplashPage() {
  // NOTE THIS IS BEING CALLED MANY TIMES SO FOR EACH IMAGE LOAD OF THE ABOVE..
  // THIS IS RE-RUN SO WE NEED AN EFFECT AT THE HIGHER LEVEL!!!
  const { state } = useContext(store);

  var landingModalOver = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(33, 37, 41, 0.98)",
    top: 0,
    position: "absolute",
    zIndex: 6
  }
  
  function loadLandingPage() {
    if (state.landingState.open) {
      landingModalOver['display'] = 'block'
      return landingModalOver
    }
    else {
      landingModalOver['display'] = 'none'
      return landingModalOver
    }}
  
  return (
      <div style={loadLandingPage()}>
      <WelcomeMessage></WelcomeMessage>
      </div>
  )

}

function WelcomeMessage() {

  const globalState = useContext(store);
  const { dispatch } = globalState;

  const firstLine = {
    width: 327,
    height: 50,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    overflow: "hidden",
  }
  const welcomeMessage = {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
    background: "none",
    alignItems: "center",
    padding: "0px",
    overflow: "hidden",
    transform: "none"

  }
return (
        <div style={welcomeMessage}>
          <div style={firstLine}>
            <div className="welcome-to">Welcome to  </div>
            <div className="magic-lattice-art">Deco</div>
          </div>
          <div className="centerline">The room-centric art finder to complete your home.</div>
          <div className="cookiesnote">Note that we use cookies to store your info between sessions.</div>
          <Button variant="contained" color="primary" onClick={() => dispatch({type: "TOGGLE_LANDING"})}>Get Started!</Button>
        </div>
      )

}


function TopMenuDrawer({drawerOpen, setDrawerOpen, toggleDrawer}) {

  const globalState = useContext(store);
  const { state, dispatch } = globalState;
  const [cookies, setCookie, removeCookie] = useCookies(['fbToken']);

  const logOut = () => {

    removeCookie('fbToken')
    dispatch({type: 'TOGGLE_LOG_STATE', state: false})
    dispatch({type: 'ASSIGN_STATE', state: initialState})
    navigate('/rooms')

  }


  const list = () => (
    <div
      // className={''}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
          { state.loggedIn ? 
          <ListItem button key='Log out' onClick={() => logOut()}>
            <ListItemIcon>{<AssignmentIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Log out' />
          </ListItem> :
          <ListItem button key='Sign In' onClick={() => navigate('/signin')}>
            <ListItemIcon>{<AssignmentIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Sign In' />
          </ListItem>}
          {
          state.newRoomShow.show ?
          <ListItem button key='Take taste finder' onClick={() => navigate('/taste')}>
            <ListItemIcon>{<NewReleasesIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Take taste finder' />
          </ListItem> :
          <ListItem button key='Browse art' onClick={() => {
                                                            dispatch({type: 'ART_BROWSE_SEED',
                                                            artBrowseSeed: state.rooms[0]});

                                                            navigate(`/browse/${state.rooms[0].id}`)

                                                            }}>
            <ListItemIcon>{<NewReleasesIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Browse art' />
          </ListItem>
          }
          <ListItem button key='Rooms' onClick={() => navigate('/rooms')}>
            <ListItemIcon>{<HomeIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Rooms' />
          </ListItem>
          <ListItem button key='About' onClick={() => navigate('/about')}>
            <ListItemIcon>{<HelpIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='About' />
          </ListItem>
          <ListItem button key='Favorites' onClick={() => navigate('/browse')}>
            <ListItemIcon>{<FavoriteIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Favorites' />
          </ListItem>
      </List>
    </div>
  );

  return (
    <>
      {
        <Drawer anchor={'left'} open={drawerOpen} onClose={toggleDrawer(false)}>
            {list()}
          </Drawer>
      }
    </>
  );
}



function MainHeader() {

  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(!drawerOpen);
  };

  const header = {
    boxSizing: "border-box",
    width: "100vw",
    height: 78,
    overflow: "hidden",
    backgroundColor: "white",
    borderStyle: "solid",
    borderColor: "#222",
    borderTopWidth: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  }

  const headerStack = {
    boxSizing: "border-box",
    width: "100vw",
    height: 78,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    overflow: "visible",
  }

  return (
    <div style={header}>
      <div style={headerStack}>
      <div className="deco-header" onClick={() => navigate('/')}>Deco</div>
      <span className="material-icons md-36" style={{color: 'black'}} onClick={toggleDrawer(true)}>menu</span>
      <TopMenuDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} toggleDrawer={toggleDrawer}/>
      </div>
    </div>

  )
}

export default App;
