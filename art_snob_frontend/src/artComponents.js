import React, { useState,  useEffect, useRef, useContext } from 'react';
import {round} from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from "react-hook-form";
import Slider from '@material-ui/core/Slider';
import { addPropertyControls } from 'framer';
import { store } from './store.js';



export const useArtData = (artId, dispatch, handleScrollClick) => {
  useEffect(() => {
      if (artId){
          fetch('/art/'+artId)
          .then(response => response.json())
          .then(data => dispatch({...data, artId: artId}));
          handleScrollClick();
          // .then(data => dispatch({...data, artId: artId, types: 'ADD_ART'}));
      }
      return (() => {dispatch({name: "", 
      size_price_list: [], 
      standard_tags: [], 
      artist: "",
      images: ""});
      handleScrollClick();
    })
      }, [artId, dispatch]);

}

export const useArrangementData = (nWorks, priceFilter, setArrangeData) => {
  useEffect(() => {
      if (nWorks){
          fetch('/art_configurations/'+nWorks+'?minprice='+priceFilter.min+'&maxprice='+priceFilter.max)
          .then(response => response.json())
          .then(data => {setArrangeData(data.art_configuration);});
      }
      }, [nWorks, priceFilter, setArrangeData]);
}


function ArtWork({ppi, artMargin, size, showprice, artImage, roomId, roomArtId, artId, nullFrame}) {

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    const PPI = ppi ? ppi : 3.0
    const margin = artMargin ? artMargin: round(1.5*PPI) + "px"
    
    const width = state.priceRange[size].artSize[0]*PPI
    const height = state.priceRange[size].artSize[1]*PPI
    
    let nullFrameStyle = {
      width: round(width)+'px',
      height: round(height)+'px',
      overflow: "hidden",
      margin: margin,
      padding: round(2*PPI) + "px",
    }


    let frame = {
          boxSizing: "border-box",
          width: round(width)+'px',
          height: round(height)+'px',
          overflow: "hidden",
          backgroundColor: "#F8F9FA",
          border: round(1*PPI) + "px"+" dashed #222",
          margin: margin,
          padding: showprice ? 0 : round(2*PPI) + "px",
          userSelect: "all",
          pointerEvents: "all",
          boxShadow: "2px 2px 4px #9EA3B0"
        }
    
    let imagePaper = {width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                        }
    
    if (artImage) {
        frame = {...frame,
                border: round(1*PPI) + "px"+" solid #222"}
        
        imagePaper = {...imagePaper,
            backgroundImage: "url(" + artImage + ")",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            boxShadow: "0px -2px 2px rgba(50, 50, 50, 0.75)"
          }
    }
  
    const priceFrame = {
          overflow: "hidden",
          fontFamily: `"Noto Sans JP", sans-serif`,
          color: "#000000",
          fontSize: state.priceRange[size].priceTextSize,
          letterSpacing: 0,
          lineHeight: 1.2,
          fontWeight: 400,
          fontStyle: "normal",
          textAlign: "center",
        }
    // we need to check if (when unfilled) this work can support adding the potential art
   const isArtworkEligible = () => {
    if (state.potentialArt) {
      if (state.potentialArt.size_price_list.map(x => x.type.trim()).includes(size)) {
        return true
      }
      else {
        return false
      }
    }
    else {
      return true
    }
   }

   if (!isArtworkEligible()) {
    imagePaper = {...imagePaper,
      backgroundColor: "#adb5bd",
      opacity: 0.2 
    }
   }

    const clickAction = (aid) => {
      if (state.potentialArt && isArtworkEligible()) {
        dispatch({...state.potentialArt, type: 'ADD_ART', roomId: roomId, roomArtId: roomArtId})
        dispatch({type: 'POTENTIAL_ART', artData: null})
      }
      else if (aid) {
        dispatch({type: 'ART_DETAIL', id: aid})
      }
    }

    const checkForNullFrame = (nullFrame) =>
    {
        if (nullFrame) {
          return <div style={nullFrameStyle}></div>
        }
        else {
            return (<div style={frame} onClick={()=>clickAction(artId)}>
            <div style={imagePaper}>
              {(showprice)
                  ? <div style={priceFrame}>
                      {state.priceRange[size].sizeDesc}<br/>
                      <span style={{"color": "#56876D", "fontWeight": 900}}>{state.priceRange[size].price}</span>
                    </div>
                  : ''
              }
              {(!isArtworkEligible()) ? <div style={{fontSize: state.priceRange[size].priceTextSize, textAlign: 'center'}}>No matching<br/>size...</div>:  ''
              }
              </div>
              </div>)
        }

    }

    return ( checkForNullFrame(nullFrame) )
  }
  
