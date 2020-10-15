import React, { useState,  useEffect, useRef } from 'react';
import {round} from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from "react-hook-form";
import Slider from '@material-ui/core/Slider';
import { addPropertyControls } from 'framer';


export const useArtData = (artId, dispatch) => {
  useEffect(() => {
      if (artId){
          fetch('/art/'+artId)
          .then(response => response.json())
          .then(data => dispatch({...data, artId: artId, types: 'ADD_ART'}));
      }
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


function ArtWork(props) {
    const PPI = props.PPI ? props.PPI : 3.0
    const margin = props.margin ? props.margin: round(1.5*PPI) + "px"

    // art size, including frames (~1 inch either way)
    // TODO move into global state
    const artSize = {'p_xsmall': [12*PPI, 14*PPI], 'l_xsmall': [14*PPI, 12*PPI],
                'xsmall': [14*PPI, 14*PPI], 'p_small': [17*PPI, 23*PPI], 'l_small': [23*PPI, 17*PPI],
                'p_medium': [22*PPI, 28*PPI], 'l_medium': [28*PPI, 22*PPI], 'medium': [24*PPI, 24*PPI],
                'p_large': [28*PPI, 40*PPI], 'l_large': [40*PPI, 28*PPI]}
  
    const priceRange = {'p_xsmall': '$40-60',
                        'l_xsmall': '$40-60',
                        'xsmall': '$40-60',
                        'p_small': '$50-70',
                        'l_small': '$50-70',
                        'p_medium': '$70-90',
                        'l_medium': '$70-90',
                        'medium': '$80-115',
                        'p_large': '$150-200',
                        'l_large': '$150-200'
  }

  const priceTextSize = {'p_xsmall': '10px',
  'l_xsmall': '10px',
  'xsmall': '10px',
  'p_small': '11px',
  'l_small': '11px',
  'p_medium': '12px',
  'l_medium': '12px',
  'medium': '12px',
  'p_large': '14px',
  'l_large': '14px'}
  
    let nullFrameStyle = {
      width: round(artSize[props.size][0])+'px',
      height: round(artSize[props.size][1])+'px',
      overflow: "hidden",
      margin: margin,
      padding: round(2*PPI) + "px",
    }


    let frame = {
          boxSizing: "border-box",
          width: round(artSize[props.size][0])+'px',
          height: round(artSize[props.size][1])+'px',
          overflow: "hidden",
          backgroundColor: "#F8F9FA",
          border: round(1*PPI) + "px"+" dashed #222",
          margin: margin,
          padding: props.showprice ? 0 : round(2*PPI) + "px",
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
    
    if (props.artImage) {
        frame = {...frame,
                border: round(1*PPI) + "px"+" solid #222"}
        
        imagePaper = {...imagePaper,
            backgroundImage: "url(" + props.artImage + ")",
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
          fontSize: priceTextSize[props.size],
          letterSpacing: 0,
          lineHeight: 1.2,
          fontWeight: 400,
          fontStyle: "normal",
          textAlign: "center",
        }
    
    const clickAction = (artId) => {

      if (props.potentialArt.potentialArt) {
        props.artDispatch({...props.potentialArt.potentialArt, type: 'ADD_ART', roomId: props.roomId, roomArtId: props.roomArtId})
        props.potentialArt.setPotentialArt(null)
      }
      else if (artId) {
        props.setArtDetailShow(artId)
      }
      
    }

    const checkForNullFrame = (nullFrame) =>
    {
        if (nullFrame) {
          return <div style={nullFrameStyle}></div>
        }
        else {
            return (<div style={frame} onClick={()=>clickAction(props.artId)}>
            <div style={imagePaper}>
              {(props.showprice)
                  ? <div style={priceFrame}>
                      {artSize[props.size][0]/props.PPI+'" x '+artSize[props.size][1]/props.PPI+'"'}<br/>
                      <span style={{"color": "#56876D", "fontWeight": 900}}>{priceRange[props.size]}</span>
                    </div>
                  : ''
              }
              </div>
              </div>)
        }

    }

    return ( checkForNullFrame(props.nullFrame) )
  }
  
function recursiveArrange(arrangement, art, ppi, id, setArtDetailShow, artDispatch, potentialArt, showPrices){
    // recursively extract the row arrangement
    const artArray = [];
    // TODO need to add keys to the subelements here 
    for (const property in arrangement) {
        if (typeof(arrangement[property]) === "number"){
            artArray.push(<ArtWork key={id+(arrangement[property]-1).toString()}
                                   size={art[arrangement[property]-1].size} 
                                   PPI={ppi} 
                                   artId={art[arrangement[property]-1].artId}
                                   artImage={art[arrangement[property]-1].images}
                                   setArtDetailShow={setArtDetailShow}
                                   artDispatch={artDispatch}
                                   potentialArt={potentialArt}
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
                     setArtDetailShow,
                     artDispatch,
                     potentialArt, 
                     showPrices)}
                </div>)
            case 'cols':
                return (<div className='arrangement-col' key={id+uuidv4()}>
                    {recursiveArrange(arrangement[property], 
                    art,
                    ppi,
                    id,
                    setArtDetailShow,
                    artDispatch,
                    potentialArt, 
                    showPrices)}
                </div>)
            default:
                artArray.push((recursiveArrange(arrangement[property], art, ppi, id, setArtDetailShow, artDispatch, potentialArt, showPrices)))
        }   
    }
    return artArray
  }

  
  function ArtArrangement(props) {
  // get the arrangement from the props data structure
  // at the root, each node name is the size to dictate the node
  // deal with the side effect of querying art data
  const arrangementStyle = {
    width: "100%",
    height: props.artHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
  return (
  <div style={arrangementStyle}>{recursiveArrange(props.arrangement, props.art, props.ppi, props.id, props.setArtDetailShow, props.artDispatch, props.potentialArt, props.showPrices)}</div>
  )
  }
  

  function RoomView(props){

    const ref = useRef(null);
    const [dimensions, setDimensions] = useState({ width:0, height: 0 });
    const blurring = props.showingMenu ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}

 
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
      backgroundImage: "url(" +roomImage[props.roomType] + ")",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      margin: "auto"
    }

    return (
      <div className="roomview" style={blurring}>
        <div ref={ref} style={roomBackground}>
        <ArtArrangement arrangement={props.arrangement} art={props.art} 
        ppi={PPI[props.roomType]} id={props.id} setArtDetailShow={props.setArtDetailShow} 
        artDispatch={props.artDispatch} potentialArt={props.potentialArt} 
        artHeight={artHeight[props.roomType]}
        showPrices={props.showPrices}
        />
        </div>
      </div>
    )
  }

  function RoomDescription({name, artNumFilled, artNumTotal, priceRange, selection, onRoomAdd, room, onRoomSelect, setIsUpdated, artDispatch, showingMenu}){
    //TODO: the case when this is the selected room!

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
    else if (onRoomSelect) {
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
                            onRoomSelect({show: true, currentName: '', selectionRoom: {roomType: ''}});}} style={{"pointerEvents": "all"}}>add_circle_outline</span>
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
            {artNumFilled}/{artNumTotal}, ${room.art.map(a => a.price ? a.price : "$0").reduce((total, inp) => total+parseFloat(inp.substring(1)), 0)}
          </div>
        </div>
        {(showingMenu) ?
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': false})}}>arrow_back</span>:
        <span className="material-icons md-36" onClick={()=>{artDispatch({'type': 'CHANGE_MENU', 'id':room.id, 'menu': true})}}>more_horiz</span>
        }
      </div>
    )}
  }
  
