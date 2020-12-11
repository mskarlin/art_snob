import React, { useState,  useEffect, useRef, useContext } from 'react';
import { store } from './store.js';
import {ArtWork, RoomDescription, RoomView, useArrangementData} from './artComponents.js'
import Slider from '@material-ui/core/Slider';

import { navigate } from "@reach/router"
import { v4 as uuidv4 } from 'uuid';

export function RoomConfigurations() {
    return (
        <div style={{"marginTop": "77px", "height": "100%"}}>
        <div style={{"height": "100%"}}>
        {/*  ^^ this div used to be a form, switch back when ready*/}
        <div className='room-name-entry'>
          {SingleArtSelect(true)}
          {MultiArtSelect(true)}
        </div>
        </div>
    </div>
    )
}



function SingleArtSelect(show) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
  
    const selectionType = state.newRoomShow.selectionRoom.roomType ? state.newRoomShow.selectionRoom.roomType : ''
  
    const includeTest = () => {
      if (state.newRoomShow.selectionRoom.arrangementSize === 1) { return "Selected!"} else { return "Not Selected (tap to select)"}
    }
  
    const currentSizeLabel = (size) => {
      if (state.newRoomShow.selectionRoom.arrangementSize === 1 && state.newRoomShow.selectionRoom.art[0].size === size) {
        return 'selected'
      }
      else {
        return ''
      }
    }
  
    const includeShowPrice = (selectionType) => {if (['p_large', 'l_large'].includes(selectionType)) {return true} else {return false}}
  
    if (show){
      return (
        <>
        <div className="collection-heading">
              <div className="stacked-descriptors">
                <div className="collection-text "> 
                  Single work selections
                </div>
                <div className={(includeTest()!=="Selected!")?"collection-text-sub":"collection-text "}>
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
                    return (<div className={'single-work-view '+currentSizeLabel(size)} 
                    onClick={() => dispatch({type: "ADD_ARRANGEMENT",
                            art: [{id:1, size: size, artId: null}],
                            arrangement: {rows: 1},
                            arrangementSize: 1,
                            id: state.newRoomShow.selectionRoom.id, 
                            roomType: state.newRoomShow.selectionRoom.roomType, 
                            showingMenu: false})} key={size+name}>
                            {(currentSizeLabel(size)==='selected')?<span className="material-icons md-36" style={{'position': 'absolute',
                            'top': '5px', 'left': '5px', 'color': '#018E42', zIndex: 2}}>check_circle_outline</span>:<></>}
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
  
  function MultiArtSelect(show) {
    const globalState = useContext(store);
    const { dispatch, state } = globalState;
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
    const includeTest = () => {
        if (state.newRoomShow.selectionRoom.arrangementSize > 1) { return "Selected!"} else { return "Not Selected (tap to select)"}
      }


    if (show) {
    return (
    <>
    <div className="collection-heading">
            <div className="stacked-descriptors">
                <div className="collection-text "> 
                  Multi work selections
                </div>
                <div className={(includeTest()!=="Selected!")?"collection-text-sub":"collection-text "}>
                 {includeTest()}
                </div>
                </div>
                <div className="price-text">
                $150-$345
                </div>
            </div>
  
              <div>
              {roomSelect.map((room, _) => {
                let thisId = uuidv4()
                return (<div className="room" id={room.name} key={room.name}>
                        <RoomDescription name={room.name} artNumFilled={0} artNumTotal={room.arrangementSize} 
                        priceRange={[room.minprice, room.maxprice]} room={room}/>
                        <RoomView room={{roomType:'blank', arrangement: room.arrangement, art: room.art, id: thisId}} showPrices={true}></RoomView>
                        </div>)
                })
              }
              </div>
              </>
    )}
    else {
      return <></>
    }
  
  }