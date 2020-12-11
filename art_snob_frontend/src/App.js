import React, { useState,  useContext, useReducer, useRef, useCallback } from 'react';
import { Router, Link, navigate, useMatch } from "@reach/router"

// import logo from './logo.svg';
import { v4 as uuidv4 } from 'uuid';
import './sidebar.scss';
import './App.css';
import { useFetch, useInfiniteScroll } from './feedHooks'
import { Frame, Stack } from "framer";
import {Rooms} from "./artComponents"
import {TasteFinder} from "./tasteFinder"
import {ArtDetail, ArtCarousel} from "./detailView"
import {RoomConfigurations} from "./roomConfiguration.js"
import {ArtBrowse} from "./artBrowse"
import { StateProvider, store } from './store.js';
import {PurchaseList} from "./purchasePage"
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';


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
    <StateProvider>
    <ThemeProvider theme={fontTheme}>
    <Router>
        <AppParent path="/" imgData={imgData} feedBoundaryRef={feedBoundaryRef}>
          <SplashPage path="/" />
          <TasteFinder path="/taste"/>
          <RoomConfigurations path="/configure/:id"/>
          <Rooms path="/rooms"/>
          <ArtBrowse path="/browse/:id"/>
          <ArtDetail path="/detail/:id"/>
          <PurchaseList path="/purchase"/>
        </AppParent>
      </Router>
      </ThemeProvider>
    </StateProvider>
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
          {(!state.landingState.open) && <Footer/>}
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
  <ArtCarousel endpoints={['/random/']} showTitle={false}/>
  <div className='welcome-banner'>
    <Typography variant="h5" align="center" style={{fontWeight: 800, paddingBottom: "15px"}}>Complete your home with the perfect wall art.</Typography>
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
  <ArtCarousel endpoints={['/random/']} showTitle={false}/>
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
      <Typography variant="h6" align="center">
        Find the art that matches your taste.
      </Typography>
      <Typography variant="body1" align="center">
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

// if (!state.newRoomShow.show && !state.artBrowseSeed && !state.purchaseList) 
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
                            dispatch({'type': 'ART_DETAIL', id: id})}}
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
      <Frame style={loadLandingPage()}>
      <WelcomeMessage></WelcomeMessage>
      </Frame>
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
  }
return (
        <Stack style={welcomeMessage}>
          <div style={firstLine}>
            <div className="welcome-to">Welcome to  </div>
            <div className="magic-lattice-art">Deco</div>
          </div>
          <div className="centerline">The room-centric art finder to complete your home.</div>
          <div className="cookiesnote">Note that we use cookies to store your info between sessions.</div>
          <Button variant="contained" color="primary" onClick={() => dispatch({type: "TOGGLE_LANDING"})}>Get Started!</Button>
        </Stack>
      )

}

function MainHeader() {

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
      <div className="deco-header">Deco</div>
      <span className="material-icons md-36" style={{color: 'black'}}>menu</span>
      </div>
    </div>
  )
}

export default App;