function RoomConfigurationBrowse({currentName, selectionRoom, artDispatch, setNewRoomShow}){

  console.log("selectionRoom", selectionRoom)

  const [name, setName] = useState(currentName)
  const [isUpdated, setIsUpdated] = useState(false)
  const [thisRoom, setThisRoom] = useState(selectionRoom)
  const { register, handleSubmit, watch, errors } = useForm();
  const [numMultiWorks, setNumMultiWorks] = useState(2);
  const [numVisibleMultiWorks, setNumVisibleMultiWorks] = useState(2);
  const [priceFilter, setPriceFilter] = useState({'min': 20, 'max': 1200});
  const [visiblePriceFilter, setVisiblePriceFilter] = useState({'min': 20, 'max': 1200});
  const [roomSelect, setRoomSelect] = useState([{'name': null, 
                                              'art': {id:1, size: 'xsmall', artId: null}, 
                                              'arrangements': {'rows': [1], 
                                              'arrangementSize': 1}}])
  
  const selectionType = selectionRoom.roomType ? selectionRoom.roomType : ''

  useArrangementData(numMultiWorks, priceFilter, setRoomSelect)
  
  // problem is that the stuff we need in artDispatch is set at call time, and not updated...
  useEffect(() => {
    if (('name' in thisRoom) & (name != '') & (isUpdated == true)) {

      // TODO: we need to split this into a conditional 
      // then ADD_NAME and ADD_ARRANGEMENT if it's something that already exists
      if ('id' in selectionRoom) {
        artDispatch({type: "ADD_NAME", id: selectionRoom.id, name: name});
        artDispatch({type: "ADD_ARRANGEMENT", ...thisRoom, id: selectionRoom.id, roomType:selectionRoom.roomType, showingMenu: false});
      }
      else {
        artDispatch({type: "ADD_ROOM", room: {...thisRoom, name: name, id: uuidv4(), roomType: "blank", showingMenu: false}})
      }
      setNewRoomShow({show: false, currentName: '', selectionRoom: {roomType: ''}});
    }
    }, [thisRoom, name, artDispatch, setNewRoomShow]);

  const onSubmit = (data) => {
      setIsUpdated(true);
      setName(data["room_name"]);
  };

  // TODO: raise this to a higher level or make it pull from the backend
  // TODO: MOVE ALL THIS STATE INTO THE STATE STORE!! no more passing along :-D
  // TODO: then get all this data from the backend, no need to hard code
  const priceRange = {'p_xsmall': {'price': '$40-60', 'name': 'Extra Small', 'sizeDesc': '12" x 14"'},
                        'l_xsmall': {'price':'$40-60', 'name': 'Extra Small', 'sizeDesc': '14" x 12"'},
                        'xsmall': {'price': '$40-60', 'name': 'Extra Small', 'sizeDesc': '14" x 14"'},
                        'p_small': {'price': '$50-70', 'name': 'Small', 'sizeDesc': '17" x 23"'},
                        'l_small': {'price': '$50-70', 'name': 'Small', 'sizeDesc': '23" x 17"'},
                        'p_medium': {'price': '$70-90', 'name': 'Medium', 'sizeDesc': '22" x 28"'},
                        'l_medium': {'price': '$70-90', 'name': 'Medium', 'sizeDesc': '28" x 22"'},
                        'medium': {'price': '$80-115', 'name': 'Medium', 'sizeDesc': '24" x 24"'},
                        'p_large': {'price': '$150-200', 'name': 'Large', 'sizeDesc': '28" x 40"'},
                        'l_large': {'price': '$150-200', 'name': 'Large', 'sizeDesc': '40" x 28"'}
  }
  const includeTest = () => {if (selectionType in priceRange) { return "Selected"} else { return "Not Selected (tap to select)"}}
  const includeShowPrice = (selectionType) => {if (['p_large', 'l_large'].includes(selectionType)) {return true} else {return false}}
// gotta loop over artworks for the carousal
  return (
    <div style={{"marginTop": "45px"}}>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className='room-name-entry'>
          <div className='room-name-form'>
            Name:
          </div>
          <input className='name-form' name="room_name" defaultValue={currentName} ref={register}/>
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
            {Object.entries(priceRange).map(([size, {price, name, sizeDesc}], index)=>{
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
                  <RoomView roomType={'blank'} arrangement={room.arrangement} art={room.art} id={thisId} setArtDetailShow={null} 
                  artDispatch={null} potentialArt={null} showPrices={true}></RoomView>
                  </div>)
          })
        }
        </div>
      
    </div>
  )
}

