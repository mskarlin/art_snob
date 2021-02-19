import React, { useState,  useContext } from 'react';
import { Router, Link, navigate, useMatch } from "@reach/router"

// import logo from './logo.svg';
import { v4 as uuidv4 } from 'uuid';
import './sidebar.scss';
import './App.css';
import { CookiesProvider, useCookies } from 'react-cookie';
import {Rooms} from "./artComponents"
import HistoryIcon from '@material-ui/icons/History';
import {TasteFinder} from "./tasteFinder"
import {About} from "./about.js"
import {ArtDetail, ArtCarousel, SingleCarousel} from "./detailView"
import {RoomConfigurations} from "./roomConfiguration.js"
import {ArtBrowse, Search} from "./artBrowse"
import {Privacy} from "./privacy.js"
import {Terms} from "./terms.js"
import {History} from "./history.js"
import {SharedRoom} from "./sharedWalls.js"
import { StateProvider, store, UserProvider, initialState } from './store.js';
import {SignIn, SignUp, PasswordReset} from './userRoutes.js'
import {PurchaseList} from "./purchasePage"
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HelpIcon from '@material-ui/icons/Help';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import AssignmentIcon from '@material-ui/icons/Assignment';
import HomeIcon from '@material-ui/icons/Home';
import TextField from '@material-ui/core/TextField';
import MUICookieConsent from 'material-ui-cookie-consent';

import { Helmet } from "react-helmet";


const fontTheme = createMuiTheme({
  typography: {
    fontFamily: [
      "Noto Sans JP", 
      "sans-serif"
    ].join(','),
  },
});



function App() {
  return (
    <CookiesProvider>
      <UserProvider>
        <StateProvider>
        <ThemeProvider theme={fontTheme}>
          <Router>
              <AppParent path="/">
                <SplashPage path="/" />
                <SignIn path="/signin" />
                <SignUp path="/signup" />
                <Privacy path="/privacy"/>
                <About path="/about"/>
                <Terms path="/terms"/>
                <PasswordReset path="/passwordreset" />
                <TasteFinder path="/taste"/>
                <RoomConfigurations path="/configure/:id"/>
                <Rooms path="/walls"/>
                <SharedRoom path="/shared/:sessionId/:wallId"/>
                <ArtBrowse path="/browse/:id"/>
                <Search path="/search/:query"/>
                <ArtDetail path="/detail/:id"/>
                <PurchaseList path="/purchase/:id"/>
                <History path="/history"/>
              </AppParent>
            </Router>
          </ThemeProvider>
        </StateProvider>
      </UserProvider>
    </CookiesProvider>
  )
}

function TopHeader () {
  
  const globalState = useContext(store);
  const { state } = globalState;

  const recommendedEndpoints = () => {
    // get seed art ids to send to the backend
    const likes = (state.rooms.length > 0) ? state.rooms[0].clusterData.likes.join(',') : ''
    const dislikes = (state.rooms.length > 0) ? state.rooms[0].clusterData.dislikes.join(',') : ''

    return '/recommended/' + state.sessionId
    + '?likes='+encodeURIComponent(likes)
    + '&dislikes='+encodeURIComponent(dislikes)
}
  
  const endpoint =  recommendedEndpoints()
  const detailMatch = useMatch('/detail:id')
  const roomMatch = useMatch('/walls')

  return (<div style={{"position": "fixed", "top": 0, "zIndex": 4}}>
            <MainHeader />
            {(detailMatch || roomMatch )?
            <div className='art-feed'>
              <SingleCarousel imgSize={''} endpoint={endpoint} showFavoriteSelect={false} index={0} key={'topartfeed'+endpoint}/>
            </div>: <></>}
          </div>)
}


function AppParent({children}) {

  return (
    <div className="App">
      <main>
        <div className="view-parent">
          <TopHeader />
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
  <Helmet>
        <title>Art Snob: the art taste finder</title>
        <meta name="description" 
    content="Quickly find and build an affordable wall art that matches your taste with our art finder app."/>
  </Helmet>
  <ArtCarousel endpoints={['/random/']} showTitle={false} imgSize={'large'}/>
  <div className='welcome-banner'>
    <Typography variant="h5" align="center" style={{fontWeight: 800, paddingBottom: "15px"}}>Find art that matches your taste</Typography>
    <Button variant="contained" color="secondary" onClick={()=>{
                            const tmpRoom = {...state.blankRoom, id: uuidv4()}
                            dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: true}});
                            navigate("/taste");
                            }} 
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
    <>
    <div className="landing-copy">
      <Typography variant="h6" align="center" paragraph={true} style={{ fontWeight: 600}}>
       Bring your home to life with the perfect wall art
      </Typography>
      <Typography variant="body1" align="center" style={{ fontSize: "0.8rem"}}>
      We partner with the largest art print sellers to provide 100,000+ gorgeous works to bring your home to life. 
      Using our advanced, proprietary recommendation algorithms, we find art you will love and help arrange it into optimal configurations for your walls.
      </Typography>
    </div>

    <div className="landing-copy">
      <div className="tutorial-steps">
        <div className="centered-tutorial-image">
          <img src="/find_art.png" height="150px" width="101px" style={{"maxWidth":"100%"}}></img>
          <Typography variant="subtitle1" align="center" paragraph={true} style={{ fontWeight: 600}}>
          1. Use the taste finder to discover art.
          </Typography>
        </div>
        <div className="centered-tutorial-image">
          <img src="/happy_art.png" height="150px" width="150px" style={{"maxWidth":"100%"}}></img>
          <Typography variant="subtitle1" align="center" paragraph={true} style={{ fontWeight: 600}}>
          2. Build your personal art wall.
          </Typography>
        </div>
      </div>
    </div>

    <div className="landing-copy">
      <Typography variant="h6" align="center" paragraph={true} style={{ fontWeight: 600}}>
       State of the art search
      </Typography>
      <Typography variant="body1" align="center" style={{ fontSize: "0.8rem"}}>
      Our search technology gathers art from major print providers and finds what you're searching for with advanced machine learning.
      You can search for anything, no need for tags, try: 
      <Link to='/search/woman%20in%20a%20hat%20on%20a%20bicycle'> woman in a hat on a bicycle, </Link> 
      <Link to='/search/abstract%20guitar%20photos'>abstract guitar photos, </Link> or 
      <Link to='/search/tropical%20pools%20by%20the%20beach'> tropical pools by the beach. </Link>
      Everything you like or do will update your recommended art feed, which you can find by visiting your <Link to='walls'> art walls.</Link>
      </Typography>
    </div>

    </>
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
       <Typography variant="body1" style={{fontFamily: `"Noto Sans JP", sans-serif`}}>ArtSnob, LLC</Typography>
    </div>
  )
}



