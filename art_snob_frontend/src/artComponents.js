import React, { useState,  useEffect, useRef, useContext } from 'react';
import {round} from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from "react-hook-form";
import Slider from '@material-ui/core/Slider';
import { addPropertyControls } from 'framer';
import { store } from './store.js';
import Button from '@material-ui/core/Button';

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Typography from '@material-ui/core/Typography';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';


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


export function ArtWork({ppi, artMargin, size, showprice, artImage, roomId, roomArtId, artId, nullFrame}) {

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
        let typeMatch = state.potentialArt.size_price_list.filter( a => a.type.trim() == size)
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
                      <span style={{"color": "#56876D", "fontWeight": 900}}>{artPriceExtractor()}</span>
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
                            const tmpRoom = {...state.blankRoom, id: uuidv4()}
                            dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: true}});}} 
                            style={{"pointerEvents": "all"}}>add_circle_outline</span>
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
  

  function getSteps() {
    return ['Choose name and inspiration', 'Choose art configuration'];
  }



function RoomConfigurationBrowse({activeStep}) {
  // working state for the room is based on the state.selectionRoom room
  const globalState = useContext(store);
  const { dispatch, state } = globalState;
  const { register, handleSubmit, watch, errors } = useForm();
  
  const [preferenceSelect, setPreferenceSelect] = useState('Tags')
  const [vibes, setVibes] = useState([])
  const [tags, setTags] = useState([])
  const [art, setArt] = useState([])
  const steps = getSteps();
  const tagEndpoint = '/taglist/'+state.sessionId
  const randomEndpoint = '/random/'
  const vibesEndpoint = '/vibes/'+state.sessionId


  useEffect(() => {
    fetch(tagEndpoint)
    .then(data => data.json())
    .then(json => {
      setTags(json.tags)
    })
    .catch(e => {
        // handle error
        return e
    })

    fetch(randomEndpoint)
    .then(data => data.json())
    .then(json => {
      setArt(json)
    })
    .catch(e => {
        // handle error
        return e
    })

    fetch(vibesEndpoint)
    .then(data => data.json())
    .then(json => {
      setVibes(json.vibes)
    })
    .catch(e => {
        // handle error
        return e
    })

    // clean up - clear the tags
    return () => {
      setArt([])
    }

    }, [tagEndpoint, setTags, setArt, randomEndpoint, vibesEndpoint, setVibes])


  const selectorColor = (name, value) => {
    if (name === value) { return 'secondary'
    }
    else {
      return 'default'
    }
  }

  const tagOrVibeInListColor = (t, list) => {
    if (list.includes(t)) {
      return 'secondary'
    }
    else {
      return 'default'
    }
  }
  //todo: function for whether or not the state is qualified to move on (otherwise grey out the next button)


  const vibeColumn = (vibes) => {
    return (
    <div className='vert-column'>

            {vibes.map((v) => 
            <Card variant="outlined" key={v.Vibes} style={{'margin': '10px'}}>
              <CardContent>
              <Typography variant="h5">{v.Vibes}
              </Typography>
              <Typography variant="body2">{v.Tagline}</Typography>
              {v.Tags.slice(0, 5).map(i => {return <button className="tag-button small" key={i}>{i}</button>})}
              <Button variant="outlined" color={
                tagOrVibeInListColor(v.Vibes, state.newRoomShow.selectionRoom.vibes.map(v => v.Vibes))} 
              onClick={() => dispatch({type: 'TOGGLE_VIBE',  vibe: v})
              }>Select</Button>
              </CardContent>
            </Card>
            )}

          </div>)
  }

  const tagButtons = (tags) => {

    const tagCheck = (tagName) => {
        if (state.newRoomShow.selectionRoom.seedTags.includes(tagName)) {
          return 'selected'
        }
        else {
          return ''
        }
    }
  
    return (
    <div className='tag-select-container'>
      {tags.map(i => 
      {return <button className={"tag-button "+tagCheck(i.id.charAt(0).toUpperCase() + i.id.slice(1))}
                      key={i.id+'-TAG'} 
                      onClick={() => dispatch({type: 'TOGGLE_SEED_TAG',  seedTag: i.id.charAt(0).toUpperCase() + i.id.slice(1)})
                      }>{i.id}</button>
        })}
    </div>
  )
  }

  const imgColumn = (art) => {

    const imgCheck = (artName) => {
      if (state.newRoomShow.selectionRoom.seedArt.map(a => a.artId).includes(artName)) {
        return 'selected'
      }
      else {
        return ''
      }
  }
    return (
      <div className='vert-column'>
        {art.map((image, index) => {
                const { name, images, id } = image
                return (
                <div key={'art-'+index.toString()+index.toString() } className={'imgholder large'}>
                        {(imgCheck(image.id)==='selected')?<span className="material-icons md-48" style={{'position': 'absolute',
                        'color': '#018E42', zIndex: 2}}
                        
                        >check_circle_outline</span>:<></>}
                        <img
                        alt={name}
                        data-src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                        className={"imgholder img "+imgCheck(image.id)}
                        src={"https://storage.googleapis.com/artsnob-image-scrape/"+images}
                        style={{"pointerEvents": "all"}}
                        onClick={() => dispatch({type: 'TOGGLE_SEED_ART',  seedArt: {...image, artId: image.id}})}
                        />
                </div>
                )
            })}
      </div>
    )
  }

  const preferenceView = () => {

    switch(preferenceSelect){
      
      case 'Vibes':
        return (
        <>     
        <div className='select-explain'>
        Pick a vibe for this room's art:
        </div>
        <div className='preference-flex'>
            
          {vibeColumn(vibes.slice(0, vibes.length/2))}
          {vibeColumn(vibes.slice(vibes.length/2, vibes.length))}

        </div>
        </>
      )
      case 'Tags':
        return (
          <>
            <div className='select-explain'>
            Pick some tags for this room's art:
            </div>
            {tagButtons(tags)}
          </>
        )
      case 'Art':
        return (
          <>
          <div className='select-explain'>
            Choose some art to inspire this room:
          </div>
          <div className='preference-flex'>
            
            {imgColumn(art.slice(0, art.length/2))}
            {imgColumn(art.slice(art.length/2, art.length))}

          </div>
          </>
        )
    }
  }

  const preferenceStep = (show) => {
    if (show) {
          return (
          <>
          <div className='room-name-form'>
            Name:
            <input className='name-form' name="room_name" defaultValue={state.newRoomShow.currentName} ref={register}/>
          </div>
          <div className='button-split'>
            <Button variant="outlined" style={{"width": "25%"}} color={selectorColor('Vibes', preferenceSelect)} onClick={()=>setPreferenceSelect('Vibes')}>Vibes</Button>
            <Button variant="outlined" style={{"width": "25%"}} color={selectorColor('Tags', preferenceSelect)} onClick={()=>setPreferenceSelect('Tags')}>Tags</Button>
            <Button variant="outlined" style={{"width": "25%"}} color={selectorColor('Art', preferenceSelect)} onClick={()=>setPreferenceSelect('Art')}>Art</Button>
          </div>
          {preferenceView()}
        </>
        )
      }
  else {
    return <></>
  }
  }

  const stepViewer = () => {
    switch (activeStep) {
      case 0:
        return {showArt: false, showPreference: true}
      case 1:
        return {showArt: true, showPreference: false}
    }
  }

  return (
    <div style={{"marginTop": "45px", "height": "100%"}}>
        <div style={{"height": "100%"}}>
        {/*  ^^ this div used to be a form, switch back when ready*/}
        <div className='room-name-entry'>
            <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {preferenceStep(stepViewer().showPreference)}
          {SingleArtSelect(stepViewer().showArt)}
        </div>
        </div>
    </div>
  )
}