function recursiveArrange(arrangement, art, ppi, id, showPrices){
    // recursively extract the row arrangement
    const artArray = [];
    // TODO need to add keys to the subelements here 
    for (const property in arrangement) {
        if (typeof(arrangement[property]) === "number"){
            artArray.push(<ArtWork key={id+(arrangement[property]-1).toString()}
                                   size={art[arrangement[property]-1].size} 
                                   ppi={ppi} 
                                   artId={art[arrangement[property]-1].artId}
                                   artImage={art[arrangement[property]-1].images}
                                   roomId={id}
                                   roomArtId={arrangement[property]}
                                   nullFrame={(art[arrangement[property]-1].artId=="NULLFRAME")}
                                   showprice={showPrices}
                                   > </ArtWork>)
            continue
        }
        
        switch(property){
            case 'rows':  
                return (<div className='arrangement-row' key={id+uuidv4()}>
                    {recursiveArrange(arrangement[property],
                     art,
                     ppi,
                     id,
                     showPrices)}
                </div>)
            case 'cols':
                return (<div className='arrangement-col' key={id+uuidv4()}>
                    {recursiveArrange(arrangement[property], 
                    art,
                    ppi,
                    id,
                    showPrices)}
                </div>)
            default:
                artArray.push((recursiveArrange(arrangement[property], art, ppi, id, showPrices)))
        }   
    }
    return artArray
  }

  
  function ArtArrangement({arrangement, art, ppi, artHeight, id, showPrices}) {
  // get the arrangement from the props data structure
  // at the root, each node name is the size to dictate the node
  // deal with the side effect of querying art data
  const arrangementStyle = {
    width: "100%",
    height: artHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
  return (
  <div style={arrangementStyle}>{recursiveArrange(arrangement, art, ppi, id, showPrices)}</div>
  )
  }
  

  function RoomView({room, showPrices}){

    const globalState = useContext(store);
    const { state } = globalState;

    const ref = useRef(null);
    const [dimensions, setDimensions] = useState({ width:0, height: 0 });
    const blurring = room.showingMenu ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}

 
    useEffect(() => {
    setDimensions(ref.current ? {'width': ref.current.offsetWidth,
        'height': ref.current.offsetHeight}: {'width': 0, 'height': 0})
    }, [ref.current]);

    //TODO: include key for each PPI across each image
    const ZOOM = 1.0

    const PPI = {'living_room': (2486.0/104.0 * (dimensions.width / 3991.0) * ZOOM),
                 'blank': (4.0*ZOOM)}

    const roomImage = {'living_room': process.env.PUBLIC_URL + '/livingroom_noart.png',
                        'blank': null}

    const artHeight = {'living_room': '50%', 'blank': '100%'}

    //TODO: set up centerline margins for each room...
    const centerLineMargins = {'living_room': "75px"}

    const roomBackground = {
      width: "100%",
      maxWidth: "500px",
      height: 296,
      overflow: "visible",
      backgroundImage: "url(" +roomImage[room.roomType] + ")",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      margin: "auto"
    }

    return (
      <div className="roomview" style={blurring}>
        <div ref={ref} style={roomBackground}>
          <ArtArrangement arrangement={room.arrangement} art={room.art} 
          ppi={PPI[room.roomType]} id={room.id}
          artHeight={artHeight[room.roomType]}
          showPrices={showPrices}
          />
        </div>
      </div>
    )
  }

  function RoomDescription({name, artNumFilled, artNumTotal, priceRange, selection, onRoomAdd, room, setIsUpdated, artDispatch, showingMenu, addNewMenu}){

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    //TODO: the case when this is the selected room!
    // TODO: memoize this function
    const artPriceExtractor = (art) => {
      if ("size_price_list" in art) {
        let typeMatch = art.size_price_list.filter( a => a.type.trim() == art.size)
        if (typeMatch.length > 0) {
          return "$"+typeMatch[0].price
        }
        else {
          return "$0"
        }
      }
      else {
        return "$0"
      }

    }

    const selectionLabel = () => {
      if (selection == name) {
        return (
        <div className="collection-text-sub" style={{'color': '#56876D'}}>
          Selected!
        </div>)
      }
      else {
        return (
          <div className="collection-text-sub">
          Not selected
          </div>
          )
      }
    } 

    if (priceRange) {
      return  (<div className="room-description">
      <div className="room-title">
        <div className="room-name">
          {name}
        </div>
        {
        selectionLabel()
      }
      </div>
      <div className="room-price-and-add-button">
      <span className="material-icons md-36" onClick={()=>{
                            setIsUpdated(true);
                            onRoomAdd(room)}} style={{"pointerEvents": "all"}}>add_circle_outline</span>
      <div className="price-text">{'$'+priceRange[0]+'- $'+priceRange[1]}</div>
      </div>
    </div>)
    }
    else if (addNewMenu) {
      return(
        <div className="room-description">
          <div className="room-title">
            <div className="room-name">
              {name}
            </div>
            <div className="room-works">
              {artNumFilled}/{artNumTotal}
            </div>
          </div>
          <span className="material-icons md-36" onClick={()=>{
                            dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {show: true, currentName: '', selectionRoom: {roomType: ''}}});}} style={{"pointerEvents": "all"}}>add_circle_outline</span>
        </div>
      )

    }
    else {
    return(
      <div className="room-description">
        <div className="room-title">
          <div className="room-name">
            {name}
          </div>
          <div className="room-works">
            {artNumFilled}/{artNumTotal}, ${Math.round(room.art.map(a => artPriceExtractor(a)).reduce((total, inp) => total+parseFloat(inp.substring(1)), 0))}
          </div>
        </div>
        {(showingMenu) ?
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': false})}}>arrow_back</span>:
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': true})}}>more_horiz</span>
        }
      </div>
    )}
  }
  
