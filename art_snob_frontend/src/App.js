import React, { useState,  useEffect, useReducer, useRef, useCallback } from 'react';
// import logo from './logo.svg';
import { v4 as uuidv4 } from 'uuid';
import living_room from './living_room.jpg';
import './sidebar.scss';
import './App.css';
import { useFetch, useInfiniteScroll } from './feedHooks'
import { Frame, Stack, addPropertyControls } from "framer";
import {Rooms} from "./artComponents"


function App() {
  const [landingState, setLandingState] = useState({"open": true});
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
  const initArtState = {'rooms': [{
    name: "My First Room", 
    id: uuidv4(),
    room_type: "blank",
    art:[{id:1, size: 'l_large', artId: null},
        {id:2, size: 'xsmall', artId: null},
        {id:3, size: 'xsmall', artId: null}], // usually starts out null
    arrangement: {rows: [1, {cols: [2,3]}]}, // usually starts out null
    arrangementSize: 3 // usually starts out 0
  },
  {
    name: "My Second Room", 
    id: uuidv4(),
    room_type: "blank",
    art:[{id:1, size: 'medium', artId: null},
         {id:2, size: 'medium', artId: null},
         {id:3, size: 'medium', artId: null}], // usually starts out null
    arrangement: {rows: [1, 2, 3]}, // usually starts out null
    arrangementSize: 3 // usually starts out 0
  }

]}

  const artReducer = (state, action) => {
    // TODO: delete rooms 
    switch(action.types){
      case 'ADD_ROOM':
        return {...state, rooms: state.rooms.concat(action.room)}
      case 'ADD_ARRANGEMENT':
        // filter for arrangement in the room equal to action.id
        return state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
            // TODO: add validation that the art exists for this
            if ('additionalArt' in action.arrangementSize) {
              return {...room, 
                arrangement: action.arrangement, 
                art: room.art.concat(action.additionalArt)}
            }
            else {
            return {...room, arrangement: action.arrangement}
          }
          }
          else{
            return room
          }
        })
      case 'ADD_ROOMTYPE':
        return state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
            return {...room, room_type: action.room_type}
          }
          else{
            return room
          }
        })
      case 'ADD_ART':
        return state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.roomId) {
              const updatedArtwork = room.art.map((_,work) => {
              if (work.id == action.roomArtId) {
                return {...work, artId: action.ArtId}
              }
              else {
                return work
              }

            }
            )
            return {...room, art: updatedArtwork}
          }
          else{
            return room
          }
        })
      case 'ADD_NAME':
        return state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
            return {...room, name: action.name}
          }
          else {
            return room
          }

        }
        ) 
      default:
        return state;
    }
  }

  const [artData, artDispatch] = useReducer(artReducer, initArtState)

  let feedBoundaryRef = useRef(null);
  useFetch(loadMore, imgDispatch, setLoadMore);
  useInfiniteScroll(feedBoundaryRef, setLoadMore);

  return (
    <div className="App">
      <main>
          <LandingPage landingState={landingState} setLandingState={setLandingState}></LandingPage>
          <div style={{"position": "fixed", "top": 0}}>
            <MainHeader></MainHeader>
            <div className='art-feed'>
              <div className='carousal-spacing main-feed' style={{'width': imgData.images.length*126+15+'px'}}>
                {imgData.images.map((image, index) => {
                  const { artist, images } = image
                  return (
                    <div key={index} className='imgholder'>
                          <img
                            alt={artist}
                            data-src={images}
                            className="imgholder img"
                            src={images}
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
          </div>
          <Rooms rooms={artData.rooms} artData={imgData['images']}></Rooms>
      </main>
    </div>
  )

}


function LandingPage(props) {

  var landingModalOver = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(33, 37, 41, 0.98)",
    top: 0,
    zIndex: 1
  }
  
  function loadLandingPage() {
    if (props.landingState.open) {
      landingModalOver['display'] = 'block'
      return landingModalOver
    }
    else {
      landingModalOver['display'] = 'none'
      return landingModalOver
    }}
  
  return (
      <Frame style={loadLandingPage()}>
      <WelcomeMessage startFunc={props.setLandingState}></WelcomeMessage>
      </Frame>
  )

}

function WelcomeMessage({startFunc}) {
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
          <button variant="primary" onClick={() => startFunc({"open": false})}>Get Started!</button>
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
