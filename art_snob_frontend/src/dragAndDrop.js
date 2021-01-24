import React, {useState, useContext} from 'react';
import { store } from './store.js';
import _ from 'lodash';
import {useDraggable} from '@dnd-kit/core';

// TODO:
// resize the entire room or maybe allow for PPI zoom change? (new menu item)
// Move rename into an icon on the title itself to make room in menu
// change the frames to color select from a drop down..
// drag and drop on pc, not mobile
// Add in the share links for social media
// set zoom, room, room-view width to be dynamic by view screen size...

const relativeBorders = (x, y, referenceBoundingBox) => {
    return {bottom: y+referenceBoundingBox.height/2,
                          top: y-referenceBoundingBox.height/2,
                          left: x-referenceBoundingBox.width/2,
                          right: x+referenceBoundingBox.width/2}
}

// target ref needs to come from the transform calculation so it can change without element moving...
function snapToCenterOrEdge(targetRef, roomRefs) {
    // within 5px of an edge or the centerlines should create a snap!
    // first get rooms that are not the current room
    // schema
    //bottom: 463
    // height: 96
    // left: 59.5
    // right: 155.5
    // top: 367
    // width: 96
    // x: 59.5
    // y: 367
    const otherRooms = roomRefs.map(rr => rr?.getBoundingClientRect())
    const alignToCheck = ['bottom', 'left', 'right', 'top']
    const snapDirection = {bottom: 'y', left: 'x', right: 'x', top: 'y'}

    const filteredSnaps = _.shuffle(otherRooms).map(r => {

        const eligibleSnap = _.shuffle(alignToCheck).map( ac => {
            if (Math.abs(r[ac] - targetRef[ac]) < 10) {
                return [snapDirection[ac], r[ac] - targetRef[ac]]
            }
            else {
                return [null, null]
            }
        }
        )
        return eligibleSnap.filter(es => es[0] !== null)

    }).filter( x => x.length > 0)

    if (filteredSnaps.length > 0) {
        return filteredSnaps[0][0]
    }
    else {
        return [null, null]
    }
}


export function Draggable(props) {

  const Element = props.element || 'div';
  const globalState = useContext(store);
  const { state, dispatch } = globalState;

  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: props.id,
  });

  const [prevX, setPrevX] = useState(0)
  const [prevY, setPrevY] = useState(0)
  const [originX, setOriginX] = useState(props.x | 0)
  const [originY, setOriginY] = useState(props.y | 0)
//   const thisArt = state.rooms.filter(r=>props.roomId===r.id)[0].art[props.artIndex]
//   const selectedArtRect = props.artRef.current.filter((x,index)=> props.artIndex===index)[0]?.getBoundingClientRect()
  // set origin if it's not there
//   if (selectedArtRect && !(thisArt?.originX || thisArt?.originY)) {
//     dispatch({type: 'SET_ART_XY', 
//     x: null, 
//     y: null, 
//     originX: selectedArtRect.x+(selectedArtRect.width)/2.,
//     originY: selectedArtRect.y+(selectedArtRect.height)/2.,
//     roomId: props.roomId, 
//     roomArtId: props.roomArtId})
// }

//   if (props.artRef.current[0] && transform) {
//     // console.log(props.artRef.current[0].getBoundingClientRect())
//     const [snap, delta] = snapToCenterOrEdge(relativeBorders(thisArt?.originX+originX+transform.x,
//                                                     thisArt?.originY+originY+transform.y,
//                                                     selectedArtRect
//                                                     ), 
//                        props.artRef.current.filter((x,index)=> props.artIndex!==index))
    
//     if (snap && !((thisArt?.snap?.x || thisArt?.snap?.x==0) || (thisArt?.snap?.y  || thisArt?.snap?.y==0))) {
//         dispatch({type: 'SET_SNAP', 
//         x: originX+prevX+delta, 
//         y: originY+prevY+delta, 
//         snap: snap,
//         roomId: props.roomId, 
//         roomArtId: props.roomArtId})
//     } 
//     else if (!snap && ((thisArt?.snap?.x || thisArt?.snap?.x==0) || (thisArt?.snap?.y  || thisArt?.snap?.y==0))){
//         dispatch({type: 'SET_SNAP', 
//         x: null, 
//         y: null, 
//         snap: snap,
//         roomId: props.roomId, 
//         roomArtId: props.roomArtId})
//     }

//   }

  if (transform) {

    if (prevX !== transform.x || prevY !== transform.y){
      setPrevX(transform.x)
      setPrevY(transform.y)
    }
  

 } else {
     // prevX,Y will be relative to the initial origin x,y
     // we need to move the origin to account for this
    if ((originX+prevX) !== originX || (originY+prevY) !== originY) {
        // console.log('setting origin X', prevX, originX+prevX)
        // console.log('setting origin Y', prevY, originY+prevY)
        setOriginX(originX+prevX)
        setOriginY(originY+prevY)
        setPrevX(0)
        setPrevY(0)
        dispatch({type: 'SET_ART_XY', 
        x: originX+prevX, 
        y: originY+prevY, 
        // originX: selectedArtRect.x+(selectedArtRect.right-selectedArtRect.left)/2.,
        // originY: selectedArtRect.y+(selectedArtRect.bottom-selectedArtRect.top)/2.,
        roomId: props.roomId, 
        roomArtId: props.roomArtId})
    }
 }
    
  const style = (transform) ? {transform: `translate3d(${originX+transform.x}px, 
    ${originY+transform.y}px, 0)`} :
  {transform: `translate3d(${originX}px, ${originY}px, 0)`};

  return (
    <Element ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {props.children}
    </Element>
  );
}

// return the transform object with zoom scaling
export function scaleByZoom(zoom) {
  
  return function scaledTranslate (args) {
    const {transform} = args
    return {
      ...transform,
      x: transform.x * zoom,
      y: transform.y * zoom,
    }
  }

 }