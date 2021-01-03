import React, { useState,  useEffect, useRef, useContext } from 'react';
import {round} from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store.js';
import _ from 'lodash';

import { navigate } from "@reach/router"
import Typography from '@material-ui/core/Typography';

import Popover from '@material-ui/core/Popover';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export const useArtData = (artId, dispatch, handleScrollClick) => {
  useEffect(() => {
      if (artId){
          fetch(process.env.REACT_APP_PROD_API_DOMAIN+'/art/'+artId)
          .then(response => response.json())
          .then(data => dispatch({...data, artId: artId}));
          handleScrollClick();
          // .then(data => dispatch({...data, artId: artId, types: 'ADD_ART'}));
      }
      return (() => {dispatch({name: "", 
      size_price_list: [], 
      standard_tags: [], 
      artist: "",
      metadata: {"cluster_id": -1, "cluster_desc": ""} ,
      images: ""});
      handleScrollClick();
    })
      }, [artId, dispatch]);

}

export const useArrangementData = (nWorks, priceFilter, setArrangeData) => {
  useEffect(() => {
      if (nWorks){
          // fetch('/art_configurations/'+nWorks+'?minprice='+priceFilter.min+'&maxprice='+priceFilter.max)
          fetch(process.env.REACT_APP_PROD_API_DOMAIN+'/art_configurations/0?defaults=true')
          .then(response => response.json())
          .then(data => {setArrangeData(data.art_configuration);
                        });
      }
      }, [nWorks, priceFilter, setArrangeData]);
}


export function ArtWork({ppi, artMargin, size, showprice, artImage, roomId, roomArtId, artId, nullFrame, passThroughClick}) {

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
          border: round(1*PPI) + "px dashed #222",
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
                border: round(1*PPI) + "px solid #222"}
        
        imagePaper = {...imagePaper,
            backgroundImage: "url(https://storage.googleapis.com/artsnob-image-scrape/" + artImage + ")",
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: 'rgba(255, 250, 250, 0.85)'
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

   const artPriceExtractor = () => {
    if (state.potentialArt) {
      if ("size_price_list" in state.potentialArt) {
        let typeMatch = state.potentialArt.size_price_list.filter( a => a.type.trim() === size)
        if (typeMatch.length > 0) {
          return "$"+typeMatch[0].price
        }
        else {
          return state.priceRange[size].price
        }
      }
      else {
        return state.priceRange[size].price
      }
  }
  else {
    return state.priceRange[size].price
  }
  }

    const clickAction = (aid) => {
      if (passThroughClick){
        passThroughClick()
      }
      else if (state.potentialArt && isArtworkEligible()) {
        dispatch({...state.potentialArt, type: 'ADD_ART', roomId: roomId, roomArtId: roomArtId})
        dispatch({type: 'POTENTIAL_ART', artData: null})
      }
      else if (aid) {
        navigate('/detail/'+aid)
      }
      else {
        // set dispatch for the right browse seed
        // also set roomArtId to be the art to focus on within that dispatch
        const thisRoom = state.rooms.filter(r=>r.id === roomId)
        dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: thisRoom[0], focusArtId: roomArtId})
        navigate('/browse/'+roomId)
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
                      <span className="material-icons md-18" style={{'color': 'gray'}}>add_circle_outline</span> 
                      {state.priceRange[size].sizeDesc}<br/>
                      <span style={{"color": "#56876D", "fontWeight": 900}}>{artPriceExtractor()}</span>
                    </div>
                  : ''
              }
              {(!isArtworkEligible()) ? <div style={{fontSize: state.priceRange[size].priceTextSize, textAlign: 'center'}}>No matching<br/>size...</div>:  ''
              }
              {(artImage || showprice) ? <></> :
              <div className="new-art-frame"> 
                <Typography variant='caption'>Add</Typography>
                <span className="material-icons md-18" style={{'color': 'gray'}}>add_circle_outline</span> 
              </div>
              }
              </div>
              </div>)
        }

    }

    return ( checkForNullFrame(nullFrame) )
  }
  