function SingleArtSelect({show}) {
  const globalState = useContext(store);
  const { dispatch, state } = globalState;

  const selectionType = state.newRoomShow.selectionRoom.roomType ? state.newRoomShow.selectionRoom.roomType : ''

  const includeTest = () => {if (selectionType in state.priceRange) { return "Selected"} else { return "Not Selected (tap to select)"}}
  const includeShowPrice = (selectionType) => {if (['p_large', 'l_large'].includes(selectionType)) {return true} else {return false}}

  if (show){
    return (
      <>
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
        </>
    )
  }
  else {
    return <></>
  }
}


function RoomConfigurationBrowseOrig(){
  
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
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: room.name, selectionRoom: {...room, showingMenu: false}, show: true}})
              }}>edit</span>
            <div className="room-menu-text">Change room...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {
              dispatch({type: 'PURCHASE_LIST', purchaseList: [room]})
              }}>shopping_cart</span>
            <div className="room-menu-text">Purchase room...</div>
          </div>
        </div>
        )
}  

  export function Rooms() {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
    const [activeStep, setActiveStep] = useState(0);

    const handleNext = () => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
  
    const handleBack = () => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
  
    const handleReset = () => {
      setActiveStep(0);
    };
    const blurring = state.artDetailShow ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}
    let roomStyle = {...blurring}
    let showPrices = false

    if (state.newRoomShow.show)
      {roomStyle = {...roomStyle, marginTop: '78px'}}

    if (state.potentialArt)
    {
      roomStyle = {...roomStyle, marginTop: '237px'};
      showPrices = true
    } 


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

    
    // TODO: need to grey out buttons when a selection has yet to be made, then solidify when ready
    const buttonCopy = () =>{
      switch(activeStep) {
        case 0:
          return (
            {
              backFunc: () => {dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'})},
              backCopy: 'Back to rooms',
              forCopy: 'Continue',
              forFunc: handleNext
            }
          )
        case 1:
          return (
            {
              backFunc: handleBack,
              backCopy: 'Back',
              forCopy: 'Add room and choose art',
              forFunc: () => {
                dispatch({type: 'ADD_ROOM', 'room': state.newRoomShow.selectionRoom});
                dispatch({type: 'TOGGLE_NEW_ROOM_SHOW'});
                dispatch({type: 'ART_BROWSE_SEED', artBrowseSeed: state.newRoomShow.selectionRoom.art})
              }
            }
          )

      }

    }

    const roomFeed = () => {
      if(state.newRoomShow.show){
        // if we didn't come from a room (to edit it) then we need to make a working room that we're going to be editing
        if (!'id' in state.newRoomShow.selectionRoom) {
          const tmpRoom = {...state.blankRoom, id: uuidv4()}
          dispatch({type: 'ASSIGN_NEW_ROOM_SHOW', newRoomShow: {currentName: '', selectionRoom: tmpRoom, show: true}})
        }
        return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-36" onClick={buttonCopy().backFunc}>keyboard_backspace</span>
                  <div className="explain-text">{buttonCopy().backCopy}</div>
                  <div className="next-buttons">
                    <div className="explain-text-next">{buttonCopy().forCopy}</div>
                    <span className="material-icons md-36" onClick={buttonCopy().forFunc}>keyboard_arrow_right</span>
                  </div>
              </div>
              <RoomConfigurationBrowse activeStep={activeStep}/>
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
                      
                      <RoomView key={'rv'+room.id} room={room} showPrices={showPrices}></RoomView>

                    </div>
                  </div>
                  )
          })
          )

      }

    }


    return(
    ((!state.artBrowseSeed) && (!state.purchaseList)) && (
    <div className="room-main">
        <div className="room-feed" style={roomStyle}>
        {artExplain()}
        {
          roomFeed()
        }
        {
          (state.newRoomShow.show === false) ? <RoomDescription name={"Add new room..."} artNumFilled={0} artNumTotal={0} room={{art:[]}} addNewMenu={true} artDispatch={dispatch}></RoomDescription> : ''
        }
        </div>
       </div>
    ))
  }