function RoomConfigurationBrowse(){
  
  const globalState = useContext(store);
  const { dispatch, state } = globalState;

  const [name, setName] = useState(state.newRoomShow.currentName)
  const [isUpdated, setIsUpdated] = useState(false)
  const [thisRoom, setThisRoom] = useState(state.newRoomShow.selectionRoom)
  const { register, handleSubmit, watch, errors } = useForm();
  const [numMultiWorks, setNumMultiWorks] = useState(2);
  const [numVisibleMultiWorks, setNumVisibleMultiWorks] = useState(2);
  const [priceFilter, setPriceFilter] = useState({'min': 20, 'max': 1200});
  const [visiblePriceFilter, setVisiblePriceFilter] = useState({'min': 20, 'max': 1200});
  const [roomSelect, setRoomSelect] = useState([{'name': null, 
                                              'art': {id:1, size: 'xsmall', artId: null}, 
                                              'arrangements': {'rows': [1], 
                                              'arrangementSize': 1}}])
  
  const selectionType = state.newRoomShow.selectionRoom.roomType ? state.newRoomShow.selectionRoom.roomType : ''

  useArrangementData(numMultiWorks, priceFilter, setRoomSelect)
  
  // problem is that the stuff we need in artDispatch is set at call time, and not updated...
  useEffect(() => {
    if (('name' in thisRoom) & (name != '') & (isUpdated == true)) {

      // TODO: we need to split this into a conditional 
      // then ADD_NAME and ADD_ARRANGEMENT if it's something that already exists
      if ('id' in state.newRoomShow.selectionRoom) {
        dispatch({type: "ADD_NAME", id: state.newRoomShow.selectionRoom.id, name: name});
        dispatch({type: "ADD_ARRANGEMENT", ...thisRoom, id: state.newRoomShow.selectionRoom.id, roomType: state.newRoomShow.selectionRoom.roomType, showingMenu: false});
      }
      else {
        dispatch({type: "ADD_ROOM", room: {...thisRoom, name: name, id: uuidv4(), roomType: "blank", showingMenu: false}})
      }
      dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {show: false, currentName: '', selectionRoom: {roomType: ''}}});
    }
    }, [thisRoom, name, dispatch]);

  const onSubmit = (data) => {
      setIsUpdated(true);
      setName(data["room_name"]);
  };

  const includeTest = () => {if (selectionType in state.priceRange) { return "Selected"} else { return "Not Selected (tap to select)"}}
  const includeShowPrice = (selectionType) => {if (['p_large', 'l_large'].includes(selectionType)) {return true} else {return false}}
