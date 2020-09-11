import React, { useState,  useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import {round} from 'mathjs';
import { addPropertyControls } from 'framer';
import { v4 as uuidv4 } from 'uuid';


function ArtWork(props) {
    const PPI = props.PPI ? props.PPI : 3.0
    const margin = props.margin ? props.margin: round(1.5*PPI) + "px"
    // are these needed??? or should state be lifted
    const [artImage, setArtImage] = useState(props.artImage);
    const [artId, setArtId] = useState(props.artId)

    // art size, including frames (~1 inch either way)
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
          padding: round(2*PPI) + "px"
        }
    
    let imagePaper = {width: "100%",
                        height: "100%"
                        }
    
    if (artImage) {
        frame = {...frame,
                border: round(1*PPI) + "px"+" solid #222"}
        
        imagePaper = {...imagePaper,
            backgroundImage: "url(" + artImage + ")",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center"}
    }
            
    const priceFrame = {
          width: round(artSize[props.size][0])+'px',
          height: round(artSize[props.size][1])+'px',
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
    
    return (
        <div style={frame}>
            <div style={imagePaper}>
        {(props.showprice)
            ? <div style={priceFrame}>
                {artSize[props.size][0]/props.PPI+'" x '+artSize[props.size][1]/props.PPI+'"'}
                <span style="color: #56876D">{priceRange[props.size]}</span>
              </div>
            : ''
        }
        </div>
        </div>
      )
  }
  
function recursiveArrange(arrangement, art, ppi, id){
    // recursively extract the row arrangement
    const artArray = [];
    // TODO need to add keys to the subelements here 
    for (const property in arrangement) {
        if (typeof(arrangement[property]) === "number"){
            artArray.push(<ArtWork key={id+(arrangement[property]-1).toString()}
                                   size={art[arrangement[property]-1].size} 
                                   PPI={ppi} 
                                   artId={art[arrangement[property]-1].artId}
                                   artImage={art[arrangement[property]-1].images}> </ArtWork>)
            continue
        }
        
        switch(property){
            case 'rows':  
                return (<div className='arrangement-row' key={id}>
                    {recursiveArrange(arrangement[property],
                     art,
                     ppi,
                     id)}
                </div>)
            case 'cols':
                return (<div className='arrangement-col' key={id}>
                    {recursiveArrange(arrangement[property], 
                    art,
                    ppi,
                    id)}
                </div>)
            default:
                artArray.push((recursiveArrange(arrangement[property], art, ppi, id)))
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
    height: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }

  return (
  <div style={arrangementStyle}>{recursiveArrange(props.arrangement, props.art, props.ppi, props.id)}</div>
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
    const PPI = {'living_room': (2486.0/104.0 * (dimensions.width / 3991.0) * ZOOM)}
    //TODO: set up centerline margins for each room...
    const centerLineMargins = {'living_room': "75px"}

    const roomBackground = {
      width: "100%",
      maxWidth: "500px",
      height: 296,
      overflow: "visible",
      backgroundImage: "url(" +props.roomBackground + ")",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      margin: "auto"
    }
  
    return (
      <div className="roomview">
        <div ref={ref} style={roomBackground}>
        <ArtArrangement arrangement={props.arrangement} art={props.art} ppi={PPI['living_room']} id={props.id}/>
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
  
  
  export function Rooms(props) {
    return(
    <div className="room-main">
        <div className="room-feed">
        {props.rooms.map((room, _) => {
                return (<div className="room" id={room.id} key={room.id}>
                        <RoomDescription name={room.name} artNumFilled={0} artNumTotal={room.arrangementSize}></RoomDescription>
                        <RoomView roomBackground={ process.env.PUBLIC_URL + '/livingroom_noart.png' } arrangement={room.arrangement} art={room.art} id={room.id}></RoomView>
                        </div>)
                })
        }
        </div>
       </div>
    )
  }