function SplashPage() {
  // NOTE THIS IS BEING CALLED MANY TIMES SO FOR EACH IMAGE LOAD OF THE ABOVE..
  // THIS IS RE-RUN SO WE NEED AN EFFECT AT THE HIGHER LEVEL!!!
  const { state } = useContext(store);
  
  return (
      <div>
        <MUICookieConsent 
        cookieName="ArtSnobCookieConsent"
        componentType="Snackbar" // default value is Snackbar
        message="Note that we use cookies for analytics and recommendations between sessions."
        />
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
    navigate('/walls')

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
          <ListItem button key='Browse art or favorites' onClick={() => {
                                                            dispatch({type: 'ART_BROWSE_SEED',
                                                            artBrowseSeed: state.rooms[0]});

                                                            navigate(`/browse/${state.rooms[0].id}`)

                                                            }}>
            <ListItemIcon>{<NewReleasesIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Browse art' />
          </ListItem>
          }
          <ListItem button key='Walls' onClick={() => navigate('/walls')}>
            <ListItemIcon>{<HomeIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='Walls' />
          </ListItem>
          <ListItem button key='History' onClick={() => navigate('/history')}>
            <ListItemIcon>{<HistoryIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='History' />
          </ListItem>
          <ListItem button key='About' onClick={() => navigate('/about')}>
            <ListItemIcon>{<HelpIcon style={{'color': 'black'}}/>}</ListItemIcon>
            <ListItemText primary='About' />
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
  const [homeSearch, setHomeSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSearchOpen = (event) => {
    if (event) {
      setSearchOpen(!searchOpen)
    }
  }


  const handleHomeSearch = (event) => {
    if (event){ 
      setHomeSearch(event.target.value)
    }
  }

  const homeSearchKeyPress = (e) => {
    if((e.keyCode == 13) & (homeSearch != '')){
        navigate('/search/'+homeSearch)
        setSearchOpen(false)
     }
}

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

  const searchBorder = () => {
    if (searchOpen) {
      return (
        {borderStyle: "double",
        borderColor: "#222",
        borderTopWidth: 0,
        borderBottomWidth: 1,
        borderLeftWidth: 0,
        borderRightWidth: 0}
      )
    }
    else {
      return {}
    }
   
  }

  return (
    <div className='flex-header-menu' style={searchBorder()}>
    <div style={header}>
      <div style={headerStack}>
      <div style={{'display': 'flex', 'flexDirection': 'row'}}>
        <div className="deco-header" onClick={() => navigate('/')}>Art Snob</div>
        <span className="material-icons md-24" 
        style={{'marginTop': 'auto', 'marginBottom': 'auto', 'cursor': 'pointer', 'pointerEvents': 'all'}} 
        onClick={toggleSearchOpen}>search</span>
      </div>
      <span className="material-icons md-36" style={{color: 'black'}} onClick={toggleDrawer(true)}>menu</span>
      <TopMenuDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} toggleDrawer={toggleDrawer}/>
      </div>
    </div>
    <div>
    {(searchOpen) &&
    (<div style={{'display': 'flex', 'flexDirection': 'row', 'justifyContent': 'center'}}>
      <TextField                        style={{'minWidth': '250px', 'maxWidth': '600px', width: '100%', 'marginBottom': '5px'}}
                                        size={'medium'}
                                        margin={'none'}
                                        onChange={handleHomeSearch}
                                        value={homeSearch}
                                        onKeyDown={homeSearchKeyPress}
                                        label={<span className="material-icons md-18">search</span>}
                                        placeholder="Try abstract or beach art"
                                    />
    <span className="material-icons md-28" style={{'marginTop': 'auto', 'marginBottom': 'auto'}} onClick={toggleSearchOpen}>clear</span>
    </div>
    )
    }

    </div>
  </div>
  )
}

export default App;