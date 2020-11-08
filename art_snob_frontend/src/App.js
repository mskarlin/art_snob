import React, { useState,  useContext, useReducer, useRef, useCallback } from 'react';
// import logo from './logo.svg';
import { v4 as uuidv4 } from 'uuid';
import living_room from './living_room.jpg';
import './sidebar.scss';
import './App.css';
import { useFetch, useInfiniteScroll } from './feedHooks'
import { Frame, Stack, addPropertyControls } from "framer";
import {Rooms} from "./artComponents"
import {ArtDetail} from "./detailView"
import {ArtBrowse} from "./artBrowse"
import { StateProvider, store } from './store.js';


function App() {
  const [loadMore, setLoadMore] = useState(false);
  const [artDetailShow, setArtDetailShow] = useState(null);
  const [potentialArt, setPotentialArt] = useState(null);
  const [newRoomShow, setNewRoomShow] = useState({show: false, currentName: '', selectionRoom: {roomType: ''}});
  
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
      <div className="App">
        <main>
            <LandingPage></LandingPage>
            <div style={{"position": "fixed", "top": 0, "zIndex": 2}}>
              <MainHeader></MainHeader>
              <TopArtFeed imgData={imgData} feedBoundaryRef={feedBoundaryRef}/>
            </div>
            <ArtDetail/>
            <Rooms/>
            <ArtBrowse/>
        </main>
      </div>
    </StateProvider>
  )

}

function TopArtFeed({imgData, feedBoundaryRef, menuHide}){
const globalState = useContext(store);
const { dispatch, state } = globalState;

if (!state.newRoomShow.show && !state.artBrowseSeed) {
return (
        <div className='art-feed'>
            <div className='carousal-spacing main-feed' style={{'width': imgData.images.length*126+15+'px'}}>
              {imgData.images.map((image, index) => {
                const { artist, images, id } = image
                return (
                  <div key={index} className='imgholder'>
                        <img
                          alt={artist}
                          data-src={images}
                          className="imgholder img"
                          src={images}
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



function LandingPage() {
  // NOTE THIS IS BEING CALLED MANY TIMES SO FOR EACH IMAGE LOAD OF THE ABOVE..
  // THIS IS RE-RUN SO WE NEED AN EFFECT AT THE HIGHER LEVEL!!!
  const { state } = useContext(store);

  var landingModalOver = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(33, 37, 41, 0.98)",
    top: 0,
    zIndex: 3
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
          <button variant="primary" onClick={() => dispatch({type: "TOGGLE_LANDING"})}>Get Started!</button>
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
      <span className="material-icons md-36">menu</span>
      </div>
    </div>
  )
}

export default App;