function RoomMenu ({setArtRecommendationShow, setNewRoomShow, art, room, setCheckoutShow}) {

return (<div className="menu-box">
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {setArtRecommendationShow(art)}}>search</span>
            <div className="room-menu-text">Find art...</div>
          </div>
          {/* figure out why this doesn't work via adding the room to the feed?? */}
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {setNewRoomShow({currentName: room.name, selectionRoom: {...room, showingMenu: false}, show: true})}}>edit</span>
            <div className="room-menu-text">Change room...</div>
          </div>
          <div className="room-menu-single-item"> 
            <span className="material-icons md-36" onClick={() => {setCheckoutShow(room)}}>shopping_cart</span>
            <div className="room-menu-text">Purchase room...</div>
          </div>
        </div>
        )
}  


  export function Rooms(props) {
    const blurring = props.artDetailShow ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}
    let roomStyle = {...blurring}

    if (props.newRoomShow.show)
      {roomStyle = {...roomStyle, marginTop: '78px'}}

    const roomFeed = () => {
      if(props.newRoomShow.show){
        return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-36" onClick={() => {props.setNewRoomShow({...props.newRoomShow, show: false})}}>keyboard_backspace</span>
                <div className="explain-text">Choose a name and artwork configuration</div>
              </div>
              <RoomConfigurationBrowse currentName={props.newRoomShow.currentName} selectionRoom={props.newRoomShow.selectionRoom} artDispatch={props.artDispatch} setNewRoomShow={props.setNewRoomShow}/>
            </div>
        )
      }
      else {
        return (props.rooms.map((room, _) => {
          return (
                  <div className="room-menu-box">
                    {(room.showingMenu) ? (<RoomMenu setNewRoomShow={props.setNewRoomShow} art={room.art} room={room}/>):''}
                    <div className="room" id={room.id} key={room.id}>
                      <RoomDescription name={room.name} artNumFilled={room.art.filter(a => (a.artId != null) & (a.artId != 'NULLFRAME')).length} artNumTotal={room.arrangementSize} artDispatch={props.artDispatch} showingMenu={room.showingMenu} room={room}></RoomDescription>
                      <RoomView roomType={room.roomType} arrangement={room.arrangement} art={room.art} id={room.id} 
                      setArtDetailShow={props.setArtDetailShow} artDispatch={props.artDispatch} 
                      potentialArt={props.potentialArt} showingMenu={room.showingMenu}></RoomView>
                    </div>
                  </div>
                  )
          })
          )

      }

    }


    return(
    <div className="room-main">
        <div className="room-feed" style={roomStyle}>
        {
          roomFeed()
        }
        {
          (props.newRoomShow.show == false) ? <RoomDescription name={"Add new room..."} artNumFilled={0} artNumTotal={0} onRoomSelect={props.setNewRoomShow} room={{art:[]}}></RoomDescription> : ''
        }
        </div>
       </div>
    )
  }