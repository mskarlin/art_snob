import React, { useState,  useEffect, useReducer, useRef, useCallback } from 'react';
// import logo from './logo.svg';
import { v4 as uuidv4 } from 'uuid';
import living_room from './living_room.jpg';
import './sidebar.scss';
import './App.css';
import { useFetch, useInfiniteScroll } from './feedHooks'
import { Frame, Stack, addPropertyControls } from "framer";
import {Rooms} from "./artComponents"
import {ArtDetail} from "./detailView"

// gets data from an API and uses a dispatch/reducer to set the art
// TODO: need a new dispatch function for adding art info for a single work
function detailSetter(artId, setter) {
  return (artId) => {setter(artId)}
}


function App() {
  const [landingState, setLandingState] = useState({"open": true});
  const [loadMore, setLoadMore] = useState(false);
  const [artDetailShow, setArtDetailShow] = useState(null);
  const [potentialArt, setPotentialArt] = useState(null);
  const [newRoomShow, setNewRoomShow] = useState(true);
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
  // TODO: use an effect to fetch and a reducer to modify art objects
  // these objects will keep the active art data in memory
  // they can be pulled from the ArtState as well
  // as the "focus" works if something is clicked


  // starting state for entire thing...
  const initArtState = {'rooms': [{
    name: "My First Room", 
    id: uuidv4(),
    roomType: "blank",
    art:[{id:1, size: 'medium', artId: 4926422927802368,
         name: "Food, Don't Waste It - WWI Poster, 1917 Art Print",
         sizes: "X-Small 8\" X 10\"| | |$22.99|Small 13\" X 17\"| | |$27.99|Medium 17\" X 22\"| | |$34.99|Large 21\" X 28\"| | |$42.99",
         standard_tags:  [
          "Graphic-design",
          "Food",
          "Frugal",
          "Kitchen",
          "Decor",
          "Wwi",
          "Print",
          "Art",
          "Poster",
          "Propaganda",
          "Typography",
          "Cheap",
          "Nutrition",
          "Lithograph",
          "Economics",
          "Retro",
          "Vintage",
          "Cooking",
          "Baking",
          "Homemaker"
        ],
        images: "https://storage.googleapis.com/artsnob-image-scrape/full/1a223e13db1bc1e049606c7a61d512cadb343fb7.jpg",
        page_url: "https://society6.com/product/food-dont-waste-it-wwi-poster-1917_print"
      },
        {id:2, size: 'xsmall', artId: null},
        {id:3, size: 'xsmall', artId: null}], // usually starts out null
    arrangement: {rows: [1, {cols: [2,3]}]}, // usually starts out null
    arrangementSize: 3 // usually starts out 0
  },
  {
    name: "My Second Room", 
    id: uuidv4(),
    roomType: "blank",
    art:[{id:1, size: 'p_small', artId: null},
         {id:2, size: 'p_small', artId: null},
         {id:3, size: 'p_large', artId: null},
         {id:4, size: 'p_small', artId: null},
         {id:5, size: 'p_small', artId: null}
        ], // usually starts out null
    arrangement: {rows: [{cols: [1, 2]}, 3, {cols: [4, 5]}]}, // usually starts out null
    arrangementSize: 3 // usually starts out 0
  }

]}


  // TODO: this is where we'll put the POST requests to the App
  const artReducer = (state, action) => {
    // TODO: delete rooms 
    console.log('ACTION', action)
    console.log('STATE', state)
    switch(action.type){
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
        return {rooms: state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.roomId) {
              const updatedArtwork = room.art.map((work, _) => {
              if (work.id == action.roomArtId) {
                return {...work, 
                          artId: action.artId,
                          page_url: action.page_url,
                          standard_tags: action.standard_tags,
                          name: action.name,
                          sizes: action.sizes,
                          images: action.images
                        }
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
        })}
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
  console.log('APP ARTD', artData)
  let feedBoundaryRef = useRef(null);
  useFetch(loadMore, imgDispatch, setLoadMore);
  useInfiniteScroll(feedBoundaryRef, setLoadMore);

  return (
    <div className="App">
      <main>
          <LandingPage landingState={landingState} setLandingState={setLandingState}></LandingPage>
          <div style={{"position": "fixed", "top": 0, "zIndex": 1}}>
            <MainHeader></MainHeader>
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
                              setArtDetailShow(id)}}
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
          {artDetailShow && (
          <ArtDetail artId={artDetailShow} backButton={setArtDetailShow} setPotentialArt={setPotentialArt}/>)
          }
          <Rooms rooms={artData.rooms} artDetailShow={artDetailShow} setArtDetailShow={setArtDetailShow}
          artDispatch={artDispatch} potentialArt={{potentialArt: potentialArt, setPotentialArt: setPotentialArt}}
          newRoomShow={newRoomShow} setNewRoomShow={setNewRoomShow}></Rooms>
      </main>
    </div>
  )

}


function LandingPage(props) {
  // NOTE THIS IS BEING CALLED MANY TIMES SO FOR EACH IMAGE LOAD OF THE ABOVE..
  // THIS IS RE-RUN SO WE NEED AN EFFECT AT THE HIGHER LEVEL!!!
  console.log("I AM LOADING LOADING LOADING ")
  var landingModalOver = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(33, 37, 41, 0.98)",
    top: 0,
    zIndex: 2
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