function recursiveArrange(arrangement, art, ppi, id, showPrices, passThroughClick){
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
                                   nullFrame={(art[arrangement[property]-1].artId==="NULLFRAME")}
                                   showprice={showPrices}
                                   passThroughClick={passThroughClick}
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
                     showPrices, 
                     passThroughClick)}
                </div>)
            case 'cols':
                return (<div className='arrangement-col' key={id+uuidv4()}>
                    {recursiveArrange(arrangement[property], 
                    art,
                    ppi,
                    id,
                    showPrices, 
                    passThroughClick)}
                </div>)
            default:
                artArray.push((recursiveArrange(arrangement[property], art, ppi, id, showPrices, passThroughClick)))
        }   
    }
    return artArray
  }

  
  function ArtArrangement({arrangement, art, ppi, artHeight, id, showPrices, passThroughClick}) {
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
  <div style={arrangementStyle}>{recursiveArrange(arrangement, art, ppi, id, showPrices, passThroughClick)}</div>
  )
  }
  

  export function RoomView({room, showPrices, passThroughClick}){

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
              passThroughClick={passThroughClick}
              />
        </div>
      </div>
    )
  }

  export function RoomDescription({name, artNumFilled, artNumTotal, priceRange, room, artDispatch, showingMenu, addNewMenu}){

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    const [open, setOpen] = React.useState(false);

        const handleClickOpen = () => {
          setOpen(true);
        };

        const handleClose = () => {
          setOpen(false);
        };

    const buttonColor = () =>
    { if (artNumFilled/artNumTotal === 1.0) {
        return 'secondary'
    }
    else {
      return 'default'
    }
  }

    //TODO: the case when this is the selected room!
    // TODO: memoize this function
    const artPriceExtractor = (art) => {
      if ("size_price_list" in art) {
        if (art.size_price_list) {
          let typeMatch = art.size_price_list.filter( a => a.type.trim() === art.size)
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
      else {
        return "$0"
      }

    }

    const isCurrentSelection = () => {
      return (_.isEqual(state.newRoomShow.selectionRoom.arrangement, room.arrangement) && 
      _.isEqual(state.newRoomShow.selectionRoom.art.map(a => a.size), room.art.map(a => a.size)))
    }

    const selectionLabel = () => {
      if (isCurrentSelection()) {
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
                          dispatch({type: "ADD_ARRANGEMENT", art: room.art, id: state.newRoomShow.selectionRoom.id,
                          arrangement: room.arrangement, arrangementSize: room.arrangementSize,
                          showingMenu: false
                          });
                            navigate('/rooms')
                            }} style={{"pointerEvents": "all",
                                       "color": (isCurrentSelection())?"rgb(1, 142, 66)":"#888"}}
                            >{(isCurrentSelection())?'check_circle_outline':
                            'add_circle_outline'}</span>
      <div className="price-text">{'$'+priceRange[0]+'-$'+priceRange[1]}</div>
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
                            if (state.loggedIn === false && state.rooms.length >= 1){
                              handleClickOpen()
                            }
                            else{
                              const tmpRoom = {...state.blankRoom, id: uuidv4()}
                              dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: false}});
                              navigate('/taste');
                              }}} 
                            style={{"pointerEvents": "all"}}>add_circle_outline</span>
           <Dialog
              open={open}
              onClose={handleClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
            <DialogTitle id="alert-dialog-title">{"Sign up?"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                To save recommendations between sessions please sign up for a free account!
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                handleClose();
                navigate('/signup');
              }} color="primary">
                Sign Up
              </Button>
              <Button onClick={() => {
                handleClose();
                const tmpRoom = {...state.blankRoom, id: uuidv4()}
                dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: false}});
                navigate('/taste');
              }} color="primary" autoFocus>
                Continue as Guest
              </Button>
            </DialogActions>
          </Dialog>
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
            <Button variant='outlined' size='small' style={{"marginLeft": "15px"}} color={buttonColor()} onClick={() => navigate('/purchase/'+room.id)}>Purchase Art</Button>
          </div>
        </div>
        {(showingMenu) ?
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': false})}}>arrow_back</span>:
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': true})}}>more_horiz</span>
        }
      </div>
    )}
  }