// gotta loop over artworks for the carousal
  return (
    <div style={{"marginTop": "45px"}}>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className='room-name-entry'>
          <div className='room-name-form'>
            Name:
          </div>
          <input className='name-form' name="room_name" defaultValue={state.newRoomShow.currentName} ref={register}/>
          <input type="submit" />
        </div>
        </form>
        <div className="collection-heading">
          <div className="stacked-descriptors">
            <div className="collection-text "> 
              Single work selections
            </div>
            <div className="collection-text-sub">
             {includeTest()}
            </div>
          </div>
          <div className="price-text">
            $40-$200
          </div>
        </div>
        <div className='single-work-art-sizes'>
            <div className='single-work-art-stack'>
            {Object.entries(state.priceRange).map(([size, {price, name, sizeDesc}], index)=>{
                return (<div className='single-work-view'>
                          <div className="work-desc-text">{name}</div>
                          <ArtWork key={'single-price-sample'+index.toString()}
                                            size={size} 
                                            PPI={3.0} 
                                            artId={null}
                                            artImage={null}
                                            setArtDetailShow={null}
                                            artDispatch={null}
                                            potentialArt={null}
                                            roomId={'room-single'+index.toString()}
                                            roomArtId={null}
                                            showprice={includeShowPrice(size)}
                                            > 
                                            </ArtWork>
                          {(!includeShowPrice(size)) ?(
                          <div className="work-desc-text" style={{'height': '40px'}}>{sizeDesc}<br/>
                          <span style={{"color": "#56876D", "fontWeight": 900}}>{price}</span>
                          </div>
                          ): null
                          }
                        </div>)
            }
            )}

            </div>
          </div>
        
        <div className="collection-heading multi">
          
          <div className="stacked-descriptors multi">
            <div className="collection-text "> 
              Multi work selections
            </div>
            <div className='filter-selectors'>
                <div style={{'width': '50%'}}>
                <div className="min-max-price-input">
                  <div className="room-name-form" style={{'paddingRight': '25px'}}>
                  {'Works ('+numMultiWorks+')'}
                  </div>
                  
                </div>
                <Slider
                      style={{'width': '75%'}}
                      value={numVisibleMultiWorks}
                      min={2}
                      step={1}
                      max={6}
                      onChange={(event, value) => {setNumVisibleMultiWorks(value)}}
                      onChangeCommitted={(event, value) => {setNumMultiWorks(value)}}
                      getAriaLabel={(index)=> index.toString()}
                      getAriaValueText={(value, index)=> value.toString()}
                      valueLabelDisplay="auto"
                    />
                </div>
                <div style={{'width': '50%'}}>
                  <div className="min-max-price-input">
                    <div className="room-name-form">
                    {'Price ($'+priceFilter.min+' to $'+priceFilter.max+')'}
                    </div>
                  </div>
                  <Slider
                    style={{'width': '75%'}}
                    value={[visiblePriceFilter.min, visiblePriceFilter.max]}
                    min={20}
                    step={20}
                    max={1200}
                    onChange={(event, value) => {setVisiblePriceFilter({min: value[0], max: value[1]})}}
                    onChangeCommitted={(event, value) => {setPriceFilter({min: value[0], max: value[1]})}}
                    getAriaLabel={(index)=> index.toString()}
                    getAriaValueText={(value, index)=> value.toString()}
                    valueLabelDisplay="auto"
                  />
                </div>
              </div>
            </div>
          </div>
        
        <div>
        {roomSelect.map((room, _) => {
          let thisId = uuidv4()
          return (<div className="room" id={room.name} key={room.name}>
                  <RoomDescription name={room.name} artNumFilled={0} artNumTotal={room.arrangementSize} 
                  priceRange={[room.minprice, room.maxprice]} selection={selectionType}
                  onRoomAdd={setThisRoom} room={room} setIsUpdated={setIsUpdated}/>
                  <RoomView room={{roomType:'blank', arrangement: room.arrangement, art: room.art, id: thisId}} showPrices={true}></RoomView>
                  </div>)
          })
        }
        </div>
      
    </div>
  )
}

