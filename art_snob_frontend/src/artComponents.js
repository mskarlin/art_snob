import React, { useState,  useEffect, useRef, useContext } from 'react';
import {round} from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
import { store, postData } from './store.js';
import _ from 'lodash';

import { navigate } from "@reach/router"
import Typography from '@material-ui/core/Typography';

import Popover from '@material-ui/core/Popover';
import TextField from '@material-ui/core/TextField';
import Ruler from "@scena/react-ruler";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import DialogTitle from '@material-ui/core/DialogTitle';
import {DndContext} from '@dnd-kit/core';
import {Draggable, scaleByZoom} from './dragAndDrop.js';
import * as htmlToImage from 'html-to-image';
import {
  EmailShareButton,
  FacebookShareButton,
  PinterestShareButton,
  RedditShareButton,
  TumblrShareButton,
  TwitterShareButton
} from "react-share";

import {
  EmailIcon,
  FacebookIcon,
  PinterestIcon,
  RedditIcon,
  TumblrIcon,
  TwitterIcon
} from "react-share";
// import { useScreenshot } from 'use-react-screenshot'

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  PointerSensor, 
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  restrictToHorizontalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

import { SingleArtSelectMenu } from './roomConfiguration.js'

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


export const ArtWork = React.forwardRef( ({ppi, artMargin, size, showprice, artImage, roomId, roomArtId, 
  artId, nullFrame, passThroughClick, isDrag, setIsDrag, frameColor='#222', selectMenu=false, draggable=false}, ref) => {

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    const deletion = state.deletingArt;

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
          touchAction: 'none',
          backgroundColor: "#F8F9FA",
          border: round(1*PPI) + "px dashed #222",
          padding: showprice ? 0 : round(2*PPI) + "px",
          userSelect: "all",
          pointerEvents: "all",
          boxShadow: "2px 2px 4px #9EA3B0",
        }
      
    if (draggable){
      frame = {...frame,  position: "absolute", left: "40%", top: "100px"}}

    
    let imagePaper = {width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                        }


    if (artImage) {
        frame = {...frame,
                border: round(1*PPI) + `px solid ${frameColor}`}
        
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

   const orientationFlip = (size) => {

    const size_prefix = size.slice(0,2)
    
    if (size_prefix === 'p_') {
      return 'l_'+size.slice(2)
    }
    else if (size_prefix === 'l_') {
      return 'p_'+size.slice(2)
    }
    else {return null}
  
  }

   const artPriceExtractor = () => {
    if (state.potentialArt) {
      if ("size_price_list" in state.potentialArt) {
        let typeMatch = state.potentialArt.size_price_list.filter( a => (a.type.trim() === size) || (orientationFlip(a.type.trim()) === size ) )
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

      if (((isDrag?.x !== 0 || isDrag?.y !== 0))){
        // this checks if it's just been dragged
        if (setIsDrag) {
          setIsDrag({'x': 0, 'y': 0})
        }
        return null
      }

      if (passThroughClick){
        passThroughClick()
      }
      else if (deletion){
        dispatch({type: 'DELETE_ART_FRAME', id: roomId, roomArtId: roomArtId})
      }
      else if (state.potentialArt && isArtworkEligible()) {
        dispatch({...state.potentialArt, type: 'ADD_ART', roomId: roomId, roomArtId: roomArtId})
        dispatch({type: 'POTENTIAL_ART', artData: null})
      }
      else if (aid) {
        navigate('/detail/'+aid)
      }
      else if (!selectMenu) {
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
        else if (deletion) {
          return (<div style={frame} onClick={()=>clickAction(artId)} ref={ref}>
                    <div style={imagePaper}>
                      <div style={priceFrame}>
                          <div className="new-art-frame"> 
                            <RemoveCircleOutlineIcon color="secondary" fontSize="medium"/>
                          </div>
                      </div>
                    </div>
                  </div>)
        }
        else {
            return (
            <div style={frame} onClick={()=>clickAction(artId)} ref={ref}>
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
  )


const RowArrangement = ({art, ppi, id, showPrices, passThroughClick, isDrag, setIsDrag, xScale=1, yScale=1}) => {
    const artRef = useRef(new Array(art.length));

    return (<>{art.map((a,index) => {
      return (
      <Draggable id={a.artId+'-draggable'+index.toString()}
      key={a.artId+'-key-draggable'+(index).toString()}
      x={a.x}
      y={a.y}
      scaleX={xScale}
      scaleY={yScale}
      roomId={id}
      roomArtId={a.id}
      artRef={artRef}
      artIndex={index}
      >
        <ArtWork key={id+(index).toString()}
                                   size={a.size} 
                                   ppi={ppi} 
                                   artId={a.artId}
                                   artImage={a.images}
                                   roomId={id}
                                   roomArtId={a.id}
                                   nullFrame={(a.artId==="NULLFRAME")}
                                   showprice={showPrices}
                                   passThroughClick={passThroughClick}
                                   ref={el => artRef.current[index] = el} 
                                   draggable={true}
                                   isDrag={isDrag}
                                   setIsDrag={setIsDrag}
                                   frameColor={(a?.frameColor)? a?.frameColor : '#222'}
                                   > </ArtWork>
      </Draggable>)
    })
    }</>)
}


function recursiveArrange(arrangement, art, ppi, id, showPrices, passThroughClick, isDrag, setIsDrag){

    // recursively extract the row arrangement
    const artArray = [];
    // TODO need to add keys to the subelements here 
    for (const property in arrangement) {
        if (typeof(arrangement[property]) === "number"){
            artArray.push(
                      <Draggable id={art[arrangement[property]-1].artId+'-draggable'+(arrangement[property]-1).toString()}
                      key={art[arrangement[property]-1].artId+'-key-draggable'+(arrangement[property]-1).toString()}
                      x={art[arrangement[property]-1].x}
                      y={art[arrangement[property]-1].y}
                      roomId={id}
                      roomArtId={art[arrangement[property]-1].id}
                      //artRef={artRef}
                      >
                      <ArtWork key={id+(arrangement[property]-1).toString()}
                                   size={art[arrangement[property]-1].size} 
                                   ppi={ppi} 
                                   artId={art[arrangement[property]-1].artId}
                                   artImage={art[arrangement[property]-1].images}
                                   roomId={id}
                                   roomArtId={art[arrangement[property]-1].id}
                                   nullFrame={(art[arrangement[property]-1].artId==="NULLFRAME")}
                                   showprice={showPrices}
                                   passThroughClick={passThroughClick}
                                   isDrag={isDrag} 
                                   setIsDrag={setIsDrag}
                                   //ref={el => artRef.current[arrangement[property]-1] = el} 
                                   > </ArtWork>
                        </Draggable>  
                                   )
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
                     passThroughClick, isDrag, setIsDrag)}
                </div>)
            case 'cols':
                return (<div className='arrangement-col' key={id+uuidv4()}>
                    {recursiveArrange(arrangement[property], 
                    art,
                    ppi,
                    id,
                    showPrices, 
                    passThroughClick, isDrag, setIsDrag)}
                </div>)
            default:
                artArray.push((recursiveArrange(arrangement[property], art, ppi, id, showPrices, passThroughClick, isDrag, setIsDrag)))
        }   
    }
    return artArray
  }

  
  function ArtArrangement({arrangement, art, ppi, artHeight, id, showPrices, passThroughClick, isDrag, setIsDrag, xScale=1, yScale=1}) {
  // get the arrangement from the props data structure
  // at the root, each node name is the size to dictate the node
  // deal with the side effect of querying art data
  const arrangementStyle = {
    width: "100%",
    height: artHeight,
    position: "relative"
    // margin: "auto",
    // position: "absolute"
    // display: "flex",
    // alignItems: "center",
    // justifyContent: "center",
    // flexWrap: "wrap"
  }

  return (
  <div style={arrangementStyle}>{<RowArrangement arrangement={arrangement} art={art} ppi={ppi} id={id} 
  showPrices={showPrices} passThroughClick={passThroughClick} isDrag={isDrag} setIsDrag={setIsDrag}
    xScale={xScale} yScale={yScale}
  />}</div>
  )
  }


  export const RoomView = React.forwardRef( ({room, showPrices, passThroughClick}, screenshotRef) => {

    const globalState = useContext(store);
    const { state, dispatch } = globalState;
    const ref = useRef(null);
    const [dimensions, setDimensions] = useState({ width:0, height: 0 });
    const blurring = room.showingMenu ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}
    const [dragAmount, setDragAmount] = useState({x: 0, y: 0}); // have we just dragged the child element?
  

    const sensors = useSensors(
      useSensor(MouseSensor),
      useSensor(TouchSensor),
      useSensor(KeyboardSensor),
    );
    

    function handleDragStart(event) {
      if (event) {
        if (!state.dragging) {
          dispatch({type: "SET_DRAGGING", dragging: true})
      }
      }
    }

    function handleDragEnd(event) {
      setDragAmount({x: event.delta.x, y: event.delta.y});
        if (state.dragging) {
          dispatch({type: "SET_DRAGGING", dragging: false})
      }
    }

    useEffect(() => {
    setDimensions(ref.current ? {'width': ref.current.offsetWidth,
        'height': ref.current.offsetHeight}: {'width': 0, 'height': 0})
    }, [ref.current]);

    //TODO: include key for each PPI across each image
    const ZOOM = (dimensions.width >= 479) ? 1.0 * 500 / 350 : 1.0;
    const xScale = (dimensions.width >= 479) ? 500 / 350 : 1.0
    const yScale = (dimensions.width >= 479) ? 500 / 350 : 1.0
    const PPI = {'living_room': (2486.0/104.0 * (dimensions.width / 3991.0) * ZOOM),
                 'blank': (4.0*ZOOM)}

    const roomImage = {'living_room': process.env.PUBLIC_URL + '/livingroom_noart.png',
                        'blank': null}

    const artHeight = {'living_room': '50%', 'blank': '100%'}

    const backgroundGrid = (state.dragging)? {backgroundSize: `${PPI[room.roomType]*2}px ${PPI[room.roomType]*2}px`,
                            backgroundImage: "radial-gradient(circle, #000000 1px, rgba(0, 0, 0, 0) 1px)"} : {}

    const roomBackground = {
      width: "100%",
      maxWidth: "1000px",
      height: 296,
      overflow: "visible",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      margin: "auto"
    }

    return (
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} sensors={sensors} modifiers={[scaleByZoom(ZOOM)]}>
        <div className="roomview" style={{...blurring, ...backgroundGrid}} ref={screenshotRef}>
              <div style={{width: (dimensions.width>=1000)?'1000px':'100%', height: '15px', 'position': 'absolute', marginLeft: '15px'}}>
                <Ruler type='horizontal' textColor='white' backgroundColor='white' direction='start' zoom={PPI[room.roomType]} longLineSize={10} shortLineSize={0.1} unit={12}/>
              </div>
              <div className='leftRuler'>
                <Ruler type='vertical' textColor='white' backgroundColor='white' direction='start' zoom={PPI[room.roomType]} longLineSize={10} shortLineSize={0.1} unit={12}/>
              </div>
              <div ref={ref} style={roomBackground}>
                <ArtArrangement arrangement={room.arrangement} art={room.art} 
                ppi={PPI[room.roomType]} id={room.id}
                artHeight={artHeight[room.roomType]}
                showPrices={showPrices}
                passThroughClick={passThroughClick}
                isDrag={dragAmount}
                setIsDrag={setDragAmount}
                xScale={xScale}
                yScale={yScale}
                />
          </div>
        </div>
      </DndContext>
    )
  }
  )

  export function RoomDescription({name, artNumFilled, artNumTotal, priceRange, room, artDispatch, showingMenu, addNewMenu, sharedScreen=false}){

    const globalState = useContext(store);
    const { state, dispatch } = globalState;

    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const [nameAnchorEl, setNameAnchorEl] = React.useState(null);
    const [showName, setShowName] = React.useState(name);

    // added for name change
    const handleClick = (event) => {
      setNameAnchorEl(event.currentTarget);
    };
  
    const handleNameClose = () => {
      setNameAnchorEl(null);
    };
  
    const keyPress = (e) => {
      if(e.keyCode === 13){
        setNameAnchorEl(null);
      }
   }
  
    const handleNameChange = (event) => {
      setShowName(event.target.value);
      dispatch({type: 'NAME_ROOM', id: room.id, name: event.target.value})
    };
    
    const handleAddWorkClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleAddWorkClose = () => {
      setAnchorEl(null);
    };

    const addWorkOpen = Boolean(anchorEl);
    const popoverId = addWorkOpen ? 'simple-popover' : undefined;

    const openName = Boolean(nameAnchorEl);
    const namePopoverId = openName ? 'simple-popover' : undefined;

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

  const orientationFlip = (size) => {

    const size_prefix = size.slice(0,2)
    
    if (size_prefix === 'p_') {
      return 'l_'+size.slice(2)
    }
    else if (size_prefix === 'l_') {
      return 'p_'+size.slice(2)
    }
    else {return null}
  
  }

    //TODO: the case when this is the selected room!
    // TODO: memoize this function
    const artPriceExtractor = (art) => {
      if ("size_price_list" in art) {
        if (art.size_price_list) {
          let typeMatch = art.size_price_list.filter( a => (a.type.trim() === art.size) || (orientationFlip(a.type.trim()) === art.size) )
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
                            navigate('/walls')
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
            {(sharedScreen)?'Shared: '+name:name}
            {(!sharedScreen) && <>
            <span className="material-icons md-18" onClick={handleClick}>edit</span>
            <Popover 
              id={namePopoverId}
              open={openName}
              anchorEl={nameAnchorEl}
              onClose={handleNameClose}
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
          </Popover></>}
          </div>
          <div className="room-works">
            {(state.deletingArt)? 
            <>
            <Typography variant='body1'>Choose art to delete...</Typography>
            <Button variant='outlined' size='small' style={{"marginLeft": "15px"}} color={'secondary'} onClick={() => dispatch({type: 'TOGGLE_DELETING_ART', deletingArt: false})}>Back</Button>
            </>
            :
            <>
            {artNumFilled}/{artNumTotal}, ${Math.round(room.art.map(a => artPriceExtractor(a)).reduce((total, inp) => total+parseFloat(inp.substring(1)), 0))}
            <Button variant='outlined' size='small' style={{"marginLeft": "15px"}} color={buttonColor()} onClick={() => navigate('/purchase/'+room.id)}>Purchase Art</Button>
            {(!sharedScreen) ? <Button variant='outlined' size='small' style={{"marginLeft": "15px"}} color={'primary'} onClick={handleAddWorkClick}>Add Blank Art</Button>: <></>}
            <Popover 
              id={popoverId}
              open={addWorkOpen}
              anchorEl={anchorEl}
              onClose={handleAddWorkClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
          <SingleArtSelectMenu roomId={room.id} show={true} inputCallback={handleAddWorkClose}/>
          </Popover>
          </>
          }
          </div>
        </div>
        {(showingMenu) ?
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': false})}}>arrow_back</span>:
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': true})}}>more_horiz</span>
        }
      </div>
    )}
  }



const RoomMenu = React.forwardRef( ({art, room}, screenshotRef) => {

  const globalState = useContext(store);
  const { dispatch, state } = globalState;
  const [screenshot, setScreenshot] = useState(null);
  
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareEmail, setShareEmail] = React.useState('');

  const handleSaveEmail = (event) => {
    setShareEmail(event.target.value);
  }

  const handleShareClose = () => {
    setShareOpen(false);
  };

  const getScreenshot = () => {
    htmlToImage.toPng(screenshotRef?.current, {style: {'filter': 'none'}, pixelRatio: 1})
        .then(function (dataUrl) {
          var img = new Image();
          img.src = dataUrl;
          setScreenshot(img.src)
        })
        .catch(function (error) {
          console.error('oops, something went wrong with the image!', error);
        });
    setShareOpen(true);
  }



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
              dispatch({type: 'TOGGLE_DELETING_ART', deletingArt: true})
              dispatch({type: 'CLOSE_ALL_MENUS'})
              }}>remove_circle_outline</span>
            <div className="room-menu-text" onClick={() => {
              dispatch({type: 'TOGGLE_DELETING_ART', deletingArt: true})
              dispatch({type: 'CLOSE_ALL_MENUS'})
              }}>Delete art...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              navigate('/purchase/'+room.id)
              }}>shopping_cart</span>
            <div className="room-menu-text" onClick={() => {
              navigate('/purchase/'+room.id)
              }}>Purchase wall...</div>
          </div>
          {/* <div className="room-menu-single-item">  */}
            {/* <div className="room-menu-text" onClick={handleClick}>Rename...</div> */}
          {/* </div> */}
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => dispatch({type: "DELETE_ROOM", room: room})}>delete_outline</span>
            <div className="room-menu-text"  onClick={() => dispatch({type: "DELETE_ROOM", room: room})}>Delete wall...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={getScreenshot}>share</span>
            <div className="room-menu-text"  onClick={getScreenshot}>Save/Share wall...</div>
          </div>
          <Dialog
              open={shareOpen}
              onClose={handleShareClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
            <DialogTitle id="alert-dialog-title">{"Save or share options"}</DialogTitle>
            <DialogActions>
            <div className='share-options'>
            <div>
            <TextField id="email-save" label="Send to my email..." value={shareEmail} onChange={handleSaveEmail}/>
            <Button onClick={() => {
                handleShareClose();
                postData('/share/', {app_state: state, 
                                     image: screenshot?.slice('data:image/png;base64,'.length), 
                                     room_id: room.id,
                                     email: shareEmail})
              }} color="primary">
                Send
              </Button>
              </div>
              <Button 
              variant='outlined'
              onClick={() => {
                handleShareClose();
                postData('/share/', {app_state: state, 
                                     image: '', 
                                     room_id: room.id,
                                     email: ''})
                navigator.clipboard.writeText(process.env.REACT_APP_PROD_DOMAIN+'/shared/'+state.sessionId+'/'+room.id)}}>Copy Link</Button>
                <div>
                <EmailShareButton url={process.env.REACT_APP_PROD_DOMAIN+'/shared/'+state.sessionId+'/'+room.id}
                  beforeOnClick={() => { handleShareClose();
                postData('/share/', {app_state: state, 
                                     image: '', 
                                     room_id: room.id,
                                     email: ''})}}
                  subject="My Art Snob art wall"
                  body="Check out the art wall I created:">
                  <EmailIcon/>
                </EmailShareButton>
                <RedditShareButton url={process.env.REACT_APP_PROD_DOMAIN+'/shared/'+state.sessionId+'/'+room.id}
                  beforeOnClick={() => { handleShareClose();
                postData('/share/', {app_state: state, 
                                     image: '', 
                                     room_id: room.id,
                                     email: ''})}}
                                     title={'I created my own art wall.'}>
                  <RedditIcon/>
                </RedditShareButton>
                <FacebookShareButton url={process.env.REACT_APP_PROD_DOMAIN+'/shared/'+state.sessionId+'/'+room.id}
                  beforeOnClick={() => { handleShareClose();
                postData('/share/', {app_state: state, 
                                     image: '', 
                                     room_id: room.id,
                                     email: ''})}}
                                     quote={'I created my own art wall.'}>
                  <FacebookIcon/>
                </FacebookShareButton>
                <PinterestShareButton url={process.env.REACT_APP_PROD_DOMAIN+'/shared/'+state.sessionId+'/'+room.id}
                  beforeOnClick={() => { handleShareClose();
                postData('/share/', {app_state: state, 
                                     image: screenshot?.slice('data:image/png;base64,'.length), 
                                     room_id: room.id,
                                     email: 'pinterest@pinterest.pinterest'})}}
                                     description={'I created my own art wall on Art Snob.'}
                                     media={`https://storage.googleapis.com/deco-user-images/${state.sessionId}%7C${room.id}.png`}
                                     >
                  <PinterestIcon/>
                </PinterestShareButton>
                </div>
                </div>
            </DialogActions>
          </Dialog>
        </div>
        )
})  

  export function Rooms({sharedRooms=null}) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;

    let showPrices = false
    let headerClassModifier = ''
    const screenshotRef = useRef(null);

    if (state.potentialArt)
    {
      showPrices = true
      headerClassModifier = 'explain'
    } 
    else if (sharedRooms) {
      headerClassModifier = 'purchase'
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
        const roomToIter = sharedRooms?sharedRooms:state.rooms
        return (roomToIter.map((room, _) => {
          return (
                  <div className="room-menu-box" key={'rmb'+room.id}>
                    {(room.showingMenu) ? (<RoomMenu art={room.art} room={room} ref={screenshotRef}/>):''}
                    <div className="room" id={room.id} key={room.id}>

                      <RoomDescription key={'rd'+room.id} name={room.name} artNumFilled={room.art.filter(a => (a.artId !== null) & (a.artId !== 'NULLFRAME')).length} 
                            artNumTotal={room.art.length} artDispatch={dispatch} showingMenu={room.showingMenu} 
                            room={room} sharedScreen={sharedRooms!==null}></RoomDescription>
                      
                      <RoomView key={'rv'+room.id} room={room} showPrices={showPrices} ref={screenshotRef}></RoomView>

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
          (sharedRooms)?<RoomDescription name={"Make my own wall..."} artNumFilled={0} artNumTotal={0} room={{art:[]}} addNewMenu={true} artDispatch={dispatch}></RoomDescription>:
          <RoomDescription name={"Add new wall..."} artNumFilled={0} artNumTotal={0} room={{art:[]}} addNewMenu={true} artDispatch={dispatch}></RoomDescription>
        }
        </div>
       </div>
    )
  }