function RoomMenu ({art, room}) {

  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [name, setName] = React.useState(room.name);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const keyPress = (e) => {
    if(e.keyCode === 13){
      setAnchorEl(null);
    }
 }

  const handleNameChange = (event) => {
    setName(event.target.value);
    dispatch({type: 'NAME_ROOM', id: room.id, name: event.target.value})
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? 'simple-popover' : undefined;

return (<div className="menu-box">
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => 
            {
            dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: room})
            navigate('/browse/'+room.id)
          }
            }>search</span>
            <div className="room-menu-text" onClick={() => 
            {
            dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: room})
            navigate('/browse/'+room.id)
          }}>Find art...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: room.name, selectionRoom: {...room, showingMenu: false}, show: false}})
              navigate('/configure/'+room.id)
              }}>edit</span>
            <div className="room-menu-text" onClick={() => {
              dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: room.name, selectionRoom: {...room, showingMenu: false}, show: false}})
              navigate('/configure/'+room.id)
              }}>Arrangement...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              navigate('/purchase/'+room.id)
              }}>shopping_cart</span>
            <div className="room-menu-text" onClick={() => {
              navigate('/purchase/'+room.id)
              }}>Purchase room...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={handleClick}>title</span>
            <div className="room-menu-text" onClick={handleClick}>Rename...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => dispatch({type: "DELETE_ROOM", room: room})}>delete_outline</span>
            <div className="room-menu-text"  onClick={() => dispatch({type: "DELETE_ROOM", room: room})}>Delete room...</div>
          </div>
          <Popover 
              id={popoverId}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
          <TextField id="standard-name" label="Name" value={name} onChange={handleNameChange} onKeyDown={keyPress}/>
          </Popover>
        </div>
        )
}  

  export function Rooms() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    let showPrices = false
    let headerClassModifier = ''

    if (state.potentialArt)
    {
      showPrices = true
      headerClassModifier = 'explain'
    } 


    // optionally give instructions for placing a work of art into a room
    const artExplain = () => {
      if (state.potentialArt) {
        return (
              <div className="explain-menu feed">
                  <span className="material-icons md-36" onClick={() => {dispatch({type: 'POTENTIAL_ART', artData: null})}}>keyboard_backspace</span>
                  <div className="explain-text">Select a spot for your art</div>
              </div>
        )

      }
    }

    const roomFeed = () => {
        return (state.rooms.map((room, _) => {
          return (
                  <div className="room-menu-box" key={'rmb'+room.id}>
                    {(room.showingMenu) ? (<RoomMenu art={room.art} room={room}/>):''}
                    <div className="room" id={room.id} key={room.id}>

                      <RoomDescription key={'rd'+room.id} name={room.name} artNumFilled={room.art.filter(a => (a.artId !== null) & (a.artId !== 'NULLFRAME')).length} artNumTotal={room.arrangementSize} artDispatch={dispatch} showingMenu={room.showingMenu} room={room}></RoomDescription>
                      
                      <RoomView key={'rv'+room.id} room={room} showPrices={showPrices}></RoomView>

                    </div>
                  </div>
                  )
          })
          )
    }


    return(
    
    <div className="room-main">
        <div className={"room-feed "+headerClassModifier}>
        {artExplain()}
        {
          roomFeed()
        }
        {
          <RoomDescription name={"Add new room..."} artNumFilled={0} artNumTotal={0} room={{art:[]}} addNewMenu={true} artDispatch={dispatch}></RoomDescription>
        }
        </div>
       </div>
    )
  }