function RoomMenu ({art, room}) {

  const globalState = useContext(store);
  const { dispatch } = globalState;

return (<div className="menu-box">
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => 
            
            dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: art})
            
            }>search</span>
            <div className="room-menu-text">Find art...</div>
          </div>
          {/* figure out why this doesn't work via adding the room to the feed?? */}
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: room.name, selectionRoom: {...room, showingMenu: false}, show: true}})
              }}>edit</span>
            <div className="room-menu-text">Change room...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              dispatch({type: 'CHECKOUT_ROOM_SHOW', room: room})
              }}>shopping_cart</span>
            <div className="room-menu-text">Purchase room...</div>
          </div>
        </div>
        )
}  

  export function Rooms() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    const blurring = state.artDetailShow ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}
    let roomStyle = {...blurring}

    if (state.newRoomShow.show)
      {roomStyle = {...roomStyle, marginTop: '78px'}}

    if (state.potentialArt)
    {roomStyle = {...roomStyle, marginTop: '237px'}}

    // optionally give instructions for placing a work of art into a room
    const artExplain = () => {
      if (state.potentialArt) {
        return (
              <div className="explain-menu" style={{top: '196px'}}>
                  <span className="material-icons md-36" onClick={() => {dispatch({type: 'POTENTIAL_ART', artData: null})}}>keyboard_backspace</span>
                  <div className="explain-text">Select a spot for your art</div>
              </div>
        )

      }
    }

    // TODO: need to not show this when the browse menu is up
    const roomFeed = () => {
      if(state.newRoomShow.show){
        return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-36" onClick={() => {dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'})}}>keyboard_backspace</span>
                  <div className="explain-text">Choose a name and artwork configuration</div>
              </div>
              <RoomConfigurationBrowse/>
            </div>
        )
      }
      else {
        return (state.rooms.map((room, _) => {
          return (
                  <div className="room-menu-box" key={'rmb'+room.id}>
                    {(room.showingMenu) ? (<RoomMenu art={room.art} room={room}/>):''}
                    <div className="room" id={room.id} key={room.id}>

                      <RoomDescription key={'rd'+room.id} name={room.name} artNumFilled={room.art.filter(a => (a.artId != null) & (a.artId != 'NULLFRAME')).length} artNumTotal={room.arrangementSize} artDispatch={dispatch} showingMenu={room.showingMenu} room={room}></RoomDescription>
                      
                      <RoomView key={'rv'+room.id} room={room}></RoomView>

                    </div>
                  </div>
                  )
          })
          )

      }

    }


    return(
    (!state.artBrowseSeed) && (
    <div className="room-main">
        <div className="room-feed" style={roomStyle}>
        {artExplain()}
        {
          roomFeed()
        }
        {
          (state.newRoomShow.show == false) ? <RoomDescription name={"Add new room..."} artNumFilled={0} artNumTotal={0} room={{art:[]}} addNewMenu={true} artDispatch={dispatch}></RoomDescription> : ''
        }
        </div>
       </div>
    ))
  }