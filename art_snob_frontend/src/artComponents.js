import React, { useState,  useEffect, useRef } from 'react';
import {round} from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from "react-hook-form";
import Slider from '@material-ui/core/Slider';


export const useArtData = (artId, dispatch) => {
  useEffect(() => {
      if (artId){
          fetch('/art/'+artId)
          .then(response => response.json())
          .then(data => dispatch({...data, artId: artId, types: 'ADD_ART'}));
      }
      }, [artId, dispatch]);

}

function ArtWork(props) {
    const PPI = props.PPI ? props.PPI : 3.0
    const margin = props.margin ? props.margin: round(1.5*PPI) + "px"
    // are these needed??? or should state be lifted
    // const [artImage, setArtImage] = useState(props.artImage);
    // const [artId, setArtId] = useState(props.artId)

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
  
    let frame = {
          boxSizing: "border-box",
          width: round(artSize[props.size][0])+'px',
          height: round(artSize[props.size][1])+'px',
          overflow: "hidden",
          backgroundColor: "#F8F9FA",
          border: round(1*PPI) + "px"+" dashed #222",
          margin: margin,
          padding: round(2*PPI) + "px",
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
          fontSize: 14,
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

    return (
        <div style={frame} onClick={()=>clickAction(props.artId)}>
            <div style={imagePaper}>
        {(props.showprice) & (['p_large', 'l_large'].includes(props.size))
            ? <div style={priceFrame}>
                {artSize[props.size][0]/props.PPI+'" x '+artSize[props.size][1]/props.PPI+'"'}<br/>
                <span style={{"color": "#56876D", "fontWeight": 900}}>{priceRange[props.size]}</span>
              </div>
            : ''
        }
        </div>
        </div>
      )
  }
  
function recursiveArrange(arrangement, art, ppi, id, setArtDetailShow, artDispatch, potentialArt){
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
                     potentialArt)}
                </div>)
            case 'cols':
                return (<div className='arrangement-col' key={id+uuidv4()}>
                    {recursiveArrange(arrangement[property], 
                    art,
                    ppi,
                    id,
                    setArtDetailShow,
                    artDispatch,
                    potentialArt)}
                </div>)
            default:
                artArray.push((recursiveArrange(arrangement[property], art, ppi, id, setArtDetailShow, artDispatch, potentialArt)))
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
  <div style={arrangementStyle}>{recursiveArrange(props.arrangement, props.art, props.ppi, props.id, props.setArtDetailShow, props.artDispatch, props.potentialArt)}</div>
  )
  }
  

  function RoomView(props){

    const ref = useRef(null);
    const [dimensions, setDimensions] = useState({ width:0, height: 0 });

    useEffect(() => {
    setDimensions(ref.current ? {'width': ref.current.offsetWidth,
        'height': ref.current.offsetHeight}: {'width': 0, 'height': 0})
    }, [ref.current]);

    //TODO: include key for each PPI across each image
    const ZOOM = 1.5
    const PPI = {'living_room': (2486.0/104.0 * (dimensions.width / 3991.0) * ZOOM),
                 'blank': (3.0*ZOOM)}
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
      <div className="roomview">
        <div ref={ref} style={roomBackground}>
        <ArtArrangement arrangement={props.arrangement} art={props.art} 
        ppi={PPI[props.roomType]} id={props.id} setArtDetailShow={props.setArtDetailShow} 
        artDispatch={props.artDispatch} potentialArt={props.potentialArt} 
        artHeight={artHeight[props.roomType]}/>
        </div>
      </div>
    )
  }

  function RoomDescription(props){
    return(
      <div className="room-description">
        <div className="room-title">
          <div className="room-name">
            {props.name}
          </div>
          <div className="room-works">
            {props.artNumFilled}/{props.artNumTotal}
          </div>
        </div>
        <span className="material-icons md-36">add_circle_outline</span>
      </div>
    )
  }
  
function RoomConfigurationBrowse({currentName, selectionType}){
  const { register, handleSubmit, watch, errors } = useForm();
  const [numMultiWorks, setNumMultiWorks] = useState(2);
  const [priceFilter, setPriceFilter] = useState({'min': 20, 'max': 400});

  const onSubmit = data => console.log(data);

  // TODO: raise this to a higher level or make it pull from the backend
  // TODO: MOVE ALL THIS STATE INTO THE STATE STORE!! no more passing along :-D
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
    <div>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className='room-name-entry'>
          <div className='room-name-form'>
            Name:
          </div>
          <input className='name-form' name="room_name" defaultValue={currentName} ref={register}/>
        </div>
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
                      value={numMultiWorks}
                      min={2}
                      step={1}
                      max={10}
                      onChange={(event, value) => {setNumMultiWorks(value)}}
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
                    value={[priceFilter.min, priceFilter.max]}
                    min={20}
                    step={20}
                    max={400}
                    onChange={(event, value) => {setPriceFilter({'min': value[0], 'max': value[1]})}}
                    getAriaLabel={(index)=> index.toString()}
                    getAriaValueText={(value, index)=> value.toString()}
                    valueLabelDisplay="auto"
                  />
                </div>
              </div>
            </div>
          </div>
      
        <input type="submit" />
      </form>
    </div>
  )
}

  
  export function Rooms(props) {
    const blurring = props.artDetailShow ? {WebkitFilter: "blur(8px)", filter: "blur(8px)"} : {}

    const roomFeed = () => {
      if(props.newRoomShow){
        return (
            <div className="works-select-menu">
                <div className="explain-menu">
                  <span className="material-icons md-36" onClick={() => {props.setNewRoomShow(false)}}>keyboard_backspace</span>
                <div className="explain-text">Choose a name and artwork configuration</div>
              </div>
              <RoomConfigurationBrowse/>
            </div>
        )
      }
      else {
        return (props.rooms.map((room, _) => {
          return (<div className="room" id={room.id} key={room.id}>
                  <RoomDescription name={room.name} artNumFilled={0} artNumTotal={room.arrangementSize}></RoomDescription>
                  <RoomView roomType={room.roomType} arrangement={room.arrangement} art={room.art} id={room.id} setArtDetailShow={props.setArtDetailShow} artDispatch={props.artDispatch} potentialArt={props.potentialArt}></RoomView>
                  </div>)
          })
          )

      }

    }


    return(
    <div className="room-main">
        <div className="room-feed" style={blurring}>
        {
          roomFeed()
        }
        {
          (props.newRoomShow == false) ? <RoomDescription name={"Add new room..."} artNumFilled={0} artNumTotal={0}></RoomDescription> : ''
        }
        </div>
       </div>
    )
  }